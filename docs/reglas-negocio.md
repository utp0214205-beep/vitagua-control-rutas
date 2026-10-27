# Reglas de negocio

1. **Trabajador válido:** solo un trabajador registrado y activo puede iniciar un recorrido.
2. **Ruta válida:** la salida debe asociarse con una ruta existente y activa.
3. **Una salida abierta por trabajador:** un trabajador no puede iniciar otro recorrido mientras tenga uno sin cerrar.
4. **Regreso válido:** solo puede registrarse un regreso si existe un recorrido abierto correspondiente.
5. **Tiempos automáticos:** la fecha y hora se generan en el servidor; el cliente no puede imponerlas libremente.
6. **Duración calculada:** duración = fecha/hora de regreso − fecha/hora de salida. No se calcula para recorridos abiertos.
7. **Secuencia coherente:** el regreso debe ser posterior a la salida.
8. **Historial conservado:** los recorridos cerrados no se eliminan como método ordinario para corregir errores. Las correcciones deberán quedar controladas y autorizadas.
9. **Acceso por rol:** la administración de trabajadores, rutas y usuarios está limitada a administradores; los permisos se definirán por rol.
10. **Consistencia transaccional:** el registro de salida o regreso se realizará como operación atómica para evitar estados parciales.
11. **Zona horaria:** los timestamps se almacenan de forma consistente, preferentemente con timestamptz en PostgreSQL, y se presentan en la zona horaria operativa configurada.
12. **Sin GPS en la primera versión:** el sistema registra eventos operativos; no afirma verificar la ubicación física del trabajador.
