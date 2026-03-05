import cors from "cors";
import express from "express";
import { initDb } from "./db";
import personasRoutes from "./routes/personas";

const app = express();
const PORT = 8080;

// CORS: permite que el frontend (otro origen, ej. localhost:3000) llame a esta API
app.use(cors());

// Middleware: permite leer el body en JSON (para POST con { nombre, edad })
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API funcionando 🚀" });
});

// Rutas de personas (formulario → POST aquí → guarda en DB)
app.use("/api/personas", personasRoutes);

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("No se pudo iniciar:", err);
  process.exit(1);
});
