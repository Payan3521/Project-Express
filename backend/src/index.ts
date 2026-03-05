import express from "express";

const app = express();
const PORT = 8080;

app.get("/", (req, res) => {
  res.json({ message: "API funcionando 🚀" });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});