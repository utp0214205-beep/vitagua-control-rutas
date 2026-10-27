import express from "express";
import cors from "cors";
import helmet from "helmet";
import { comprobarConexionDB } from "./config/db.js";

export const app = express();

const origenPermitido = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: origenPermitido }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    estado: "correcto",
    servicio: "VITAGUA Registro de Rutas API"
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const datos = await comprobarConexionDB();
    res.status(200).json({
      estado: "correcto",
      baseDeDatos: "conectada",
      horaServidor: datos.servidor_hora
    });
  } catch (error) {
    console.error("No se pudo comprobar PostgreSQL:", error.message);
    res.status(503).json({
      estado: "error",
      baseDeDatos: "no disponible"
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ mensaje: "Recurso no encontrado." });
});

app.use((error, _req, res, _next) => {
  console.error("Error no controlado de la API:", error.message);
  res.status(500).json({ mensaje: "Ocurrió un error interno del servidor." });
});
