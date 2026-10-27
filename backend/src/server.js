import "dotenv/config";
import { app } from "./app.js";
import { pool } from "./config/db.js";

const port = Number(process.env.PORT || 3000);

const server = app.listen(port, () => {
  console.log(`VITAGUA API disponible en http://localhost:${port}`);
});

async function cerrarServidor(signal) {
  console.log(`Se recibió ${signal}; cerrando el servidor...`);

  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error("Error al cerrar la conexión con PostgreSQL:", error.message);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => cerrarServidor("SIGINT"));
process.on("SIGTERM", () => cerrarServidor("SIGTERM"));
