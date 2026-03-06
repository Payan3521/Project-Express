import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// Estadísticas de tareas del usuario autenticado
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;

  try {
    const [totalRes, completedRes, pendingRes, last5Res] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM tasks WHERE user_id = $1", [userId]),
      pool.query(
        "SELECT COUNT(*)::int AS total FROM tasks WHERE user_id = $1 AND status = 'completed'",
        [userId]
      ),
      pool.query(
        "SELECT COUNT(*)::int AS total FROM tasks WHERE user_id = $1 AND status = 'pending'",
        [userId]
      ),
      pool.query(
        `SELECT id, title, description, status, created_at
         FROM tasks
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      ),
    ]);

    const total = totalRes.rows[0]?.total ?? 0;
    const completadas = completedRes.rows[0]?.total ?? 0;
    const pendientes = pendingRes.rows[0]?.total ?? 0;
    const porcentajeCumplimiento = total > 0 ? (completadas / total) * 100 : 0;

    return res.json({
      total_tareas: total,
      total_completadas: completadas,
      total_pendientes: pendientes,
      porcentaje_cumplimiento: porcentajeCumplimiento,
      ultimas_5_tareas: last5Res.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

export default router;