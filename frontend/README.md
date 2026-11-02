# VITAGUA · Frontend

Interfaz React + Vite para el sistema de registro y control de rutas.

## Desarrollo en GitHub Codespaces

1. Abre una terminal en la raíz del repositorio.
2. Instala dependencias:
   `cd frontend && npm install`
3. Inicia el frontend:
   `npm run dev`
4. En la pestaña **Ports**, abre el puerto **5173**.

Mantén activo el backend en el puerto **3000**. Vite reenvía las solicitudes `/api` al backend.

## Funciones incluidas

- Inicio de sesión mediante `POST /api/auth/login`.
- Sesión con token JWT y cierre de sesión.
- Panel de resumen.
- Consulta y administración de trabajadores y rutas.
- Registro de salidas y regresos.
- Consulta del historial y filtros básicos.

La API se consume mediante rutas relativas `/api` en desarrollo. No se guardan credenciales en el navegador.