import pg from "pg";

const { Pool } = pg;

const sslEnabled = process.env.PGSSL === "true";

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: sslEnabled ? { rejectUnauthorized: true } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on("error", (error) => {
  console.error("Error inesperado en una conexión inactiva de PostgreSQL:", error.message);
});

export async function comprobarConexionDB() {
  const resultado = await pool.query("SELECT CURRENT_TIMESTAMP AS servidor_hora");
  return resultado.rows[0];
}
