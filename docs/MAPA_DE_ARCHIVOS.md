# Mapa De Archivos Importantes

## Backend

- `backend/app.js`: arma Express, CORS, Helmet, rutas y errores.
- `backend/server.js`: levanta servidor y cierra DB al apagar.
- `backend/config/env.js`: valida variables de entorno.
- `backend/config/db.js`: pool MySQL y transacciones.
- `backend/config/cookies.js`: cookies seguras para access/refresh.
- `backend/config/oauthProviders.js`: configuracion declarativa y normalizacion de proveedores.
- `backend/controllers/authController.js`: registro, login, refresh, logout, disponibilidad.
- `backend/controllers/userController.js`: perfil propio y cambio de contrasena.
- `backend/controllers/adminController.js`: listado y gestion admin.
- `backend/controllers/oauthController.js`: inicio/callback genericos y vinculacion social.
- `backend/controllers/codeController.js`: verificacion, desbloqueo y recuperacion por codigo.
- `backend/controllers/emailController.js`: cambio de email confirmado por Mailtrap.
- `backend/models/userModel.js`: consultas SQL de usuarios.
- `backend/models/sessionModel.js`: sesiones y refresh tokens hasheados.
- `backend/models/auditLogModel.js`: logs de auditoria.
- `backend/models/oauthAccountModel.js`: vinculos proveedor-usuario.
- `backend/models/oauthStateModel.js`: estado, PKCE y nonce efimeros de un solo uso.
- `backend/services/oauthService.js`: URLs, intercambio de codigo, OIDC y perfil.
- `backend/services/mailService.js`: transporte SMTP encapsulado y comprobacion Mailtrap.
- `backend/services/challengeService.js`: HMAC, vencimiento, intentos y consumo atomico de codigos.
- `backend/routes/oauthRoutes.js`: endpoints `/api/auth/oauth`.
- `backend/middlewares/authMiddleware.js`: JWT, sesion, CSRF y roles.
- `backend/middlewares/rateLimiters.js`: limite de intentos.
- `backend/validations/`: validaciones backend.
- `backend/db/schema.sql`: modelo relacional.

## Frontend

- `frontend/src/main.jsx`: entrada React.
- `frontend/src/App.jsx`: rutas.
- `frontend/src/context/AuthContext.jsx`: sesion.
- `frontend/src/context/ThemeContext.jsx`: tema claro/oscuro.
- `frontend/src/services/apiClient.js`: fetch con cookies, CSRF y refresh.
- `frontend/src/components/SocialLoginButtons.jsx`: botones oficiales y navegacion OAuth.
- `frontend/src/utils/validators.js`: validaciones frontend.
- `frontend/src/pages/RegisterPage.jsx`: registro.
- `frontend/src/pages/LoginPage.jsx`: login.
- `frontend/src/pages/ProfilePage.jsx`: perfil.
- `frontend/src/pages/CodePage.jsx`: pantalla reutilizable para los tres recorridos de codigo.
- `frontend/src/components/profile/`: formularios independientes de datos, email y contrasena.
- `frontend/src/pages/AdminPage.jsx`: admin.
- `frontend/src/components/`: UI reutilizable.

## Documentacion

- `backend/scripts/setupLocal.js`: prepara MySQL, SQL, claves y admin inicial.
- `backend/scripts/prepareDev.js`: arranque comprobado antes de React/Express.
- `backend/scripts/doctor.js`: diagnostico sin revelar secretos.
- `backend/scripts/migrateMySQL.js`: migracion R5 con usuario propietario.
- `backend/scripts/checkMail.js`: diagnostico SMTP sin revelar credenciales.
- `backend/services/databaseHealth.js`: comprueba conexion, tablas y permisos.
- `backend/tests/auth.test.js`: verificacion real con MySQL aislado.
- `frontend/src/components/admin/UserManagement.jsx`: gestion de cuentas.
- `frontend/src/components/admin/AuditActivity.jsx`: actividad y filtros.
- `docs/INICIO_Y_DEFENSA.md`: inicio, MySQL Workbench, demostracion y preguntas de defensa.
- `docs/PRUEBAS_MANUALES_OAUTH.md`: alta y prueba end-to-end por proveedor.
- `docs/CONFIGURAR_AUTH0.md`: tenant, callbacks y conexiones sociales centralizadas.
- `docs/auth0/*.js`: scripts de perfil para conexiones personalizadas de Auth0.
- `docs/PRUEBAS_MANUALES_USUARIOS_Y_MAILTRAP.md`: registro, verificacion, recuperacion y perfil.

- `README.md`: resumen, setup y decisiones tecnicas.
- `docs/CUMPLIMIENTO_REQUERIMIENTOS.md`: checklist contra la consigna.
- `docs/GUIA_ENTREGA_PROFESOR.md`: pasos para mostrar/subir.

<!-- Este archivo exporta: mapa de archivos. -->
<!-- Se usa en: README.md y revision rapida del proyecto. -->
<!-- Importa de: estructura del proyecto. -->
