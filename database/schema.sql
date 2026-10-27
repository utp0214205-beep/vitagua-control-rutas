-- VITAGUA Registro de Rutas
-- Esquema inicial para PostgreSQL.
-- Ejecutar en una base de datos creada previamente para el proyecto.

BEGIN;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL
        CHECK (rol IN ('administrador', 'operador')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trabajador (
    id_trabajador BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    apellido_paterno VARCHAR(80) NOT NULL,
    apellido_materno VARCHAR(80),
    telefono VARCHAR(25),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ruta (
    id_ruta BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recorrido (
    id_recorrido BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_trabajador BIGINT NOT NULL
        REFERENCES trabajador(id_trabajador) ON DELETE RESTRICT,
    id_ruta BIGINT NOT NULL
        REFERENCES ruta(id_ruta) ON DELETE RESTRICT,
    fecha_salida TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_regreso TIMESTAMPTZ,
    registrado_salida_por BIGINT NOT NULL
        REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    registrado_regreso_por BIGINT
        REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    observaciones TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_regreso_posterior_salida
        CHECK (fecha_regreso IS NULL OR fecha_regreso >= fecha_salida),

    CONSTRAINT chk_usuario_regreso_coherente
        CHECK (
            (fecha_regreso IS NULL AND registrado_regreso_por IS NULL)
            OR
            (fecha_regreso IS NOT NULL AND registrado_regreso_por IS NOT NULL)
        )
);

-- Impide que un trabajador tenga dos recorridos abiertos simultáneamente.
CREATE UNIQUE INDEX IF NOT EXISTS uq_recorrido_abierto_por_trabajador
    ON recorrido (id_trabajador)
    WHERE fecha_regreso IS NULL;

-- Índices para búsquedas habituales e historial.
CREATE INDEX IF NOT EXISTS idx_recorrido_fecha_salida
    ON recorrido (fecha_salida DESC);

CREATE INDEX IF NOT EXISTS idx_recorrido_trabajador_fecha
    ON recorrido (id_trabajador, fecha_salida DESC);

CREATE INDEX IF NOT EXISTS idx_recorrido_ruta_fecha
    ON recorrido (id_ruta, fecha_salida DESC);

COMMIT;

-- Duración de recorridos finalizados:
-- SELECT id_recorrido, fecha_regreso - fecha_salida AS duracion
-- FROM recorrido
-- WHERE fecha_regreso IS NOT NULL;
