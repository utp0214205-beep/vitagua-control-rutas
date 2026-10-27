# Backend de VITAGUA

## Requisitos

- Node.js LTS y npm.
- PostgreSQL instalado y en ejecución.
- La base de datos de desarrollo creada y el esquema de `../database/schema.sql` aplicado.

## Preparación local

Los cambios de código se mantienen directamente en GitHub. Para ejecutar y probar la API en tu computadora, necesitas tener una copia de la carpeta `backend` en Windows; puedes descargar el repositorio como ZIP desde GitHub y extraerlo, sin editar los archivos localmente.

Abre una terminal en la carpeta `backend`:

```powershell
npm install
```

Copia `.env.example` a `.env` y ajusta las credenciales de PostgreSQL:

```powershell
Copy-Item .env.example .env
```

Abre el archivo `.env` local y establece la contraseña que usas para el usuario de PostgreSQL. Verifica también que `PGDATABASE=vitagua_rutas` coincida con la base creada en pgAdmin. No compartas ni subas el archivo `.env`.

## Comprobar PostgreSQL

Antes de iniciar el servidor, ejecuta:

```powershell
npm run db:check
```

La prueba verifica la conexión, identifica la base de datos y el usuario configurados, y confirma que existan las cuatro tablas iniciales: `usuario`, `trabajador`, `ruta` y `recorrido`.

Si la prueba termina con `Esquema inicial: completo`, la conexión y las tablas están listas. Si aparece un error de autenticación, revisa `PGUSER` y `PGPASSWORD`; si no encuentra la base de datos, revisa `PGDATABASE`; si faltan tablas, vuelve a ejecutar `database/schema.sql` desde el Query Tool de pgAdmin.

## Ejecutar la API

Modo de desarrollo con reinicio al detectar cambios:

```powershell
npm run dev
```

Modo normal:

```powershell
npm start
```

## Endpoints iniciales

- `GET /api/health`: comprueba que la API responde.
- `GET /api/health/db`: comprueba la conexión con PostgreSQL.

Con el servidor activo, abre:

- http://localhost:3000/api/health
- http://localhost:3000/api/health/db

El segundo endpoint debe devolver estado HTTP 200 y `"baseDeDatos": "conectada"` cuando la base de datos y las variables de entorno estén configuradas correctamente. Si PostgreSQL no está disponible, devuelve HTTP 503.

## Estado

La API ya cuenta con la estructura inicial y la comprobación de conexión/esquema. La autenticación, autorización por roles, gestión de trabajadores y rutas, y registro de recorridos se implementarán en las siguientes tareas. La prueba debe ejecutarse en el entorno local para confirmar las credenciales reales de PostgreSQL.
