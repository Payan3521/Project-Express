/**
 * Rutas de diagnóstico para el cron de notificaciones.
 */
import { Router, Request, Response } from "express";
import { pool } from "../db";
import { runNotificationsOnce } from "../jobs/notificationsCron";

const router = Router();

router.get("/notification-check", async (_req: Request, res: Response) => {
  const now = new Date();
  try {
    const [dbTimeRes, overdueRes, remindersRes] = await Promise.all([
      pool.query("SELECT NOW() AS db_now"),
      pool.query(
        `SELECT id, user_id, title, due_at, status
         FROM tasks
         WHERE due_at IS NOT NULL AND due_at < $1
           AND status IN ('pending', 'in_progress')
         ORDER BY due_at ASC`,
        [now]
      ),
      pool.query(
        `SELECT id, user_id, title, start_at, reminder_sent_at
         FROM tasks
         WHERE start_at IS NOT NULL AND start_at <= $1
           AND reminder_sent_at IS NULL
         ORDER BY start_at ASC`,
        [now]
      ),
    ]);

    const dbNow = dbTimeRes.rows[0]?.db_now;
    return res.json({
      app_now: now.toISOString(),
      db_now: dbNow instanceof Date ? dbNow.toISOString() : String(dbNow),
      overdue_tasks: overdueRes.rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        due_at: r.due_at instanceof Date ? r.due_at.toISOString() : r.due_at,
        status: r.status,
      })),
      reminder_tasks: remindersRes.rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        start_at: r.start_at instanceof Date ? r.start_at.toISOString() : r.start_at,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error en diagnóstico" });
  }
});

/** Ejecuta el cron de notificaciones una vez (útil para probar sin esperar 15 s). */
router.post("/run-cron", async (_req: Request, res: Response) => {
  try {
    const result = await runNotificationsOnce();
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al ejecutar cron" });
  }
});

export default router;
