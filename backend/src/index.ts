import cors from "cors";
import express from "express";
import { initDb } from "./db";
import { authRequired } from "./middleware/auth";
import { startNotificationsCron } from "./jobs/notificationsCron";
import personasRoutes from "./routes/personas";
import authRoutes from "./routes/auth";
import { usersPublicRoutes, usersProtectedRoutes } from "./routes/users";
import tasksRoutes from "./routes/tasks";
import profileRoutes from "./routes/profile";
import statsRoutes from "./routes/stats";
import notificationsRoutes from "./routes/notifications";
import debugRoutes from "./routes/debug";

const app = express();
const PORT = 8080;

// CORS: permite que el frontend (otro origen, ej. localhost:3000) llame a esta API
app.use(cors());

// Middleware: permite leer el body en JSON
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API funcionando 🚀" });
});

// Demo anterior (personas) - puedes quitarlo cuando no lo necesites
app.use("/api/personas", personasRoutes);

// Autenticación (login/logout)
app.use("/api/auth", authRoutes);

// Registro (público, sin JWT) y gestión de usuarios (protegido)
app.use("/api/users", usersPublicRoutes);
app.use("/api/users", authRequired, usersProtectedRoutes);

// Tareas (CRUD + filtro por estado)
app.use("/api/tasks", authRequired, tasksRoutes);

// Perfil del usuario autenticado
app.use("/api/profile", authRequired, profileRoutes);

// Estadísticas de tareas (consultas en paralelo)
app.use("/api/stats", authRequired, statsRoutes);

// Notificaciones (nueva tarea, completada, vencida, recordatorio)
app.use("/api/notifications", authRequired, notificationsRoutes);

// Diagnóstico del cron de notificaciones (solo con sesión)
app.use("/api/debug", authRequired, debugRoutes);

async function start() {
  await initDb();
  startNotificationsCron();
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("No se pudo iniciar:", err);
  process.exit(1);
});
