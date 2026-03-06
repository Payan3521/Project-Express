/**
 * Job que corre cada 15 segundos:
 * - Tareas con due_at pasada y sin completar → status = not_done + notificación "vencida"
 * - Tareas con start_at llegada y sin recordatorio → notificación "es hora de hacer"
 * Usa la hora actual de la aplicación ($1) para evitar diferencias de zona horaria con la BD.
 */
import { pool, createNotification } from "../db";

const INTERVAL_MS = 15 * 1000; // 15 segundos

export function startNotificationsCron(): void {
  async function run() {
    const now = new Date(); // misma referencia de tiempo para ambas consultas
    let client;
    try {
      client = await pool.connect();

      // 1) Vencidas: due_at < now y status pendiente o en curso
      const overdue = await client.query(
        `UPDATE tasks
         SET status = 'not_done', updated_at = NOW()
         WHERE due_at IS NOT NULL AND due_at < $1
           AND status IN ('pending', 'in_progress')
         RETURNING id, user_id, title`,
        [now]
      );
      client.release();
      client = null;

      for (const row of overdue.rows) {
        try {
          await createNotification(
            row.user_id,
            "task_overdue",
            `Tarea vencida: ${row.title}`,
            Number(row.id)
          );
          console.log("[Cron] Notificación vencida creada: tarea", row.id, row.title);
        } catch (e) {
          console.error("[Cron] Error creando notificación vencida tarea", row.id, e);
        }
      }
      if (overdue.rows.length > 0) {
        console.log("[Cron] Tareas marcadas vencidas:", overdue.rows.length);
      }

      // 2) Recordatorio: start_at <= now y reminder_sent_at IS NULL
      client = await pool.connect();
      const reminders = await client.query(
        `UPDATE tasks
         SET reminder_sent_at = NOW()
         WHERE start_at IS NOT NULL AND start_at <= $1
           AND reminder_sent_at IS NULL
         RETURNING id, user_id, title`,
        [now]
      );
      client.release();
      client = null;

      for (const row of reminders.rows) {
        try {
          await createNotification(
            row.user_id,
            "task_reminder",
            `Es hora de hacer: ${row.title}`,
            Number(row.id)
          );
          console.log("[Cron] Notificación recordatorio creada: tarea", row.id, row.title);
        } catch (e) {
          console.error("[Cron] Error creando notificación recordatorio tarea", row.id, e);
        }
      }
      if (reminders.rows.length > 0) {
        console.log("[Cron] Recordatorios enviados:", reminders.rows.length);
      }
    } catch (err) {
      console.error("[Cron] Error en job de notificaciones:", err);
    } finally {
      if (client) client.release();
    }
  }

  run().catch((err) => console.error("[Cron] Error en primera ejecución:", err));
  setInterval(() => run().catch(() => {}), INTERVAL_MS);
  console.log("[Cron] Notificaciones (vencidas + recordatorios) iniciado, intervalo", INTERVAL_MS / 1000, "s");
}

/** Ejecuta una sola vez la lógica del cron (para pruebas manuales desde GET /api/debug/run-cron). */
export async function runNotificationsOnce(): Promise<{ overdue: number; reminders: number }> {
  const now = new Date();
  let overdueCount = 0;
  let reminderCount = 0;
  let client;

  try {
    client = await pool.connect();
    const overdue = await client.query(
      `UPDATE tasks
       SET status = 'not_done', updated_at = NOW()
       WHERE due_at IS NOT NULL AND due_at < $1
         AND status IN ('pending', 'in_progress')
       RETURNING id, user_id, title`,
      [now]
    );
    client.release();
    client = null;

    for (const row of overdue.rows) {
      try {
        await createNotification(row.user_id, "task_overdue", `Tarea vencida: ${row.title}`, Number(row.id));
        overdueCount++;
      } catch (e) {
        console.error("[Cron] Error notificación vencida tarea", row.id, e);
      }
    }

    client = await pool.connect();
    const reminders = await client.query(
      `UPDATE tasks
       SET reminder_sent_at = NOW()
       WHERE start_at IS NOT NULL AND start_at <= $1
         AND reminder_sent_at IS NULL
       RETURNING id, user_id, title`,
      [now]
    );
    client.release();
    client = null;

    for (const row of reminders.rows) {
      try {
        await createNotification(row.user_id, "task_reminder", `Es hora de hacer: ${row.title}`, Number(row.id));
        reminderCount++;
      } catch (e) {
        console.error("[Cron] Error notificación recordatorio tarea", row.id, e);
      }
    }
  } catch (err) {
    console.error("[Cron] Error en runNotificationsOnce:", err);
    if (client) client.release();
  }
  return { overdue: overdueCount, reminders: reminderCount };
}
