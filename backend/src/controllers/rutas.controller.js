import { pool } from "../config/db.js";

function texto(valor) {
  if (typeof valor !== "string") return null;
  return valor.trim() || null;
}

function manejarError(error, res) {
  if (error.code === "23505") {
    return res.status(409).json({ mensaje: "Ya existe una ruta con ese nombre." });
  }
  console.error("Error en rutas:", error.message);
  return res.status(500).json({ mensaje: "No fue posible completar la operación." });
}

export async function listarRutas(req, res) {
  try {
    const incluirInactivas = req.query.incluirInactivas === "true" && req.usuario.rol === "administrador";
    const resultado = await pool.query(
      `SELECT id_ruta, nombre, descripcion, activa, creado_en, actualizado_en
       FROM ruta ${incluirInactivas ? "" : "WHERE activa = TRUE"}
       ORDER BY activa DESC, nombre`
    );
    return res.json({ rutas: resultado.rows });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtenerRuta(req, res) {
  try {
    const resultado = await pool.query(
      "SELECT id_ruta, nombre, descripcion, activa, creado_en, actualizado_en FROM ruta WHERE id_ruta = $1",
      [req.params.id]
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Ruta no encontrada." });
    return res.json({ ruta: resultado.rows[0] });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function crearRuta(req, res) {
  const nombre = texto(req.body?.nombre);
  const descripcion = req.body?.descripcion == null ? null : texto(req.body.descripcion);
  if (!nombre) return res.status(400).json({ mensaje: "El nombre de la ruta es obligatorio." });
  if (nombre.length > 100) return res.status(400).json({ mensaje: "El nombre no puede superar 100 caracteres." });
  if (descripcion && descripcion.length > 5000) return res.status(400).json({ mensaje: "La descripción es demasiado larga." });

  try {
    const resultado = await pool.query(
      "INSERT INTO ruta (nombre, descripcion) VALUES ($1, $2) RETURNING id_ruta, nombre, descripcion, activa, creado_en, actualizado_en",
      [nombre, descripcion]
    );
    return res.status(201).json({ mensaje: "Ruta creada correctamente.", ruta: resultado.rows[0] });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function actualizarRuta(req, res) {
  const actualizaciones = [];
  const valores = [];
  if (Object.prototype.hasOwnProperty.call(req.body || {}, "nombre")) {
    const nombre = texto(req.body.nombre);
    if (!nombre) return res.status(400).json({ mensaje: "El nombre no puede estar vacío." });
    if (nombre.length > 100) return res.status(400).json({ mensaje: "El nombre no puede superar 100 caracteres." });
    valores.push(nombre);
    actualizaciones.push(`nombre = $${valores.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(req.body || {}, "descripcion")) {
    const descripcion = req.body.descripcion == null ? null : texto(req.body.descripcion);
    if (descripcion && descripcion.length > 5000) return res.status(400).json({ mensaje: "La descripción es demasiado larga." });
    valores.push(descripcion);
    actualizaciones.push(`descripcion = $${valores.length}`);
  }
  if (!actualizaciones.length) return res.status(400).json({ mensaje: "Envía nombre o descripcion para actualizar." });

  actualizaciones.push("actualizado_en = CURRENT_TIMESTAMP");
  valores.push(req.params.id);
  try {
    const resultado = await pool.query(
      `UPDATE ruta SET ${actualizaciones.join(", ")} WHERE id_ruta = $${valores.length}
       RETURNING id_ruta, nombre, descripcion, activa, creado_en, actualizado_en`,
      valores
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Ruta no encontrada." });
    return res.json({ mensaje: "Ruta actualizada correctamente.", ruta: resultado.rows[0] });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function cambiarEstadoRuta(req, res) {
  const activa = req.body?.activa;
  if (typeof activa !== "boolean") return res.status(400).json({ mensaje: "El campo activa debe ser true o false." });
  try {
    const resultado = await pool.query(
      "UPDATE ruta SET activa = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id_ruta = $2 RETURNING id_ruta, nombre, descripcion, activa, actualizado_en",
      [activa, req.params.id]
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Ruta no encontrada." });
    return res.json({ mensaje: activa ? "Ruta activada." : "Ruta desactivada.", ruta: resultado.rows[0] });
  } catch (error) {
    return manejarError(error, res);
  }
}
