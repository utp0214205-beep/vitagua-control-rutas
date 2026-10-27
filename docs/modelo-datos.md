# Modelo inicial de datos

El esquema SQL se encuentra en `database/schema.sql`.

## Entidades

- **usuario**: cuentas que acceden al sistema. Guarda el hash de la contraseña, el rol y si la cuenta está activa. Roles iniciales: `administrador` y `operador`.
- **trabajador**: personal que realiza recorridos. El código del trabajador es único y permite identificarlo.
- **ruta**: rutas de distribución que pueden activarse o desactivarse sin borrar el historial.
- **recorrido**: registro de una salida y su regreso. Relaciona a un trabajador, una ruta y los usuarios que registraron la salida y el regreso.

## Reglas aplicadas en la base de datos

1. No se pueden repetir el correo de una cuenta, el código de un trabajador ni el nombre de una ruta.
2. Una salida debe tener trabajador, ruta y usuario que la registre.
3. Un recorrido abierto tiene `fecha_regreso` y `registrado_regreso_por` en `NULL`.
4. El regreso no puede ser anterior a la salida.
5. El índice único parcial `uq_recorrido_abierto_por_trabajador` impide que un trabajador tenga más de un recorrido abierto a la vez.
6. Las claves foráneas usan `ON DELETE RESTRICT` para evitar borrar cuentas, trabajadores o rutas referenciados por el historial.
7. Las fechas se almacenan como `TIMESTAMPTZ` para conservar información de zona horaria.

## Decisiones y límites

- La contraseña nunca debe guardarse en texto plano: `contrasena_hash` debe recibir un hash generado en el backend con una biblioteca adecuada.
- El esquema no crea usuarios de acceso automáticamente. Las cuentas iniciales deberán crearse mediante un proceso administrativo seguro.
- La aplicación debe validar que trabajador y ruta estén activos antes de registrar una salida. Esa regla se implementará también en el backend.
- La duración se calcula restando `fecha_salida` de `fecha_regreso`; no se almacena como dato duplicado.
- Las marcas de tiempo predeterminadas se generan en PostgreSQL. El backend no debe aceptar una hora arbitraria enviada por el navegador para una salida o regreso normal.
- Este archivo define el modelo inicial; aún debe probarse en una instancia de PostgreSQL y complementarse con migraciones y pruebas automatizadas.
