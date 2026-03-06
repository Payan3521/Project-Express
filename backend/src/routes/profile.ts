import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// Perfil del usuario autenticado
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener perfil" });
  }
});

export default router;