# Backend de VITAGUA

## Requisitos

- Node.js LTS y npm.
- PostgreSQL instalado y en ejecución.
- Base de datos `vitagua_rutas` creada y el esquema de `../database/schema.sql` aplicado.

## Preparación local

Los cambios de código se mantienen directamente en GitHub. Para ejecutar y probar la API en Windows, descarga el ZIP actualizado del repositorio y extrae el proyecto. No necesitas editar localmente los archivos del código.

Desde PowerShell, dentro de la carpeta `backend`:

```powershell
npm.cmd install
Copy-Item .env.example .env
notepad .env
```

Configura las credenciales locales de PostgreSQL en `.env`. Configura también `JWT_SECRET` con una clave aleatoria privada de al menos 32 caracteres. No compartas ni subas el archivo `.env` a GitHub.

## Comprobar PostgreSQL

```powershell
npm.cmd run db:check
```

La prueba debe mostrar `Esquema inicial: completo` y confirmar la conexión con PostgreSQL.

## Crear la primera cuenta administradora

En el archivo local `.env`, agrega temporalmente las variables `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Utiliza el nombre y correo que prefieras y una contraseña única de al menos 12 caracteres. No compartas esos valores ni los publiques en GitHub.

Ejecuta:

```powershell
npm.cmd run admin:create
```

El script crea una cuenta con rol `administrador` y guarda la contraseña como hash bcrypt. Si el correo ya existe, no lo sobrescribe. Tras crear la cuenta, elimina las tres variables temporales de `.env`; conserva `JWT_SECRET`.

## Iniciar la API

```powershell
npm.cmd run dev
```

Pruebas de salud:

- http://localhost:3000/api/health
- http://localhost:3000/api/health/db

## Autenticación inicial

`POST /api/auth/login` recibe un JSON con `correo` y `contrasena`. Si las credenciales son correctas, devuelve un token JWT y datos básicos del usuario. Para endpoints protegidos, el cliente enviará `Authorization: Bearer <token>`.

El middleware valida el token y comprueba que la cuenta siga activa. La función `permitirRoles("administrador")` permite limitar las rutas administrativas a administradores.

## Estado

Implementados: estructura inicial de Express, comprobación de PostgreSQL, inicio de sesión con JWT, hash de contraseñas y middleware de autenticación/autorización. Aún faltan los endpoints administrativos y las operaciones de recorridos.
