import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

function normalizarTexto(valor) {
  if (typeof valor !== "string") return null;
  return valor.trim() || null;
}
function errorSQL(error, res) {
  if (error.code === "23505") return res.status(409).json({ mensaje: "El correo o la relación de cuenta ya está registrado." });
  console.error("Error en trabajadores:", error.message);
  return res.status(500).json({ mensaje: "No fue posible completar la operación." });
}
const columnas = "id_trabajador, nombre, apellido_paterno, apellido_materno, telefono, activo, creado_en, actualizado_en";

export async function listarTrabajadores(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === "true" && req.usuario.rol === "administrador";
    const resultado = await pool.query(
      `SELECT tr.${columnas.split(", ").join(", tr.")},
              (us.id_usuario IS NOT NULL) AS tiene_cuenta,
              us.correo AS correo_cuenta, us.activo AS cuenta_activa
       FROM trabajador tr
       LEFT JOIN usuario us ON us.id_trabajador = tr.id_trabajador
       ${incluirInactivos ? "" : "WHERE tr.activo = TRUE"}
       ORDER BY tr.activo DESC, tr.apellido_paterno, tr.apellido_materno NULLS LAST, tr.nombre`
    );
    return res.json({ trabajadores: resultado.rows });
  } catch (error) { return errorSQL(error, res); }
}

export async function obtenerTrabajador(req, res) {
  try {
    const resultado = await pool.query(`SELECT ${columnas} FROM trabajador WHERE id_trabajador = $1`, [req.params.id]);
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Trabajador no encontrado." });
    return res.json({ trabajador: resultado.rows[0] });
  } catch (error) { return errorSQL(error, res); }
}

export async function crearTrabajador(req, res) {
  const nombre = normalizarTexto(req.body?.nombre);
  const paterno = normalizarTexto(req.body?.apellido_paterno);
  const materno = normalizarTexto(req.body?.apellido_materno);
  const telefono = normalizarTexto(req.body?.telefono);
  const cuenta = req.body?.cuenta;
  if (!nombre || !paterno) return res.status(400).json({ mensaje: "nombre y apellido_paterno son obligatorios." });
  if (nombre.length > 80 || paterno.length > 80 || (materno && materno.length > 80) || (telefono && telefono.length > 25))
    return res.status(400).json({ mensaje: "Uno o más campos superan la longitud permitida." });
  let correo = null, contrasena = null;
  if (cuenta !== undefined && cuenta !== null) {
    correo = typeof cuenta.correo === "string" ? cuenta.correo.trim().toLowerCase() : "";
    contrasena = typeof cuenta.contrasena === "string" ? cuenta.contrasena : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 150)
      return res.status(400).json({ mensaje: "El correo de acceso no es válido." });
    if (contrasena.length < 12)
      return res.status(400).json({ mensaje: "La contraseña inicial debe tener al menos 12 caracteres." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const trabajador = await client.query(
      `INSERT INTO trabajador (nombre, apellido_paterno, apellido_materno, telefono)
       VALUES ($1, $2, $3, $4) RETURNING ${columnas}`,
      [nombre, paterno, materno, telefono]
    );
    if (correo) {
      const hash = await bcrypt.hash(contrasena, 12);
      await client.query(
        `INSERT INTO usuario (nombre, correo, contrasena_hash, rol, id_trabajador)
         VALUES ($1, $2, $3, 'operador', $4)`,
        [[nombre, paterno, materno].filter(Boolean).join(" "), correo, hash, trabajador.rows[0].id_trabajador]
      );
    }
    await client.query("COMMIT");
    return res.status(201).json({
      mensaje: correo ? "Trabajador y cuenta de operador creados correctamente." : "Trabajador creado correctamente.",
      trabajador: trabajador.rows[0],
      cuenta_creada: Boolean(correo)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return errorSQL(error, res);
  } finally { client.release(); }
}


export async function crearCuentaTrabajador(req, res) {
  const id = Number(req.params.id);
  const correo = typeof req.body?.correo === "string" ? req.body.correo.trim().toLowerCase() : "";
  const contrasena = typeof req.body?.contrasena === "string" ? req.body.contrasena : "";
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ mensaje: "El identificador del trabajador no es válido." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 150) return res.status(400).json({ mensaje: "El correo de acceso no es válido." });
  if (contrasena.length < 12) return res.status(400).json({ mensaje: "La contraseña inicial debe tener al menos 12 caracteres." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const worker = await client.query(
      "SELECT id_trabajador, nombre, apellido_paterno, apellido_materno, activo FROM trabajador WHERE id_trabajador = $1 FOR UPDATE",
      [id]
    );
    if (!worker.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ mensaje: "Trabajador no encontrado." }); }
    if (!worker.rows[0].activo) { await client.query("ROLLBACK"); return res.status(409).json({ mensaje: "No se puede crear acceso para un trabajador inactivo." }); }
    const hash = await bcrypt.hash(contrasena, 12);
    await client.query(
      "INSERT INTO usuario (nombre, correo, contrasena_hash, rol, id_trabajador) VALUES ($1, $2, $3, 'operador', $4)",
      [[worker.rows[0].nombre, worker.rows[0].apellido_paterno, worker.rows[0].apellido_materno].filter(Boolean).join(" "), correo, hash, id]
    );
    await client.query("COMMIT");
    return res.status(201).json({ mensaje: "Cuenta de operador creada y vinculada correctamente." });
  } catch (error) {
    await client.query("ROLLBACK");
    return errorSQL(error, res);
  } finally { client.release(); }
}

export async function actualizarTrabajador(req, res) {
  const camposPermitidos = ["nombre", "apellido_paterno", "apellido_materno", "telefono"];
  const actualizaciones = [], valores = [];
  for (const campo of camposPermitidos) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, campo)) {
      const valor = req.body[campo] === null && ["apellido_materno", "telefono"].includes(campo) ? null : normalizarTexto(req.body[campo]);
      if (valor === null && !["apellido_materno", "telefono"].includes(campo))
        return res.status(400).json({ mensaje: `El campo ${campo} no puede estar vacío.` });
      if (valor !== null && valor.length > ({ nombre: 80, apellido_paterno: 80, apellido_materno: 80, telefono: 25 }[campo]))
        return res.status(400).json({ mensaje: `El campo ${campo} supera la longitud permitida.` });
      valores.push(valor); actualizaciones.push(`${campo} = $${valores.length}`);
    }
  }
  if (!actualizaciones.length) return res.status(400).json({ mensaje: "Envía al menos un campo editable." });
  actualizaciones.push("actualizado_en = CURRENT_TIMESTAMP"); valores.push(req.params.id);
  try {
    const resultado = await pool.query(
      `UPDATE trabajador SET ${actualizaciones.join(", ")} WHERE id_trabajador = $${valores.length} RETURNING ${columnas}`,
      valores
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Trabajador no encontrado." });
    return res.json({ mensaje: "Trabajador actualizado correctamente.", trabajador: resultado.rows[0] });
  } catch (error) { return errorSQL(error, res); }
}

export async function cambiarEstadoTrabajador(req, res) {
  const activo = req.body?.activo;
  if (typeof activo !== "boolean") return res.status(400).json({ mensaje: "El campo activo debe ser true o false." });
  try {
    if (!activo) {
      const abierto = await pool.query("SELECT 1 FROM recorrido WHERE id_trabajador = $1 AND fecha_regreso IS NULL LIMIT 1", [req.params.id]);
      if (abierto.rowCount) return res.status(409).json({ mensaje: "No puedes desactivar a un trabajador que tiene un recorrido en curso." });
    }
    const resultado = await pool.query(
      `UPDATE trabajador SET activo = $1, actualizado_en = CURRENT_TIMESTAMP
       WHERE id_trabajador = $2
       RETURNING id_trabajador, nombre, apellido_paterno, apellido_materno, telefono, activo, actualizado_en`,
      [activo, req.params.id]
    );
    if (!resultado.rowCount) return res.status(404).json({ mensaje: "Trabajador no encontrado." });
    await pool.query("UPDATE usuario SET activo = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id_trabajador = $2", [activo, req.params.id]);
    return res.json({ mensaje: activo ? "Trabajador activado. La cuenta conserva su estado previo." : "Trabajador desactivado y acceso bloqueado.", trabajador: resultado.rows[0] });
  } catch (error) { return errorSQL(error, res); }
}
