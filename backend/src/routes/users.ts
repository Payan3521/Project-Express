import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db";

// Router público: solo registro (sin JWT, para usuarios no autenticados)
const publicRouter = Router();
publicRouter.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email y password son obligatorios" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name.trim(), String(email).toLowerCase().trim(), hashed]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    return res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Router protegido: CRUD de usuarios (requiere JWT)
const protectedRouter = Router();
protectedRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users ORDER BY id DESC"
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al listar usuarios" });
  }
});

protectedRouter.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener usuario" });
  }
});

protectedRouter.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name } = req.body;
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }
  const currentUserId = (req as any).userId;
  if (currentUserId !== id) {
    return res.status(403).json({ error: "Solo puedes modificar tu propio usuario" });
  }
  if (!name) {
    return res.status(400).json({ error: "name es obligatorio" });
  }
  try {
    const result = await pool.query(
      "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, created_at",
      [name.trim(), id]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

protectedRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }
  const currentUserId = (req as any).userId;
  if (currentUserId !== id) {
    return res.status(403).json({ error: "Solo puedes eliminar tu propio usuario" });
  }
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

export { publicRouter as usersPublicRoutes, protectedRouter as usersProtectedRoutes };