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
 * Crea la tabla personas si no existe (id, nombre, edad).
 * Se ejecuta al iniciar la app.
 */
export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS personas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        edad INTEGER NOT NULL
      );
    `);
    console.log("Tabla 'personas' lista.");
  } finally {
    client.release();
  }
}

export { pool };
