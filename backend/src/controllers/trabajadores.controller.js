import { pool } from "../config/db.js";

const campos = ["codigo", "nombre", "apellido_paterno", "apellido_materno", "telefono"];

function normalizarTexto(valor) {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  return texto || null;
}

function errorSQL(error, res) {
  if (error.code === "23505") {
    return res.status(409).json({ mensaje: "Ya existe un trabajador con ese código." });
  }
  console.error("Error en trabajadores:", error.message);
  return res.status(500).json({ mensaje: "No fue posible completar la operación." });
}

export async function listarTrabajadores(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === "true" && req.usuario.rol === "administrador";
    const resultado = await pool.query(
      `SELECT id_trabajador, codigo, nombre, apellido_paterno, apellido_materno, telefono, activo, creado_en, actualizado_en
       FROM trabajador ${incluirInactivos ? "" : "WHERE activo = TRUE"}
       ORDER BY activo DESC, apellido_paterno, apellido_materno NULLS LAST, nombre`
    );
    return res.json({ trabajadores: resultado.rows });
  } catch (error) {
    return errorSQL(error, res);
  }
}

export async function obtenerTrabajador(req, res) {
  try {
    const resultado = await pool.query(
      "SELECT id_trabajador, codigo, nombre, apellido_paterno, apellido_materno, telefono, activo, creado_en, actualizado_en FROM trabajador WHERE id_trabajador = $1",
      [req.params.id]
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Trabajador no encontrado." });
    return res.json({ trabajador: resultado.rows[0] });
  } catch (error) {
    return errorSQL(error, res);
  }
}

export async function crearTrabajador(req, res) {
  const codigo = normalizarTexto(req.body?.codigo);
  const nombre = normalizarTexto(req.body?.nombre);
  const paterno = normalizarTexto(req.body?.apellido_paterno);
  const materno = normalizarTexto(req.body?.apellido_materno);
  const telefono = normalizarTexto(req.body?.telefono);

  if (!codigo || !nombre || !paterno) {
    return res.status(400).json({ mensaje: "codigo, nombre y apellido_paterno son obligatorios." });
  }
  if (codigo.length > 30 || nombre.length > 80 || paterno.length > 80 || (materno && materno.length > 80) || (telefono && telefono.length > 25)) {
    return res.status(400).json({ mensaje: "Uno o más campos superan la longitud permitida." });
  }

  try {
    const resultado = await pool.query(
      "INSERT INTO trabajador (codigo, nombre, apellido_paterno, apellido_materno, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id_trabajador, codigo, nombre, apellido_paterno, apellido_materno, telefono, activo, creado_en, actualizado_en",
      [codigo, nombre, paterno, materno, telefono]
    );
    return res.status(201).json({ mensaje: "Trabajador creado correctamente.", trabajador: resultado.rows[0] });
  } catch (error) {
    return errorSQL(error, res);
  }
}

export async function actualizarTrabajador(req, res) {
  const id = req.params.id;
  const camposPermitidos = ["codigo", "nombre", "apellido_paterno", "apellido_materno", "telefono"];
  const actualizaciones = [];
  const valores = [];

  for (const campo of camposPermitidos) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, campo)) {
      const valor = req.body[campo] === null && ["apellido_materno", "telefono"].includes(campo)
        ? null
        : normalizarTexto(req.body[campo]);
      if (valor === null && !["apellido_materno", "telefono"].includes(campo)) {
        return res.status(400).json({ mensaje: `El campo ${campo} no puede estar vacío.` });
      }
      if (valor !== null && valor.length > ({ codigo: 30, nombre: 80, apellido_paterno: 80, apellido_materno: 80, telefono: 25 }[campo])) {
        return res.status(400).json({ mensaje: `El campo ${campo} supera la longitud permitida.` });
      }
      valores.push(valor);
      actualizaciones.push(`${campo} = $${valores.length}`);
    }
  }

  if (!actualizaciones.length) {
    return res.status(400).json({ mensaje: "Envía al menos un campo editable." });
  }

  actualizaciones.push("actualizado_en = CURRENT_TIMESTAMP");
  valores.push(id);

  try {
    const resultado = await pool.query(
      `UPDATE trabajador SET ${actualizaciones.join(", ")} WHERE id_trabajador = $${valores.length}
       RETURNING id_trabajador, codigo, nombre, apellido_paterno, apellido_materno, telefono, activo, creado_en, actualizado_en`,
      valores
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Trabajador no encontrado." });
    return res.json({ mensaje: "Trabajador actualizado correctamente.", trabajador: resultado.rows[0] });
  } catch (error) {
    return errorSQL(error, res);
  }
}

export async function cambiarEstadoTrabajador(req, res) {
  const activo = req.body?.activo;
  if (typeof activo !== "boolean") {
    return res.status(400).json({ mensaje: "El campo activo debe ser true o false." });
  }
  try {
    const resultado = await pool.query(
      "UPDATE trabajador SET activo = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id_trabajador = $2 RETURNING id_trabajador, codigo, nombre, apellido_paterno, apellido_materno, telefono, activo, actualizado_en",
      [activo, req.params.id]
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Trabajador no encontrado." });
    return res.json({ mensaje: activo ? "Trabajador activado." : "Trabajador desactivado.", trabajador: resultado.rows[0] });
  } catch (error) {
    return errorSQL(error, res);
  }
}
