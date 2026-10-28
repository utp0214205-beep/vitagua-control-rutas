import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export async function iniciarSesion(req, res) {
  const correo = typeof req.body?.correo === "string" ? req.body.correo.trim().toLowerCase() : "";
  const contrasena = typeof req.body?.contrasena === "string" ? req.body.contrasena : "";

  if (!correo || !contrasena) {
    return res.status(400).json({ mensaje: "El correo y la contraseña son obligatorios." });
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return res.status(500).json({ mensaje: "La autenticación no está configurada correctamente." });
  }

  try {
    const resultado = await pool.query(
      "SELECT id_usuario, nombre, correo, contrasena_hash, rol, activo FROM usuario WHERE LOWER(correo) = $1 LIMIT 1",
      [correo]
    );
    const usuario = resultado.rows[0];
    const valida = usuario ? await bcrypt.compare(contrasena, usuario.contrasena_hash) : false;

    if (!usuario || !valida || !usuario.activo) {
      return res.status(401).json({ mensaje: "Correo o contraseña incorrectos, o cuenta inactiva." });
    }

    const token = jwt.sign(
      { rol: usuario.rol },
      process.env.JWT_SECRET,
      { subject: String(usuario.id_usuario), expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return res.status(200).json({
      mensaje: "Inicio de sesión correcto.",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    return res.status(500).json({ mensaje: "No fue posible iniciar sesión." });
  }
}
