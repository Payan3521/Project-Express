import { Router, Request, Response } from "express";
import { pool, createNotification } from "../db";

const router = Router();

const USER_SELECTABLE_STATUSES = ["pending", "in_progress", "completed"];

const TASK_DATE_FIELDS = ["start_at", "due_at", "reminder_sent_at", "created_at", "updated_at"];

function parseDateTime(value: unknown): string | null {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  return s || null;
}

/** Serializa fechas de una tarea a ISO con Z para que el frontend las interprete en UTC y muestre en local. */
function serializeTask(task: Record<string, unknown>): Record<string, unknown> {
  const out = { ...task };
  for (const key of TASK_DATE_FIELDS) {
    const v = out[key];
    if (v instanceof Date) out[key] = v.toISOString();
    else if (v != null && typeof v === "string" && !v.endsWith("Z") && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v))
      out[key] = new Date(v).toISOString();
  }
  return out;
}

// Crear tarea. created_at lo asigna la BD (DEFAULT NOW()); no se acepta del cliente.
router.post("/", async (req: Request, res: Response) => {
  const { title, description, status, start_at, due_at } = req.body;
  const userId = (req as any).userId as number;

  if (!title) {
    return res.status(400).json({ error: "title es obligatorio" });
  }

  const finalStatus =
    status && USER_SELECTABLE_STATUSES.includes(status) ? status : "pending";
  const startAt = parseDateTime(start_at);
  const dueAt = parseDateTime(due_at);
  const descriptionVal =
    description != null && typeof description === "string"
      ? description.trim()
      : null;

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status, start_at, due_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, title, description, status, start_at, due_at, reminder_sent_at, created_at, updated_at`,
      [userId, title.trim(), descriptionVal, finalStatus, startAt, dueAt]
    );
    const task = result.rows[0];
    try {
      await createNotification(
        userId,
        "task_created",
        `Nueva tarea: ${task.title}`,
        Number(task.id)
      );
    } catch (notifErr) {
      console.error("Error al crear notificación de tarea nueva:", notifErr);
      // La tarea ya se creó; respondemos 201 igual para no fallar al usuario
    }
    return res.status(201).json(serializeTask(task));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear tarea" });
  }
});

// Obtener todas las tareas (o por estado con ?status=...)
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const status = req.query.status as string | undefined;
  const params: any[] = [userId];
  let where = "WHERE user_id = $1";

  if (status) {
    where += " AND status = $2";
    params.push(status);
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, title, description, status, start_at, due_at, reminder_sent_at, created_at, updated_at
       FROM tasks
       ${where}
       ORDER BY created_at DESC`,
      params
    );
    return res.json(result.rows.map((r) => serializeTask(r)));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al listar tareas" });
  }
});

// Obtener tarea por id
router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }
  try {
    const result = await pool.query(
      "SELECT id, user_id, title, description, status, start_at, due_at, reminder_sent_at, created_at, updated_at FROM tasks WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    return res.json(serializeTask(result.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener tarea" });
  }
});

// Modificar tarea (solo estados elegibles por el usuario; not_done lo asigna el sistema)
// Solo se actualizan los campos enviados en el body (actualización parcial).
router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const id = Number(req.params.id);
  const { title, description, status, start_at, due_at } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }

  if (status !== undefined && !USER_SELECTABLE_STATUSES.includes(status)) {
    return res.status(400).json({
      error: "status inválido; solo se permiten: pending, in_progress, completed",
    });
  }

  try {
    const current = await pool.query(
      "SELECT id, title, status FROM tasks WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    const previousStatus = current.rows[0].status;

    const parts: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let idx = 1;
    if (req.body.title !== undefined) {
      parts.push(`title = $${idx++}`);
      values.push(title ?? null);
    }
    if (req.body.description !== undefined) {
      parts.push(`description = $${idx++}`);
      values.push(description ?? null);
    }
    if (req.body.status !== undefined) {
      parts.push(`status = $${idx++}`);
      values.push(status ?? null);
    }
    if (req.body.start_at !== undefined) {
      parts.push(`start_at = $${idx++}`);
      values.push(parseDateTime(start_at));
    }
    if (req.body.due_at !== undefined) {
      parts.push(`due_at = $${idx++}`);
      values.push(parseDateTime(due_at));
    }

    values.push(id, userId);
    const result = await pool.query(
      `UPDATE tasks SET ${parts.join(", ")}
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING id, user_id, title, description, status, start_at, due_at, reminder_sent_at, created_at, updated_at`,
      values
    );
    const task = result.rows[0];

    if (status === "completed" && previousStatus !== "completed") {
      try {
        await createNotification(
          userId,
          "task_completed",
          `Tarea completada: ${task.title}`,
          Number(task.id)
        );
      } catch (notifErr) {
        console.error("Error al crear notificación de tarea completada:", notifErr);
      }
    }
    return res.json(serializeTask(task));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar tarea" });
  }
});

// Eliminar tarea
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al eliminar tarea" });
  }
});

export default router;