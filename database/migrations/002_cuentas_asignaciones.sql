-- Migración 002: cuentas vinculadas a trabajadores y asignaciones de rutas.
-- Ejecutar una sola vez sobre la base existente. Conserva los datos actuales.

BEGIN;

ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS id_trabajador BIGINT
    REFERENCES trabajador(id_trabajador) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_trabajador
    ON usuario (id_trabajador)
    WHERE id_trabajador IS NOT NULL;

CREATE TABLE IF NOT EXISTS asignacion (
    id_asignacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_trabajador BIGINT NOT NULL REFERENCES trabajador(id_trabajador) ON DELETE RESTRICT,
    id_ruta BIGINT NOT NULL REFERENCES ruta(id_ruta) ON DELETE RESTRICT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_asignacion_trabajador_ruta UNIQUE (id_trabajador, id_ruta)
);

CREATE INDEX IF NOT EXISTS idx_asignacion_trabajador_activa
    ON asignacion (id_trabajador, activa);

COMMIT;
