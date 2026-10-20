# Cumplimiento de Requerimientos R5

Este documento resume donde se resuelve cada punto de la consigna. Sirve para revisar el trabajo antes de entregarlo y para explicarselo al profesor.

## Estado General

- Frontend en React con componentes funcionales y Hooks: `frontend/src/`.
- Backend en Node.js + Express: `backend/`.
- Base relacional MySQL: `backend/db/schema.sql`.
- Passwords hasheadas con bcrypt: `backend/controllers/authController.js` y `backend/controllers/userController.js`.
- JWT seguro en cookies `httpOnly`: `backend/config/cookies.js`, `backend/services/tokenService.js`, `backend/controllers/authController.js`.
- Validacion frontend y backend: `frontend/src/utils/validators.js`, `backend/validations/`.
- Perfil propio protegido: `backend/routes/userRoutes.js`, `backend/controllers/userController.js`.
- Admin protegido por rol real del backend: `backend/routes/adminRoutes.js`, `backend/middlewares/authMiddleware.js`.
- Auditoria basica: `backend/models/auditLogModel.js`.

## Registro

- Formulario: `frontend/src/pages/RegisterPage.jsx`.
- Validacion de email, username, password y confirmacion: `frontend/src/utils/validators.js`.
- Validacion backend repetida: `backend/validations/authValidation.js`.
- Duplicados case-insensitive y trim: `backend/models/userModel.js`.
- Restriccion SQL UNIQUE normalizada: `backend/db/schema.sql`.
- Hash de contrasena: `backend/controllers/authController.js`.
- Verificacion obligatoria mediante codigo Mailtrap: `backend/services/mailService.js`, `backend/services/challengeService.js`.

## Login

- Formulario: `frontend/src/pages/LoginPage.jsx`.
- Comparacion segura con bcrypt: `backend/controllers/authController.js`.
- Mensaje generico ante credenciales invalidas: `backend/controllers/authController.js`.
- Rate limit: `backend/middlewares/rateLimiters.js`.
- Auditoria de fallos: `backend/controllers/authController.js`.
- Bloqueo tras tres fallos, desbloqueo y recuperacion por codigo: `backend/controllers/codeController.js`.

## Login social OAuth 2.0

- [x] Google, Facebook/Meta, GitHub, Discord y Twitch declarados en `backend/config/oauthProviders.js`.
- [x] X queda configurado arquitectonicamente y documenta sus limites de plan/email.
- [x] Auth0 centraliza las conexiones como broker OIDC y permite dirigir cada boton mediante el parametro `connection`.
- [x] Una sola Regular Web Application de Auth0 reemplaza seis integraciones distintas dentro de R5; las conexiones externas siguen requiriendo habilitacion en el tenant.
- [x] Un proveedor nuevo se agrega como configuracion; las rutas y el controlador son genericos.
- [x] Authorization Code se intercambia server-to-server; ningun secreto llega a React.
- [x] `state` criptografico se liga al navegador, se guarda hasheado y se consume una sola vez.
- [x] En modo Auth0, todos los botones usan PKCE S256; el fallback directo conserva las capacidades de cada proveedor.
- [x] R5 valida el ID Token emitido por Auth0 (firma JWKS, issuer, audience y nonce); el fallback directo tambien valida Google y Twitch.
- [x] Los access tokens externos no se guardan en MySQL.
- [x] No se auto-vincula un email existente si el proveedor no afirma que esta verificado.
- [x] `oauth_accounts` modela la relacion 1:N sin columnas por proveedor.
- [x] Login/registro tradicional permanece disponible.
- [x] Botones responsive, modo claro/oscuro y errores de retorno en Login.
- [x] Perfil muestra cuentas vinculadas y permite crear una contrasena a usuarios social-only.
- [x] Eventos `OAUTH_LOGIN`, `OAUTH_REGISTER` y `OAUTH_LINK` quedan auditados.
- [x] Pruebas automaticas no dependen de APIs externas; la prueba end-to-end es manual con credenciales propias.

## Perfil

- Vista privada: `frontend/src/pages/ProfilePage.jsx`.
- Ruta protegida visualmente: `frontend/src/components/ProtectedRoute.jsx`.
- Ruta protegida realmente en backend: `backend/routes/userRoutes.js`.
- Edicion solo del usuario autenticado: `backend/controllers/userController.js`.
- Cambio de contrasena con contrasena actual: `backend/controllers/userController.js`.
- Cambio de email solo despues de validar clave y codigo: `backend/controllers/emailController.js`.

## Admin

- Vista admin: `frontend/src/pages/AdminPage.jsx`.
- Ruta frontend para admin: `frontend/src/App.jsx`.
- Verificacion de rol en backend: `backend/middlewares/authMiddleware.js`.
- Listado sin password_hash: `backend/models/userModel.js`.
- Acciones auditadas: `backend/controllers/adminController.js`.
- Tabla de actividad y filtros: `frontend/src/components/admin/AuditActivity.jsx`.
- Gestion de cuentas atomizada: `frontend/src/components/admin/UserManagement.jsx`.
- Cambio administrativo + auditoria en transaccion; desactivar revoca sesiones.

## Seguridad

- `backend/.env` y secretos fuera del codigo: `backend/.env.example`, `backend/config/env.js`.
- SQL parametrizado: `backend/models/`.
- Proteccion XSS basica: no se usa `dangerouslySetInnerHTML`; inputs se validan/sanitizan.
- CSRF: `backend/middlewares/authMiddleware.js` y `frontend/src/services/apiClient.js`.
- Cookies `httpOnly`, `SameSite=Strict`, `Secure` en produccion: `backend/config/cookies.js`.
- CORS restringido: `backend/app.js`.
- Helmet: `backend/app.js`.
- Manejo centralizado de errores: `backend/middlewares/errorHandler.js`.
- Auditoria: `backend/models/auditLogModel.js`.

## Base de Datos y 3FN

- `roles`: separa roles de usuarios y evita texto repetido sin control.
- `users`: guarda identidad y hash de contrasena; no guarda sesiones ni auditoria.
- `user_sessions`: separa sesiones y refresh tokens hasheados por usuario.
- `audit_logs`: separa eventos auditables de los datos principales.
- `oauth_accounts`: guarda una fila por identidad externa y FK a `users`.
- `oauth_login_states`: transacciones efimeras para `state`, PKCE y nonce de un solo uso.
- `auth_challenges`: codigos Mailtrap hasheados, proposito, vencimiento, intentos y consumo.

Cumplimiento:

- 1FN: columnas atomicas sin listas ni grupos repetidos.
- 2FN: claves primarias simples; no hay dependencias parciales.
- 3FN: roles, sesiones y auditoria estan en tablas separadas; no hay dependencias transitivas relevantes.

## Atomizacion

- `components`: piezas reutilizables de UI.
- `pages`: pantallas completas.
- `services`: llamadas HTTP.
- `context`: estado global de sesion y tema.
- `hooks`: acceso seguro a contextos.
- `utils`: validadores compartidos.
- `controllers`: logica de endpoints.
- `models`: SQL parametrizado.
- `routes`: definicion de rutas.
- `middlewares`: autenticacion, CSRF, roles, errores, validaciones y rate limiting.
- `config`: entorno, cookies y DB.

## Limitaciones Honestamente Declaradas

- La recuperacion, verificacion, desbloqueo y cambio de email del R3 completo permanecen implementados con Mailtrap.
- Para probar registro/login reales hace falta MySQL levantado y `backend/.env` configurado.
- `npm run setup:local` prepara esos requisitos en Windows; `npm run doctor` los verifica.
- Pruebas reales de permisos y autenticacion: `backend/tests/auth.test.js` (base temporal).
- Las pruebas end-to-end de proveedores requieren apps y credenciales del alumno; no se versionan ni se simulan como reales.
- Facebook puede devolver email sin la afirmacion `email_verified`; por eso no se auto-vincula a una cuenta local existente.
- X puede exigir un plan pago y su endpoint OAuth 2.0 de perfil no incluye email.
- Para 3FN, las columnas generadas de normalizacion son redundancia fisica controlada; ver `INICIO_Y_DEFENSA.md`.
- Auth0 ofrece Developer Keys para probar algunas conexiones oficiales. Discord, Twitch, X y cualquier conexion sin Developer Keys requieren una app y credenciales del proveedor; sin ellas no se simula una autenticacion falsa.

<!-- Este archivo exporta: checklist de cumplimiento de requisitos. -->
<!-- Se usa en: README.md y entrega al profesor. -->
<!-- Importa de: estructura del proyecto, backend/db/schema.sql y codigo fuente. -->
