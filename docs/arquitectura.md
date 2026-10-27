# Arquitectura inicial

## Componentes
- **Frontend React:** pantallas para inicio de sesión, panel principal, trabajadores, rutas, registrar salida/regreso, historial y reportes.
- **API REST Node.js + Express:** autentica usuarios, autoriza operaciones, valida entradas y coordina las operaciones de negocio.
- **PostgreSQL:** conserva usuarios, trabajadores, rutas y recorridos con relaciones y restricciones de integridad.
- **GitHub:** aloja código, documentación, Issues y revisión de cambios.

## Flujo general
1. El usuario interactúa con el frontend.
2. El frontend envía una petición HTTP a la API.
3. El backend autentica y autoriza cuando corresponde.
4. El backend valida reglas de negocio y consulta/modifica PostgreSQL.
5. La API devuelve una respuesta que el frontend presenta al usuario.

## Estructura propuesta
```text
frontend/
  src/
    components/
    pages/
    services/
backend/
  src/
    config/
    controllers/
    routes/
    middleware/
database/
docs/
```

## Principios de diseño
- La lógica crítica se ejecuta en el servidor; no se confía solo en validaciones visuales.
- Las consultas a la base de datos se parametrizan.
- Las operaciones de salida/regreso deben ser transaccionales.
- Los errores HTTP deben usar códigos adecuados y mensajes que no expongan secretos.
- Las variables sensibles se cargan mediante entorno y un archivo .env excluido de Git.
- Se recomienda separar autenticación y autorización mediante middleware.

## Entidades iniciales propuestas
- **Usuario:** identidad de acceso, hash de contraseña y rol.
- **Trabajador:** datos operativos del personal; podrá vincularse a un usuario solo si el diseño de permisos lo requiere.
- **Ruta:** clave, nombre, descripción y estado.
- **Recorrido:** trabajador, ruta, salida, regreso y estado derivado o explícito.

La estructura definitiva de tablas y relaciones se documentará en database/schema.sql antes de implementar los endpoints.
