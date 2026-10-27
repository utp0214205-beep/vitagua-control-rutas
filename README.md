# VITAGUA — Sistema de Control de Rutas

Aplicación web para registrar y consultar las salidas y los regresos del personal de distribución de VITAGUA. El sistema calcula la duración de cada recorrido a partir de las marcas de tiempo registradas.

## Objetivo del MVP
- Administrar trabajadores y rutas.
- Identificar al trabajador antes de registrar un movimiento.
- Registrar salida y regreso con fecha y hora generadas por el sistema.
- Validar que no existan recorridos abiertos duplicados ni regresos sin salida.
- Consultar el historial y reportes básicos de duración.
- Restringir las funciones administrativas a usuarios autorizados.

> La geolocalización, el seguimiento GPS y la integración con mapas no forman parte de la primera versión.

## Tecnologías
- **Frontend:** React, JavaScript y CSS.
- **Backend:** Node.js y Express.
- **Base de datos:** PostgreSQL.
- **Control de versiones:** Git y GitHub.

## Estructura del repositorio
```text
frontend/       Interfaz React
backend/        API REST con Express
database/       Esquema y scripts SQL
docs/           Requisitos, reglas y arquitectura
```

## Requisitos previos
Instala una versión LTS de Node.js, npm y PostgreSQL. Comprueba las versiones con:
```bash
node --version
npm --version
psql --version
```

## Configuración
Cada aplicación tendrá su propio archivo .env local. No guardes contraseñas, claves ni otros secretos en Git.

1. Configura PostgreSQL y crea una base de datos para desarrollo.
2. Instala las dependencias del backend y configura sus variables de entorno.
3. Instala las dependencias del frontend.
4. Inicia backend y frontend en terminales separadas.

Los comandos concretos se documentarán al incorporar los archivos de configuración ejecutables.

## Flujo de trabajo con Git
Trabaja en ramas por funcionalidad y abre un Pull Request hacia main cuando los cambios estén revisados. Usa Issues para dividir el trabajo y registrar criterios de aceptación.

## Documentación
- [Requisitos](docs/requisitos.md)
- [Reglas de negocio](docs/reglas-negocio.md)
- [Arquitectura](docs/arquitectura.md)
- [Plan de trabajo](docs/plan-trabajo.md)

## Seguridad y datos
- Las contraseñas deberán almacenarse mediante hash seguro; nunca en texto plano.
- Las credenciales de PostgreSQL se cargarán desde variables de entorno.
- Las operaciones administrativas y los registros de movimientos deberán validarse en el servidor.
- La fecha y hora de salida/regreso serán generadas por el backend y almacenadas de forma consistente.
- El acceso a datos de trabajadores se limitará a usuarios autorizados.
