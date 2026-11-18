# Ejecutar y defender Umbral R5 con MySQL

## Tecnologías y responsabilidades

1. React/Vite en frontend: pantallas, estilos y validación orientativa.
2. Node.js/Express en backend: reglas, autenticación, autorización y correo.
3. MySQL 8/InnoDB: usuarios, roles, sesiones, desafíos, vínculos y auditoría.

El navegador se comunica por HTTP con Express, nunca directamente con MySQL. La API usa mysql2 y consultas preparadas con signos ?, sin concatenar datos del formulario.

## Abrir el proyecto

Desde la raíz que contiene package.json, frontend y backend:

```powershell
npm ci
npm run setup:local
npm run doctor
npm run dev
```

Abrir http://localhost:5173/login. En esta computadora ya se migraron las cuentas anteriores y se conservan sus contraseñas. No se necesita el motor anterior.

El asistente de Windows instala MySQL oficial en .local/mysql y guarda datos en .local/mysql-data. Escucha solo 127.0.0.1:3307 y no toca XAMPP ni servicios de otros proyectos. Ctrl+C detiene la web/API; npm run db:stop detiene solo este MySQL tras verificar su directorio.

En una computadora nueva, setup:local crea claves aleatorias y un administrador solo cuando la base está vacía. Leer .local/ACCESOS-MYSQL.txt sin compartirlo. Para un MySQL externo usar backend/.env.example, aplicar backend/db/schema.sql y revisar docs/MYSQL_Y_HOSTING.md.

## Revisar las tablas

Usar MySQL Workbench, DBeaver o el cliente mysql con host 127.0.0.1, puerto 3307 y base umbral_r5. La cuenta cotidiana es umbral_r5_app; su contraseña está únicamente en los accesos privados. No usar root para la API.

```sql
SELECT u.username, u.email, r.name AS role, u.is_active
FROM users u JOIN roles r ON r.id = u.role_id;

SELECT action, created_at
FROM audit_logs
ORDER BY created_at DESC LIMIT 30;
```

No mostrar hashes, códigos HMAC, tokens, contraseñas SQL ni archivos .env en una presentación.

## Demostración sugerida

1. Registrar una cuenta: debe verificar el email con el código de Mailtrap antes de ingresar.
2. Repetir email/username con mayúsculas y espacios: los índices únicos normalizados lo impiden.
3. Probar contraseña incorrecta y recuperación por código sin enumerar cuentas.
4. Ingresar, mostrar la bienvenida y abrir Configurar mi perfil. Editar la tarjeta,
   cancelar un borrador y guardar otro. Mostrar las opciones de contraseña/email
   siguiendo sus confirmaciones. Para cambiar email se exige una contraseña local;
   una cuenta social debe crearla antes.
5. Mostrar Google, GitHub y Discord y sus filas en Cuentas vinculadas.
6. Con un admin, listar usuarios y actividad. Una cuenta normal recibe 403 incluso llamando directamente a la API.
7. Desactivar una cuenta normal: se revocan sus sesiones. Reactivarla no revive las sesiones viejas.
8. Probar móvil, teclado y modo claro/oscuro. Ejecutar npm test, npm run lint y npm run build.

## Explicación de seguridad

- El rol admin de la aplicación no es root de MySQL. La cuenta SQL tiene permisos por tabla y no puede modificar/borrar auditoría.
- bcrypt guarda hashes irreversibles. No se cifran contraseñas para luego descifrarlas.
- Las cookies HTTP-only contienen tokens de sesión. El refresh rota y SQL conserva su hash, no su valor.
- CSRF, SameSite y Secure complementan la validación del servidor y HTTPS.
- Los códigos usan HMAC, caducidad, límite de intentos y consumo único. Mailtrap Sandbox captura los correos de prueba.
- Los datos normalizados usan LOWER(TRIM(...)) con índices UNIQUE reales.
- Una modificación sensible y su auditoría se confirman juntas o se revierten con una transacción InnoDB.
- El estado OAuth se consume mediante bloqueo de fila. oauth_identity_locks evita vincular/crear dos veces la misma identidad en callbacks concurrentes.
- Se conservan roles, usuarios, sesiones, identidades y eventos en tablas relacionadas: los datos del rol no se repiten en cada usuario.

## Pruebas y entrega

Las suites MySQL crean bases/cuentas temporales con nombres aleatorios. Solo eliminan lo creado para esa prueba; no vacían la base diaria ni envían correos reales.

No copiar archivos de una base en ejecución desde OneDrive para respaldarla: hacer un respaldo lógico con mysqldump o detener el servidor primero. No entregar .local, node_modules ni secretos.

La publicación preparada usa [Render](https://umbral-r5.onrender.com) para la web
y la API, y MySQL de Aiven, base defaultdb, para los datos. La instalación local
usa umbral_r5 en el puerto 3307; son bases diferentes. FreeDB no aloja esta web.
Consultar [la guía actual del código](LEER-EL-CODIGO.md) y
[la configuración de MySQL y alojamiento](MYSQL_Y_HOSTING.md) para distinguir
los entornos y verificar los retornos de los proveedores.
