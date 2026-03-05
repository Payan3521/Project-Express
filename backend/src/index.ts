import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "API funcionando 🚀" });
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});