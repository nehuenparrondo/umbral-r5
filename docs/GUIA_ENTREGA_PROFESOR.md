# Entrega y demostración de Umbral R5

## Carpeta entregable

Incluir frontend, backend, docs, README.md, render.yaml, .gitignore, .prettierignore, package.json y package-lock.json. Cada paquete conserva su package.json, configuración y .env.example.

No incluir node_modules, frontend/dist, .local, archivos .env, bases de datos, credenciales ni respaldos privados. No publicar repositorios o cambios en cuentas externas sin autorización del titular.

## Ejecutar en otra computadora

Con Node.js 24 y npm, desde la raíz:

```powershell
npm ci
npm run setup:local
npm run doctor
npm run dev
```

El asistente Windows instala MySQL Community oficial en esta copia, genera claves propias y prepara el administrador inicial si la base está vacía. Abrir http://localhost:5173/login. En otros sistemas se utiliza MySQL 8 externo: backend/.env.example y backend/db/schema.sql documentan la instalación.

Las claves SQL, sociales y Mailtrap de esta computadora nunca se entregan. Un nuevo equipo debe tener su propia configuración.

## Qué explicar

> Es un sistema de cuentas con React, Express y MySQL. El frontend y el backend están separados. Incluye verificación por correo, recuperación de contraseña, edición del perfil, acceso con Google/GitHub/Discord, administración y auditoría. La API valida permisos y datos, usa consultas preparadas, contraseñas bcrypt, sesiones con cookies HTTP-only, CSRF y transacciones InnoDB.

## Archivos para mostrar

- frontend/src/pages y frontend/src/components: pantallas y componentes.
- backend/routes y backend/controllers: endpoints y decisiones de la API.
- backend/models: persistencia MySQL preparada.
- backend/config/db.js: pool, transacciones y bloqueos de identidades.
- backend/db/schema.sql: entidades, claves foráneas, índices y restricciones.
- backend/db/least-privilege.sql: referencia de permisos mínimos.
- backend/services/challengeService.js: códigos de uso único.
- backend/services/oauthService.js: OAuth/OIDC y validación de perfiles.
- backend/tests: pruebas reales y aisladas.

## Publicación web

render.yaml prepara React y Node bajo un mismo dominio HTTPS; la base remota debe ser MySQL, por ejemplo FreeDB si sus prestaciones/TLS son compatibles.

No confundir tener una base remota con tener un sitio publicado. El enlace se entrega recién después de configurar el hosting, los secretos y los callbacks OAuth, y probar todo desde esa URL.

Consultar MYSQL_Y_HOSTING.md para los pasos, límites del plan gratuito y estado actual.
