require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("Falta JWT_SECRET en el archivo .env (mínimo 32 caracteres). Revisa .env.example.");
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

// API
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tutores", require("./routes/tutores"));
app.use("/api", (req, res) => res.status(404).json({ error: "Ruta no encontrada." }));

// Front-end (solo la carpeta public/, nunca el código del servidor ni el .env)
app.use(express.static(path.join(__dirname, "..", "public")));

// Manejador central de errores
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Datos inválidos." });
  res.status(500).json({ error: "Ocurrió un error en el servidor. Inténtalo más tarde." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agenda-hub listo en http://localhost:${PORT}`));
