import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export async function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || "";
  const [tipo, token] = encabezado.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ mensaje: "Se requiere un token de acceso." });
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return res.status(500).json({ mensaje: "La autenticación no está configurada correctamente." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const resultado = await pool.query(
      "SELECT id_usuario, nombre, correo, rol, activo FROM usuario WHERE id_usuario = $1",
      [payload.sub]
    );
    const usuario = resultado.rows[0];

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: "La cuenta no existe o está desactivada." });
    }

    req.usuario = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    };
    return next();
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
      return res.status(401).json({ mensaje: "El token es inválido o ha expirado." });
    }
    console.error("Error al validar el acceso:", error.message);
    return res.status(500).json({ mensaje: "No fue posible validar el acceso." });
  }
}

export function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: "No tienes permisos para realizar esta acción." });
    }
    return next();
  };
}
