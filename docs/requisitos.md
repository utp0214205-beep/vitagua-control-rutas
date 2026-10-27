# Requisitos del sistema

## Requisitos funcionales
| ID | Requisito | Criterio de aceptación |
|---|---|---|
| RF-01 | Administrar trabajadores | Un usuario autorizado puede registrar, consultar, actualizar y desactivar trabajadores. |
| RF-02 | Administrar rutas | Un usuario autorizado puede registrar, consultar, actualizar y desactivar rutas de distribución. |
| RF-03 | Identificar al trabajador | Antes de registrar un movimiento, el sistema valida que el trabajador exista y esté activo. |
| RF-04 | Registrar salida | El sistema registra la salida del trabajador y guarda automáticamente la fecha y hora. |
| RF-05 | Registrar regreso | El sistema cierra un recorrido abierto y guarda automáticamente la fecha y hora de regreso. |
| RF-06 | Validar movimientos | El sistema impide una segunda salida si el trabajador ya tiene un recorrido abierto y rechaza un regreso sin salida abierta. |
| RF-07 | Calcular duración | La duración se calcula a partir de las marcas de tiempo de salida y regreso, no mediante entrada manual. |
| RF-08 | Consultar historial | El usuario autorizado puede filtrar recorridos por trabajador, ruta y periodo. |
| RF-09 | Consultar reportes | El sistema presenta totales y duraciones básicas de recorridos terminados. |
| RF-10 | Controlar acceso | Las funciones administrativas requieren autenticación y autorización en el servidor. |

## Requisitos no funcionales
| ID | Requisito | Criterio de aceptación |
|---|---|---|
| RNF-01 | Seguridad | Las contraseñas se almacenan con hash seguro; los secretos se mantienen fuera del repositorio. |
| RNF-02 | Integridad | La API valida los datos y la base de datos aplica restricciones para reducir registros inconsistentes. |
| RNF-03 | Usabilidad adaptable | Las pantallas principales funcionan en escritorio, tablet y móvil. |
| RNF-04 | Mantenibilidad | El código separa interfaz, rutas HTTP, controladores, configuración y acceso a datos. |
| RNF-05 | Trazabilidad | Cada movimiento conserva marcas de tiempo y referencias al trabajador y la ruta. |
| RNF-06 | Privacidad | Los datos del personal solo se muestran a usuarios con permisos adecuados. |

## Fuera del MVP
- Seguimiento GPS en tiempo real.
- Cálculo automático de rutas geográficas o tráfico.
- Integración con servicios de mapas.
- Nómina, control de asistencia laboral completo o evaluación automática del personal.
