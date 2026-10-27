# Backend de VITAGUA

## Requisitos

- Node.js LTS y npm.
- PostgreSQL instalado y en ejecución.
- La base de datos de desarrollo creada y el esquema de `../database/schema.sql` aplicado.

## Preparación local

Desde la carpeta `backend`:

```bash
npm install
```

Copia `.env.example` a `.env` y ajusta las credenciales de PostgreSQL:

- Windows PowerShell: `Copy-Item .env.example .env`
- macOS/Linux: `cp .env.example .env`

No compartas ni subas el archivo `.env`.

## Ejecutar

Modo de desarrollo con reinicio al detectar cambios:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

## Endpoints iniciales

- `GET /api/health`: comprueba que la API responde.
- `GET /api/health/db`: comprueba la conexión con PostgreSQL.

Prueba en el navegador:

- `http://localhost:3000/api/health`
- `http://localhost:3000/api/health/db`

El segundo endpoint debe devolver estado HTTP 200 y `"baseDeDatos": "conectada"` cuando la base de datos y las variables de entorno estén configuradas correctamente. Si PostgreSQL no está disponible, devuelve HTTP 503.

## Estado

Esta es la base inicial de la API. La autenticación, autorización por roles, rutas de trabajadores y registro de recorridos se implementarán en las siguientes tareas. Todavía es necesario ejecutar pruebas locales con PostgreSQL para confirmar la configuración en el entorno de desarrollo.
