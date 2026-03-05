/**
 * Rutas de la API para personas (CRUD mínimo).
 * Reciben peticiones del frontend y usan la base de datos.
 */
import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

/** GET /api/personas - Lista todas las personas */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre, edad FROM personas ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar personas" });
  }
});

/** POST /api/personas - Crea una persona (nombre, edad) */
router.post("/", async (req: Request, res: Response) => {
  const { nombre, edad } = req.body;
  if (!nombre || edad == null) {
    return res.status(400).json({
      error: "Faltan datos",
      esperado: { nombre: "string", edad: "number" },
    });
  }
  const edadNum = Number(edad);
  if (Number.isNaN(edadNum) || edadNum < 0 || edadNum > 150) {
    return res.status(400).json({ error: "Edad no válida" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO personas (nombre, edad) VALUES ($1, $2) RETURNING id, nombre, edad",
      [String(nombre).trim(), edadNum]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar persona" });
  }
});

export default router;
