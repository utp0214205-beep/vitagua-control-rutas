import { pool } from "../config/db.js";

function idPositivo(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function listarAsignaciones(req, res) {
  try {
    const result = await pool.query(`
      SELECT a.id_asignacion, a.id_trabajador, a.id_ruta, a.activa,
             a.creado_en, a.actualizado_en,
             tr.nombre AS nombre_trabajador, tr.apellido_paterno, tr.apellido_materno,
             ru.nombre AS nombre_ruta, ru.activa AS ruta_activa, tr.activo AS trabajador_activo
      FROM asignacion a
      JOIN trabajador tr ON tr.id_trabajador = a.id_trabajador
      JOIN ruta ru ON ru.id_ruta = a.id_ruta
      ORDER BY a.activa DESC, tr.apellido_paterno, tr.nombre, ru.nombre
    `);
    return res.json({ asignaciones: result.rows });
  } catch (error) {
    console.error("Error al listar asignaciones:", error.message);
    return res.status(500).json({ mensaje: "No fue posible consultar las asignaciones." });
  }
}

export async function listarMisAsignaciones(req, res) {
  if (!req.usuario.id_trabajador) {
    return res.status(403).json({ mensaje: "Esta cuenta no está vinculada a un trabajador." });
  }
  try {
    const result = await pool.query(`
      SELECT a.id_asignacion, a.id_trabajador, a.id_ruta, a.activa,
             ru.nombre AS nombre_ruta, ru.descripcion AS descripcion_ruta
      FROM asignacion a
      JOIN ruta ru ON ru.id_ruta = a.id_ruta
      JOIN trabajador tr ON tr.id_trabajador = a.id_trabajador
      WHERE a.id_trabajador = $1 AND a.activa = TRUE
        AND ru.activa = TRUE AND tr.activo = TRUE
      ORDER BY ru.nombre
    `, [req.usuario.id_trabajador]);
    return res.json({ asignaciones: result.rows });
  } catch (error) {
    console.error("Error al consultar mis asignaciones:", error.message);
    return res.status(500).json({ mensaje: "No fue posible consultar tus rutas asignadas." });
  }
}

export async function crearAsignacion(req, res) {
  const trabajadorId = idPositivo(req.body?.id_trabajador);
  const rutaId = idPositivo(req.body?.id_ruta);
  if (!trabajadorId || !rutaId) return res.status(400).json({ mensaje: "Selecciona un trabajador y una ruta válidos." });
  try {
    const [worker, route] = await Promise.all([
      pool.query("SELECT id_trabajador FROM trabajador WHERE id_trabajador = $1 AND activo = TRUE", [trabajadorId]),
      pool.query("SELECT id_ruta FROM ruta WHERE id_ruta = $1 AND activa = TRUE", [rutaId])
    ]);
    if (!worker.rowCount) return res.status(404).json({ mensaje: "El trabajador no existe o está inactivo." });
    if (!route.rowCount) return res.status(404).json({ mensaje: "La ruta no existe o está inactiva." });
    const result = await pool.query(`
      INSERT INTO asignacion (id_trabajador, id_ruta)
      VALUES ($1, $2)
      RETURNING id_asignacion, id_trabajador, id_ruta, activa, creado_en
    `, [trabajadorId, rutaId]);
    return res.status(201).json({ mensaje: "Ruta asignada correctamente.", asignacion: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ mensaje: "Ese trabajador ya tiene registrada esa ruta. Puedes reactivar la asignación existente." });
    console.error("Error al crear asignación:", error.message);
    return res.status(500).json({ mensaje: "No fue posible crear la asignación." });
  }
}

export async function cambiarEstadoAsignacion(req, res) {
  const activa = req.body?.activa;
  if (typeof activa !== "boolean") return res.status(400).json({ mensaje: "El campo activa debe ser true o false." });
  try {
    const result = await pool.query(`
      UPDATE asignacion SET activa = $1, actualizado_en = CURRENT_TIMESTAMP
      WHERE id_asignacion = $2
      RETURNING id_asignacion, id_trabajador, id_ruta, activa, actualizado_en
    `, [activa, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ mensaje: "Asignación no encontrada." });
    return res.json({ mensaje: activa ? "Asignación activada." : "Asignación desactivada.", asignacion: result.rows[0] });
  } catch (error) {
    console.error("Error al actualizar asignación:", error.message);
    return res.status(500).json({ mensaje: "No fue posible actualizar la asignación." });
  }
}
