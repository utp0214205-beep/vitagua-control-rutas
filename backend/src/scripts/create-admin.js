import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const nombre = process.env.ADMIN_NAME?.trim();
const correo = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

try {
  if (!nombre || !correo || !password) {
    throw new Error("Configura ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD temporalmente en tu archivo .env.");
  }
  if (password.length < 12) {
    throw new Error("La contraseña inicial debe tener al menos 12 caracteres.");
  }

  const existente = await pool.query(
    "SELECT id_usuario FROM usuario WHERE LOWER(correo) = $1 LIMIT 1",
    [correo]
  );
  if (existente.rowCount > 0) {
    throw new Error("Ya existe una cuenta con ese correo. No se modificó ninguna cuenta.");
  }

  const hash = await bcrypt.hash(password, 12);
  const creado = await pool.query(
    "INSERT INTO usuario (nombre, correo, contrasena_hash, rol) VALUES ($1, $2, $3, 'administrador') RETURNING id_usuario, nombre, correo, rol",
    [nombre, correo, hash]
  );

  console.log("Cuenta administradora creada correctamente:");
  console.log(creado.rows[0]);
  console.log("Elimina ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD de .env después de crearla.");
} catch (error) {
  console.error("No se pudo crear el administrador:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
