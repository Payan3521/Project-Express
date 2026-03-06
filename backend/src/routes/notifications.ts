import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  try {
    const result = await pool.query(
      `SELECT id, type, task_id, message, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al listar notificaciones" });
  }
});

router.patch("/:id/read", async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }
  try {
    const result = await pool.query(
      "UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id, read_at",
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al marcar como leída" });
  }
});

export default router;