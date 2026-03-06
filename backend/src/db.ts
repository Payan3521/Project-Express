/**
 * Conexión a PostgreSQL.
 * Usa variables de entorno para no hardcodear credenciales.
 */
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME ?? "project_db",
  user: process.env.DB_USER ?? "project_user",
  password: process.env.DB_PASSWORD ?? "project_password",
});

/**
 * Inicializa el esquema de base de datos:
 * - users: usuarios registrados
 * - tasks: tareas asociadas a usuarios
 * (la tabla personas del ejemplo anterior puede seguir existiendo, no estorba)
 */
export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
    `);
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
    `);
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id
      ON tasks(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_status
      ON tasks(user_id, status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id
      ON notifications(user_id);
    `);

    await client.query("COMMIT");
    console.log("Tablas 'users', 'tasks' y 'notifications' listas.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export type NotificationType =
  | "task_created"
  | "task_completed"
  | "task_overdue"
  | "task_reminder";

export async function createNotification(
  userId: number,
  type: NotificationType,
  message: string,
  taskId: number | null = null
): Promise<void> {
  await pool.query(
    "INSERT INTO notifications (user_id, type, task_id, message) VALUES ($1, $2, $3, $4)",
    [userId, type, taskId, message]
  );
}

export { pool };
