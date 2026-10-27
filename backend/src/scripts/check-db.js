import "dotenv/config";
import { pool, comprobarConexionDB } from "../config/db.js";

const tablasEsperadas = ["usuario", "trabajador", "ruta", "recorrido"];

try {
  const conexion = await comprobarConexionDB();
  const resultado = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])
     ORDER BY table_name`,
    [tablasEsperadas]
  );

  const tablasEncontradas = resultado.rows.map((fila) => fila.table_name);
  const tablasFaltantes = tablasEsperadas.filter(
    (tabla) => !tablasEncontradas.includes(tabla)
  );

  console.log("Conexión con PostgreSQL: correcta");
  console.log(`Base de datos: ${process.env.PGDATABASE}`);
  console.log(`Usuario de PostgreSQL: ${process.env.PGUSER}`);
  console.log(`Hora del servidor: ${conexion.servidor_hora}`);
  console.log(`Tablas encontradas: ${tablasEncontradas.join(", ") || "ninguna"}`);

  if (tablasFaltantes.length > 0) {
    console.error(`Faltan tablas del esquema: ${tablasFaltantes.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Esquema inicial: completo");
  }
} catch (error) {
  console.error("No fue posible conectar o verificar el esquema de PostgreSQL.");
  console.error(`Detalle: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
