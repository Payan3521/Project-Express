import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email y password son obligatorios" });
  }
  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [String(email).toLowerCase().trim()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET no está configurado" });
    }
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      secret,
      { expiresIn: "1h" }
    );
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// Para JWT sin estado, el logout es responsabilidad del cliente (borrar el token).
router.post("/logout", async (_req: Request, res: Response) => {
  return res.json({ message: "Logout OK (borra el token en el cliente)" });
});

export default router;
