import { pool } from "../config/db.js";

function idPositivo(valor) {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

function manejarError(error, res) {
  if (error.code === "23505") {
    return res.status(409).json({
      mensaje: "El trabajador ya tiene un recorrido abierto."
    });
  }
  if (error.code === "23503") {
    return res.status(400).json({
      mensaje: "El trabajador, la ruta o el usuario indicado no existe."
    });
  }
  console.error("Error en recorridos:", error.message);
  return res.status(500).json({
    mensaje: "No fue posible completar la operación."
  });
}

const consultaBase = `
  SELECT
    rc.id_recorrido,
    rc.fecha_salida,
    rc.fecha_regreso,
    rc.observaciones,
    CASE
      WHEN rc.fecha_regreso IS NULL THEN NULL
      ELSE FLOOR(EXTRACT(EPOCH FROM (rc.fecha_regreso - rc.fecha_salida)))::BIGINT
    END AS duracion_segundos,
    tr.id_trabajador,
    tr.nombre AS nombre_trabajador,
    tr.apellido_paterno,
    tr.apellido_materno,
    ru.id_ruta,
    ru.nombre AS nombre_ruta,
    us.nombre AS registrado_salida_por,
    ur.nombre AS registrado_regreso_por
  FROM recorrido rc
  INNER JOIN trabajador tr ON tr.id_trabajador = rc.id_trabajador
  INNER JOIN ruta ru ON ru.id_ruta = rc.id_ruta
  INNER JOIN usuario us ON us.id_usuario = rc.registrado_salida_por
  LEFT JOIN usuario ur ON ur.id_usuario = rc.registrado_regreso_por
`;

export async function listarRecorridos(req, res) {
  const condiciones = [];
  const valores = [];

  const trabajadorId = req.query.trabajadorId === undefined
    ? null
    : idPositivo(req.query.trabajadorId);
  const rutaId = req.query.rutaId === undefined
    ? null
    : idPositivo(req.query.rutaId);

  if (req.query.trabajadorId !== undefined && !trabajadorId) {
    return res.status(400).json({ mensaje: "trabajadorId debe ser un entero positivo." });
  }
  if (req.query.rutaId !== undefined && !rutaId) {
    return res.status(400).json({ mensaje: "rutaId debe ser un entero positivo." });
  }

  if (req.usuario.rol === "operador") {
    if (!req.usuario.id_trabajador) return res.status(403).json({ mensaje: "Tu cuenta no está vinculada a un trabajador." });
    valores.push(req.usuario.id_trabajador);
    condiciones.push(`rc.id_trabajador = ${valores.length}`);
  } else if (trabajadorId) {
    valores.push(trabajadorId);
    condiciones.push(`rc.id_trabajador = ${valores.length}`);
  }
  if (rutaId) {
    valores.push(rutaId);
    condiciones.push(`rc.id_ruta = $${valores.length}`);
  }

  if (req.query.estado !== undefined) {
    if (!["abierto", "finalizado"].includes(req.query.estado)) {
      return res.status(400).json({ mensaje: "estado debe ser abierto o finalizado." });
    }
    condiciones.push(req.query.estado === "abierto"
      ? "rc.fecha_regreso IS NULL"
      : "rc.fecha_regreso IS NOT NULL");
  }

  for (const campo of ["desde", "hasta"]) {
    const fecha = req.query[campo];
    if (fecha !== undefined) {
      if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ mensaje: `${campo} debe tener formato AAAA-MM-DD.` });
      }
      valores.push(fecha);
      condiciones.push(campo === "desde"
        ? `rc.fecha_salida >= $${valores.length}::date`
        : `rc.fecha_salida < ($${valores.length}::date + INTERVAL '1 day')`);
    }
  }

  const limiteSolicitado = req.query.limite === undefined ? 50 : Number(req.query.limite);
  const paginaSolicitada = req.query.pagina === undefined ? 1 : Number(req.query.pagina);
  if (!Number.isInteger(limiteSolicitado) || limiteSolicitado < 1 ||
      !Number.isInteger(paginaSolicitada) || paginaSolicitada < 1) {
    return res.status(400).json({ mensaje: "limite y pagina deben ser enteros positivos." });
  }

  const limite = Math.min(limiteSolicitado, 100);
  const desplazamiento = (paginaSolicitada - 1) * limite;
  valores.push(limite, desplazamiento);

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  try {
    const resultado = await pool.query(
      `${consultaBase}
       ${where}
       ORDER BY rc.fecha_salida DESC
       LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
      valores
    );
    return res.json({
      recorridos: resultado.rows,
      paginacion: { pagina: paginaSolicitada, limite, resultados: resultado.rowCount }
    });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function listarRecorridosAbiertos(req, res) {
  try {
    if (req.usuario.rol === "operador" && !req.usuario.id_trabajador) {
      return res.status(403).json({ mensaje: "Tu cuenta no está vinculada a un trabajador." });
    }
    const filtroPropio = req.usuario.rol === "operador" ? "AND rc.id_trabajador = $1" : "";
    const parametros = req.usuario.rol === "operador" ? [req.usuario.id_trabajador] : [];
    const resultado = await pool.query(
      `${consultaBase}
       WHERE rc.fecha_regreso IS NULL ${filtroPropio}
       ORDER BY rc.fecha_salida ASC`,
      parametros
    );
    return res.json({ recorridos: resultado.rows });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function obtenerRecorrido(req, res) {
  const id = idPositivo(req.params.id);
  if (!id) return res.status(400).json({ mensaje: "El identificador del recorrido no es válido." });

  try {
    const resultado = await pool.query(
      `${consultaBase} WHERE rc.id_recorrido = $1
       AND ($2::bigint IS NULL OR rc.id_trabajador = $2)`,
      [id, req.usuario.rol === "operador" ? req.usuario.id_trabajador : null]
    );
    if (!resultado.rowCount) {
      return res.status(404).json({ mensaje: "Recorrido no encontrado." });
    }
    return res.json({ recorrido: resultado.rows[0] });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function registrarSalida(req, res) {
  if (req.usuario.rol !== "operador") return res.status(403).json({ mensaje: "Solo el trabajador puede registrar su propia salida." });
  if (!req.usuario.id_trabajador) return res.status(403).json({ mensaje: "Tu cuenta no está vinculada a un trabajador." });
  const trabajadorId = idPositivo(req.usuario.id_trabajador);
  const rutaId = idPositivo(req.body?.id_ruta);
  const observaciones = req.body?.observaciones == null
    ? null
    : typeof req.body.observaciones === "string"
      ? req.body.observaciones.trim() || null
      : undefined;

  if (!trabajadorId || !rutaId) {
    return res.status(400).json({
      mensaje: "id_trabajador e id_ruta deben ser enteros positivos."
    });
  }
  if (observaciones === undefined) {
    return res.status(400).json({ mensaje: "observaciones debe ser texto." });
  }
  if (observaciones && observaciones.length > 2000) {
    return res.status(400).json({ mensaje: "Las observaciones no pueden superar 2000 caracteres." });
  }

  try {
    const [trabajador, ruta, asignacion] = await Promise.all([
      pool.query("SELECT id_trabajador FROM trabajador WHERE id_trabajador = $1 AND activo = TRUE", [trabajadorId]),
      pool.query("SELECT id_ruta FROM ruta WHERE id_ruta = $1 AND activa = TRUE", [rutaId]),
      pool.query("SELECT id_asignacion FROM asignacion WHERE id_trabajador = $1 AND id_ruta = $2 AND activa = TRUE", [trabajadorId, rutaId])
    ]);

    if (!trabajador.rowCount) {
      return res.status(404).json({ mensaje: "El trabajador no existe o está inactivo." });
    }
    if (!ruta.rowCount) {
      return res.status(404).json({ mensaje: "La ruta no existe o está inactiva." });
    }
    if (!asignacion.rowCount) return res.status(403).json({ mensaje: "No tienes asignada esta ruta o la asignación está inactiva." });

    const resultado = await pool.query(
      `INSERT INTO recorrido
        (id_trabajador, id_ruta, registrado_salida_por, observaciones)
       VALUES ($1, $2, $3, $4)
       RETURNING id_recorrido, id_trabajador, id_ruta, fecha_salida, fecha_regreso,
                 registrado_salida_por, observaciones`,
      [trabajadorId, rutaId, req.usuario.id_usuario, observaciones]
    );
    return res.status(201).json({
      mensaje: "Salida registrada correctamente.",
      recorrido: resultado.rows[0]
    });
  } catch (error) {
    return manejarError(error, res);
  }
}

export async function registrarRegreso(req, res) {
  if (req.usuario.rol !== "operador") return res.status(403).json({ mensaje: "Solo el trabajador puede registrar su propio regreso." });
  if (!req.usuario.id_trabajador) return res.status(403).json({ mensaje: "Tu cuenta no está vinculada a un trabajador." });
  const id = idPositivo(req.params.id);
  if (!id) return res.status(400).json({ mensaje: "El identificador del recorrido no es válido." });

  try {
    const resultado = await pool.query(
      `UPDATE recorrido
       SET fecha_regreso = CURRENT_TIMESTAMP,
           registrado_regreso_por = $1
       WHERE id_recorrido = $2 AND id_trabajador = $3 AND fecha_regreso IS NULL
       RETURNING id_recorrido, id_trabajador, id_ruta, fecha_salida, fecha_regreso,
                 registrado_salida_por, registrado_regreso_por, observaciones,
                 FLOOR(EXTRACT(EPOCH FROM (fecha_regreso - fecha_salida)))::BIGINT AS duracion_segundos`,
      [req.usuario.id_usuario, id, req.usuario.id_trabajador]
    );

    if (!resultado.rowCount) {
      const existe = await pool.query(
        "SELECT fecha_regreso FROM recorrido WHERE id_recorrido = $1 AND id_trabajador = $2",
        [id, req.usuario.id_trabajador]
      );
      if (!existe.rowCount) {
        return res.status(404).json({ mensaje: "Recorrido no encontrado." });
      }
      return res.status(409).json({ mensaje: "Este recorrido ya fue finalizado." });
    }

    return res.json({
      mensaje: "Regreso registrado correctamente. El recorrido ha finalizado.",
      recorrido: resultado.rows[0]
    });
  } catch (error) {
    return manejarError(error, res);
  }
}
