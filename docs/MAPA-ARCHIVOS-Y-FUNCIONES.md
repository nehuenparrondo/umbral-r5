# R5 · Mapa del código activo

[Empezar por la explicación sencilla](LEER-EL-CODIGO.md). Este índice ayuda a ubicar piezas; no hace falta leerlo de principio a fin. Las líneas corresponden a esta revisión y pueden desplazarse si se edita el archivo.

## backend

### [backend/app.js](../backend/app.js)

Compone Express: protecciones HTTP, rutas /api, tratamiento de errores y entrega del frontend compilado en producción. Importar esta composición no equivale a arrancar el puerto: eso lo hace server.js.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js), [backend/routes/adminRoutes.js](../backend/routes/adminRoutes.js), [backend/routes/authRoutes.js](../backend/routes/authRoutes.js), [backend/routes/oauthRoutes.js](../backend/routes/oauthRoutes.js), [backend/routes/userRoutes.js](../backend/routes/userRoutes.js), [backend/middlewares/errorHandler.js](../backend/middlewares/errorHandler.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/services/databaseHealth.js](../backend/services/databaseHealth.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/config/cookies.js](../backend/config/cookies.js)

Política común de cookies de acceso y renovación. La configuración debe coincidir al crearlas y borrarlas; las cookies de sesión no son datos de perfil editables.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/config/db.js](../backend/config/db.js)

Pool MySQL y adaptador del resultado de las consultas. Usa parámetros y transacciones; la base puede estar en Aiven con TLS o en la configuración local, sin cambiar los modelos.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js).

**Funciones para buscar:**

- [`mysqlConnectionOptions` · línea 11](../backend/config/db.js#L11)
- [`wrapMySQLConnection` · línea 38](../backend/config/db.js#L38)
- [`query` · línea 77](../backend/config/db.js#L77)
- [`withTransaction` · línea 83](../backend/config/db.js#L83): Entrega una conexión a una operación y coordina commit/rollback y liberación. Todas sus consultas deben usar ese client para pertenecer a la misma transacción.

### [backend/config/env.js](../backend/config/env.js)

Lee y valida la configuración privada del backend. Un nombre de variable no es su valor secreto; las claves se cargan desde entorno/.env y nunca deben copiarse a la interfaz.

**Funciones para buscar:**

- [`toInteger` · línea 16](../backend/config/env.js#L16)
- [`toBoolean` · línea 22](../backend/config/env.js#L22)
- [`required` · línea 28](../backend/config/env.js#L28)
- [`optional` · línea 37](../backend/config/env.js#L37)

### [backend/config/oauthProviders.js](../backend/config/oauthProviders.js)

Describe los proveedores y devuelve al frontend solo su disponibilidad pública. Google/GitHub se configuran mediante Auth0 y Discord por su integración; los secretos permanecen del lado del servidor.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js).

**Funciones para buscar:**

- [`redirectUri` · línea 11](../backend/config/oauthProviders.js#L11)
- [`configured` · línea 14](../backend/config/oauthProviders.js#L14)
- [`provider` · línea 17](../backend/config/oauthProviders.js#L17)
- [`auth0SubjectId` · línea 32](../backend/config/oauthProviders.js#L32)
- [`auth0Provider` · línea 39](../backend/config/oauthProviders.js#L39)
- [`getOAuthProvider` · línea 251](../backend/config/oauthProviders.js#L251)
- [`listPublicOAuthProviders` · línea 254](../backend/config/oauthProviders.js#L254)

### [backend/controllers/adminController.js](../backend/controllers/adminController.js)

Listado/edición administrativa y consulta de auditoría. Los permisos se exigen en las rutas; los cambios de rol y estado no son simples preferencias visuales.

**Se conecta con:** [backend/models/auditLogModel.js](../backend/models/auditLogModel.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/config/db.js](../backend/config/db.js), [backend/models/sessionModel.js](../backend/models/sessionModel.js).

**Funciones para buscar:**

- [`toPageNumber` · línea 15](../backend/controllers/adminController.js#L15)
- [`getUsers` · línea 20](../backend/controllers/adminController.js#L20)
- [`updateUserAsAdmin` · línea 35](../backend/controllers/adminController.js#L35)
- [`getAuditLogs` · línea 80](../backend/controllers/adminController.js#L80)

### [backend/controllers/authController.js](../backend/controllers/authController.js)

Coordina registro, login, renovación y cierre de sesión. Une validaciones, modelos, bcrypt, auditoría y cookies; el alta tradicional requiere confirmar email antes de abrir una sesión.

**Se conecta con:** [backend/config/cookies.js](../backend/config/cookies.js), [backend/config/db.js](../backend/config/db.js), [backend/config/env.js](../backend/config/env.js), [backend/models/auditLogModel.js](../backend/models/auditLogModel.js), [backend/models/sessionModel.js](../backend/models/sessionModel.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/services/challengeService.js](../backend/services/challengeService.js), [backend/services/mailService.js](../backend/services/mailService.js), [backend/services/tokenService.js](../backend/services/tokenService.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/utils/normalizers.js](../backend/utils/normalizers.js).

**Funciones para buscar:**

- [`setAuthCookies` · línea 53](../backend/controllers/authController.js#L53)
- [`clearAuthCookies` · línea 58](../backend/controllers/authController.js#L58)
- [`issueNewSession` · línea 69](../backend/controllers/authController.js#L69): Recibe usuario público y solicitud; crea una sesión persistida con hash de refresh, firma el JWT de acceso y devuelve también CSRF. La respuesta HTTP instala las cookies después.
- [`register` · línea 94](../backend/controllers/authController.js#L94): Valida disponibilidad, calcula bcrypt y crea la cuenta y su auditoría en una transacción. Luego solicita verificación por correo; no abre sesión antes de confirmar el email.
- [`login` · línea 167](../backend/controllers/authController.js#L167): Comprueba bcrypt y estado de la cuenta dentro de una transacción. Tres intentos fallidos pueden bloquearla; solo una cuenta activa, no bloqueada y verificada obtiene sesión y cookies.
- [`refresh` · línea 266](../backend/controllers/authController.js#L266): Busca el hash de la cookie de renovación, comprueba la cuenta y rota el refresh token. Devuelve nuevo acceso/CSRF; si la sesión no sirve limpia cookies y rechaza la solicitud.
- [`me` · línea 299](../backend/controllers/authController.js#L299)
- [`logout` · línea 306](../backend/controllers/authController.js#L306): Revoca la sesión del servidor, registra auditoría y elimina las cookies. No borra la cuenta ni las identidades sociales vinculadas.
- [`checkAvailability` · línea 318](../backend/controllers/authController.js#L318)

### [backend/controllers/codeController.js](../backend/controllers/codeController.js)

Recibe códigos de email y coordina verificación, desbloqueo o contraseña nueva. Usa los desafíos del servidor; no acepta que el navegador declare por sí mismo un email verificado.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js), [backend/models/auditLogModel.js](../backend/models/auditLogModel.js), [backend/models/sessionModel.js](../backend/models/sessionModel.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/controllers/authController.js](../backend/controllers/authController.js), [backend/services/challengeService.js](../backend/services/challengeService.js), [backend/services/mailService.js](../backend/services/mailService.js), [backend/utils/errors.js](../backend/utils/errors.js).

**Funciones para buscar:**

- [`requestCode` · línea 35](../backend/controllers/codeController.js#L35): Recibe identificador y propósito y responde con formato uniforme incluso si la cuenta no existe. Solicita un correo únicamente cuando esa cuenta reúne las condiciones.
- [`confirmCode` · línea 72](../backend/controllers/codeController.js#L72): Consume el desafío según su propósito. Verificar email regresa al login; desbloquear puede abrir una nueva sesión. No tratar ambos resultados como si fueran iguales.
- [`resetPassword` · línea 123](../backend/controllers/codeController.js#L123): Consume un desafío reset_password, guarda bcrypt de la nueva contraseña y revoca sesiones y desafíos anteriores. Al terminar exige iniciar sesión otra vez.

### [backend/controllers/emailController.js](../backend/controllers/emailController.js)

Cambio de correo en dos pasos: solicitar confirmación del nuevo buzón y consumir un desafío ligado a la cuenta autenticada. Evita confundir el borrador del formulario con el email persistido.

**Se conecta con:** [backend/models/auditLogModel.js](../backend/models/auditLogModel.js), [backend/models/sessionModel.js](../backend/models/sessionModel.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/services/challengeService.js](../backend/services/challengeService.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/utils/normalizers.js](../backend/utils/normalizers.js).

**Funciones para buscar:**

- [`requestEmailChange` · línea 24](../backend/controllers/emailController.js#L24)
- [`confirmEmailChange` · línea 59](../backend/controllers/emailController.js#L59)

### [backend/controllers/oauthController.js](../backend/controllers/oauthController.js)

Recorrido del login social: iniciar la redirección, validar el retorno y resolver la cuenta local dentro de una transacción. Emite las mismas cookies de Umbral que el login tradicional.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js), [backend/config/oauthProviders.js](../backend/config/oauthProviders.js), [backend/config/db.js](../backend/config/db.js), [backend/models/auditLogModel.js](../backend/models/auditLogModel.js), [backend/models/oauthAccountModel.js](../backend/models/oauthAccountModel.js), [backend/models/oauthStateModel.js](../backend/models/oauthStateModel.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/controllers/authController.js](../backend/controllers/authController.js), [backend/services/oauthService.js](../backend/services/oauthService.js), [backend/services/tokenService.js](../backend/services/tokenService.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/utils/oauthErrors.js](../backend/utils/oauthErrors.js).

**Funciones para buscar:**

- [`safeEqual` · línea 46](../backend/controllers/oauthController.js#L46)
- [`clientUrl` · línea 55](../backend/controllers/oauthController.js#L55)
- [`redirectError` · línea 57](../backend/controllers/oauthController.js#L57)
- [`listProviders` · línea 75](../backend/controllers/oauthController.js#L75)
- [`startOAuth` · línea 83](../backend/controllers/oauthController.js#L83): Crea una transacción temporal en SQL, instala una cookie state y redirige a la red. No inicia sesión local hasta completar y validar el retorno.
- [`resolveOAuthUser` · línea 111](../backend/controllers/oauthController.js#L111): Busca primero proveedor + ID externo. Para vincular por email exige verificación; si registra una cuenta social, su passwordHash es null, no la contraseña de la red.
- [`oauthCallback` · línea 205](../backend/controllers/oauthController.js#L205): Compara cookie/state, consume la transacción, obtiene el perfil y crea o vincula la cuenta con bloqueos SQL. Solo después emite cookies locales y redirige al perfil.

### [backend/controllers/userController.js](../backend/controllers/userController.js)

Operaciones de perfil y contraseña de la cuenta autenticada. La identidad viene del middleware de sesión; no se permite escoger otro usuario cambiando un campo del formulario.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js), [backend/models/auditLogModel.js](../backend/models/auditLogModel.js), [backend/models/oauthAccountModel.js](../backend/models/oauthAccountModel.js), [backend/models/sessionModel.js](../backend/models/sessionModel.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/utils/normalizers.js](../backend/utils/normalizers.js), [backend/config/db.js](../backend/config/db.js), [backend/services/challengeService.js](../backend/services/challengeService.js).

**Funciones para buscar:**

- [`getProfile` · línea 25](../backend/controllers/userController.js#L25)
- [`getOAuthAccounts` · línea 29](../backend/controllers/userController.js#L29)
- [`updateProfile` · línea 34](../backend/controllers/userController.js#L34)
- [`changePassword` · línea 82](../backend/controllers/userController.js#L82)

### [backend/eslint.config.js](../backend/eslint.config.js)

Configuración del análisis estático de código. Define reglas y archivos revisados; no decide permisos de usuarios ni persistencia.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/middlewares/authMiddleware.js](../backend/middlewares/authMiddleware.js)

Guardas reales del servidor: firma/sesión activa, CSRF y rol. Un ProtectedRoute del frontend mejora navegación, pero no reemplaza estas comprobaciones de cada endpoint.

**Se conecta con:** [backend/config/cookies.js](../backend/config/cookies.js), [backend/models/sessionModel.js](../backend/models/sessionModel.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/services/tokenService.js](../backend/services/tokenService.js).

**Funciones para buscar:**

- [`requireAuth` · línea 21](../backend/middlewares/authMiddleware.js#L21): Resuelve la cookie de acceso y exige tanto JWT válido como sesión activa. Añade usuario y credencial comprobados a req para las rutas siguientes.
- [`requireCsrfToken` · línea 68](../backend/middlewares/authMiddleware.js#L68): En solicitudes que modifican datos exige la prueba CSRF asociada a la sesión. Tener cookies en el navegador no es suficiente para autorizar una petición de otro sitio.
- [`requireRole` · línea 90](../backend/middlewares/authMiddleware.js#L90): Construye una guarda de rol para las rutas administrativas. El rol enviado en un formulario no sustituye al obtenido de la sesión autenticada.

### [backend/middlewares/errorHandler.js](../backend/middlewares/errorHandler.js)

Última traducción de errores a respuestas HTTP legibles. Evita devolver detalles internos innecesarios y centraliza cómo una excepción llega al formulario.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js), [backend/utils/errors.js](../backend/utils/errors.js).

**Funciones para buscar:**

- [`notFoundHandler` · línea 10](../backend/middlewares/errorHandler.js#L10)
- [`errorHandler` · línea 14](../backend/middlewares/errorHandler.js#L14)

### [backend/middlewares/rateLimiters.js](../backend/middlewares/rateLimiters.js)

Límites de solicitudes para reducir abuso en operaciones sensibles. La espera se aplica en el servidor, no solo deshabilitando un botón del navegador.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js).

**Funciones para buscar:**

- [`jsonRateLimitHandler` · línea 10](../backend/middlewares/rateLimiters.js#L10)

### [backend/middlewares/validateRequest.js](../backend/middlewares/validateRequest.js)

Módulo auxiliar del proyecto. Las importaciones y símbolos siguientes permiten seguir su relación con el resto del código.

**Se conecta con:** [backend/utils/errors.js](../backend/utils/errors.js).

**Funciones para buscar:**

- [`validateRequest` · línea 8](../backend/middlewares/validateRequest.js#L8)

### [backend/models/auditLogModel.js](../backend/models/auditLogModel.js)

Registro y consulta de eventos relevantes. La auditoría permite explicar quién realizó una acción sin guardar contraseñas ni convertirla en una lista editable desde el perfil.

**Se conecta con:** [backend/config/db.js](../backend/config/db.js).

**Funciones para buscar:**

- [`writeAuditLog` · línea 11](../backend/models/auditLogModel.js#L11)
- [`listAuditLogs` · línea 29](../backend/models/auditLogModel.js#L29)

### [backend/models/oauthAccountModel.js](../backend/models/oauthAccountModel.js)

Vínculos entre usuario local e identidad externa: proveedor + identificador del proveedor. No almacena la contraseña de Google/GitHub/Discord ni sus mensajes.

**Se conecta con:** [backend/config/db.js](../backend/config/db.js).

**Funciones para buscar:**

- [`findOAuthAccount` · línea 10](../backend/models/oauthAccountModel.js#L10)
- [`createOAuthAccount` · línea 27](../backend/models/oauthAccountModel.js#L27)
- [`listOAuthAccountsByUserId` · línea 39](../backend/models/oauthAccountModel.js#L39)

### [backend/models/oauthStateModel.js](../backend/models/oauthStateModel.js)

Transacciones temporales de redirección OAuth. El estado se consume una sola vez para relacionar el retorno con el navegador que comenzó el acceso.

**Se conecta con:** [backend/config/db.js](../backend/config/db.js).

**Funciones para buscar:**

- [`createOAuthState` · línea 10](../backend/models/oauthStateModel.js#L10)
- [`consumeOAuthState` · línea 25](../backend/models/oauthStateModel.js#L25)
- [`consume` · línea 26](../backend/models/oauthStateModel.js#L26)

### [backend/models/sessionModel.js](../backend/models/sessionModel.js)

Persistencia y revocación de sesiones. Guarda el hash del refresh token y permite rotarlo sin aceptar dos usos simultáneos del mismo valor anterior.

**Se conecta con:** [backend/config/db.js](../backend/config/db.js).

**Funciones para buscar:**

- [`createSession` · línea 11](../backend/models/sessionModel.js#L11)
- [`findValidSessionByRefreshHash` · línea 31](../backend/models/sessionModel.js#L31)
- [`findActiveSessionById` · línea 51](../backend/models/sessionModel.js#L51)
- [`rotateSession` · línea 64](../backend/models/sessionModel.js#L64)
- [`revokeSession` · línea 83](../backend/models/sessionModel.js#L83)
- [`revokeUserSessionsExcept` · línea 93](../backend/models/sessionModel.js#L93)
- [`revokeAllUserSessions` · línea 108](../backend/models/sessionModel.js#L108)

### [backend/models/userModel.js](../backend/models/userModel.js)

Consultas parametrizadas de users. Separa lecturas públicas de lecturas que requieren el hash de contraseña y traduce columnas SQL al formato de objetos de la aplicación.

**Se conecta con:** [backend/config/db.js](../backend/config/db.js), [backend/utils/normalizers.js](../backend/utils/normalizers.js).

**Funciones para buscar:**

- [`findUserByIdentifierForAuth` · línea 52](../backend/models/userModel.js#L52)
- [`findPublicUserById` · línea 68](../backend/models/userModel.js#L68)
- [`findPublicUserByEmail` · línea 77](../backend/models/userModel.js#L77)
- [`findUniqueUsername` · línea 85](../backend/models/userModel.js#L85)
- [`findUserByIdForPassword` · línea 100](../backend/models/userModel.js#L100)
- [`findDuplicates` · línea 115](../backend/models/userModel.js#L115)
- [`createUser` · línea 147](../backend/models/userModel.js#L147)
- [`updateUserProfile` · línea 172](../backend/models/userModel.js#L172)
- [`updatePasswordHash` · línea 189](../backend/models/userModel.js#L189)
- [`listUsers` · línea 202](../backend/models/userModel.js#L202)
- [`updateUserAdminFields` · línea 225](../backend/models/userModel.js#L225)

### [backend/routes/adminRoutes.js](../backend/routes/adminRoutes.js)

Tabla de endpoints: conecta método/ruta con validaciones, permisos y controlador. La ruta recibe solicitudes HTTP; los modelos y servicios contienen el trabajo sobre datos.

**Se conecta con:** [backend/controllers/adminController.js](../backend/controllers/adminController.js), [backend/middlewares/authMiddleware.js](../backend/middlewares/authMiddleware.js), [backend/middlewares/validateRequest.js](../backend/middlewares/validateRequest.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/validations/userValidation.js](../backend/validations/userValidation.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/routes/authRoutes.js](../backend/routes/authRoutes.js)

Tabla de endpoints: conecta método/ruta con validaciones, permisos y controlador. La ruta recibe solicitudes HTTP; los modelos y servicios contienen el trabajo sobre datos.

**Se conecta con:** [backend/controllers/authController.js](../backend/controllers/authController.js), [backend/controllers/codeController.js](../backend/controllers/codeController.js), [backend/middlewares/authMiddleware.js](../backend/middlewares/authMiddleware.js), [backend/middlewares/rateLimiters.js](../backend/middlewares/rateLimiters.js), [backend/middlewares/validateRequest.js](../backend/middlewares/validateRequest.js), [backend/validations/authValidation.js](../backend/validations/authValidation.js), [backend/validations/codeValidation.js](../backend/validations/codeValidation.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/config/cookies.js](../backend/config/cookies.js).

**Funciones para buscar:**

- [`anonymous` · línea 97](../backend/routes/authRoutes.js#L97)

### [backend/routes/oauthRoutes.js](../backend/routes/oauthRoutes.js)

Tabla de endpoints: conecta método/ruta con validaciones, permisos y controlador. La ruta recibe solicitudes HTTP; los modelos y servicios contienen el trabajo sobre datos.

**Se conecta con:** [backend/controllers/oauthController.js](../backend/controllers/oauthController.js), [backend/middlewares/rateLimiters.js](../backend/middlewares/rateLimiters.js), [backend/utils/errors.js](../backend/utils/errors.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/routes/userRoutes.js](../backend/routes/userRoutes.js)

Tabla de endpoints: conecta método/ruta con validaciones, permisos y controlador. La ruta recibe solicitudes HTTP; los modelos y servicios contienen el trabajo sobre datos.

**Se conecta con:** [backend/controllers/userController.js](../backend/controllers/userController.js), [backend/controllers/emailController.js](../backend/controllers/emailController.js), [backend/middlewares/authMiddleware.js](../backend/middlewares/authMiddleware.js), [backend/middlewares/validateRequest.js](../backend/middlewares/validateRequest.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/validations/userValidation.js](../backend/validations/userValidation.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/scripts/checkMail.js](../backend/scripts/checkMail.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/services/mailService.js](../backend/services/mailService.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/scripts/checkOAuth.js](../backend/scripts/checkOAuth.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js), [backend/config/oauthProviders.js](../backend/config/oauthProviders.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/scripts/createAdmin.js](../backend/scripts/createAdmin.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js), [backend/config/db.js](../backend/config/db.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/utils/normalizers.js](../backend/utils/normalizers.js), [backend/utils/passwordPolicy.js](../backend/utils/passwordPolicy.js).

**Funciones para buscar:**

- [`requiredAdminEnv` · línea 16](../backend/scripts/createAdmin.js#L16)
- [`main` · línea 24](../backend/scripts/createAdmin.js#L24)

### [backend/scripts/doctor.js](../backend/scripts/doctor.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/scripts/importPreviousAccounts.js](../backend/scripts/importPreviousAccounts.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/scripts/mysqlPaths.js](../backend/scripts/mysqlPaths.js).

**Funciones para buscar:**

- [`importPreviousAccounts` · línea 6](../backend/scripts/importPreviousAccounts.js#L6)

### [backend/scripts/localMySQL.js](../backend/scripts/localMySQL.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/scripts/mysqlPaths.js](../backend/scripts/mysqlPaths.js).

**Funciones para buscar:**

- [`readMySQLCredentials` · línea 16](../backend/scripts/localMySQL.js#L16)
- [`localMySQLOptions` · línea 19](../backend/scripts/localMySQL.js#L19)
- [`startLocalMySQL` · línea 30](../backend/scripts/localMySQL.js#L30)
- [`ping` · línea 35](../backend/scripts/localMySQL.js#L35)
- [`stopLocalMySQL` · línea 96](../backend/scripts/localMySQL.js#L96)

### [backend/scripts/localPaths.js](../backend/scripts/localPaths.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/scripts/migrateMySQL.js](../backend/scripts/migrateMySQL.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/scripts/mysqlSchema.js](../backend/scripts/mysqlSchema.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/scripts/mysqlPaths.js](../backend/scripts/mysqlPaths.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/scripts/localPaths.js](../backend/scripts/localPaths.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/scripts/mysqlSchema.js](../backend/scripts/mysqlSchema.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/scripts/mysqlPaths.js](../backend/scripts/mysqlPaths.js).

**Funciones para buscar:**

- [`applyMySQLSchema` · línea 6](../backend/scripts/mysqlSchema.js#L6)
- [`grantApplicationPrivileges` · línea 19](../backend/scripts/mysqlSchema.js#L19)

### [backend/scripts/prepareDev.js](../backend/scripts/prepareDev.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/scripts/localMySQL.js](../backend/scripts/localMySQL.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/scripts/setupLocal.js](../backend/scripts/setupLocal.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/scripts/mysqlPaths.js](../backend/scripts/mysqlPaths.js), [backend/scripts/localMySQL.js](../backend/scripts/localMySQL.js), [backend/scripts/mysqlSchema.js](../backend/scripts/mysqlSchema.js), [backend/scripts/importPreviousAccounts.js](../backend/scripts/importPreviousAccounts.js).

**Funciones para buscar:**

- [`secret` · línea 21](../backend/scripts/setupLocal.js#L21)
- [`main` · línea 23](../backend/scripts/setupLocal.js#L23)

### [backend/scripts/stopLocal.js](../backend/scripts/stopLocal.js)

Script de preparación, diagnóstico o mantenimiento. No es una pantalla ni se ejecuta por importarlo desde el navegador; revisar el comando y su destino antes de usarlo porque algunos scripts modifican datos.

**Se conecta con:** [backend/scripts/localMySQL.js](../backend/scripts/localMySQL.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/server.js](../backend/server.js)

Punto de arranque y apagado de Node.js. Usa la configuración validada para escuchar; no es donde se escribe la lógica de formularios o consultas de usuarios.

**Se conecta con:** [backend/app.js](../backend/app.js), [backend/config/env.js](../backend/config/env.js), [backend/config/db.js](../backend/config/db.js), [backend/services/databaseHealth.js](../backend/services/databaseHealth.js).

**Funciones para buscar:**

- [`shutdown` · línea 39](../backend/server.js#L39)

### [backend/services/challengeService.js](../backend/services/challengeService.js)

Códigos temporales para verificar email, desbloquear y recuperar acceso. Cada desafío tiene propósito, vencimiento, intentos y estado de envío; no es una contraseña permanente.

**Se conecta con:** [backend/config/db.js](../backend/config/db.js), [backend/config/env.js](../backend/config/env.js), [backend/models/userModel.js](../backend/models/userModel.js), [backend/utils/errors.js](../backend/utils/errors.js), [backend/services/mailService.js](../backend/services/mailService.js).

**Funciones para buscar:**

- [`digest` · línea 21](../backend/services/challengeService.js#L21)
- [`issueChallenge` · línea 31](../backend/services/challengeService.js#L31): Genera seis dígitos y guarda un HMAC, no el código legible. Limita solicitudes, reutiliza un desafío reciente y envía correo fuera de la transacción; si falla, marca el desafío como fallido.
- [`consumeChallenge` · línea 111](../backend/services/challengeService.js#L111): Comprueba propósito, destinatario, vencimiento, entrega e intentos con bloqueo SQL. Ejecuta la operación autorizada y consume el desafío en la misma transacción; un error revierte las escrituras de esa operación.
- [`invalid` · línea 119](../backend/services/challengeService.js#L119)
- [`invalidateChallenges` · línea 184](../backend/services/challengeService.js#L184)

### [backend/services/databaseHealth.js](../backend/services/databaseHealth.js)

Servicio reutilizable de la aplicación. Separa operaciones de datos o comunicación de la presentación; sus funciones importadas indican si la operación es local, HTTP o de servidor.

**Se conecta con:** [backend/config/db.js](../backend/config/db.js).

**Funciones para buscar:**

- [`checkDatabase` · línea 10](../backend/services/databaseHealth.js#L10)
- [`databaseHelp` · línea 22](../backend/services/databaseHealth.js#L22)

### [backend/services/mailService.js](../backend/services/mailService.js)

Transporte de códigos mediante SMTP. Lee configuración privada del servidor; tener un mensaje construido no demuestra que el proveedor haya aceptado enviarlo.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js), [backend/utils/errors.js](../backend/utils/errors.js).

**Funciones para buscar:**

- [`ensureMailConfigured` · línea 18](../backend/services/mailService.js#L18)
- [`getTransport` · línea 25](../backend/services/mailService.js#L25)
- [`sendCode` · línea 43](../backend/services/mailService.js#L43)
- [`verifyMailConnection` · línea 75](../backend/services/mailService.js#L75)

### [backend/services/oauthService.js](../backend/services/oauthService.js)

Protocolo del acceso social: state, PKCE, intercambio de código, verificación OIDC y normalización del perfil. Los tokens externos se usan para consultar identidad, no se guardan como contraseña local.

**Se conecta con:** [backend/utils/errors.js](../backend/utils/errors.js), [backend/utils/normalizers.js](../backend/utils/normalizers.js), [backend/services/tokenService.js](../backend/services/tokenService.js).

**Funciones para buscar:**

- [`base64Url` · línea 19](../backend/services/oauthService.js#L19)
- [`createPkcePair` · línea 21](../backend/services/oauthService.js#L21)
- [`createOAuthTransaction` · línea 35](../backend/services/oauthService.js#L35): Genera state y, según proveedor, nonce y PKCE con vencimiento. Son datos de una redirección puntual, no un permiso permanente para entrar a cualquier cuenta.
- [`oauthStateCookieName` · línea 51](../backend/services/oauthService.js#L51)
- [`oauthStateCookieOptions` · línea 54](../backend/services/oauthService.js#L54)
- [`buildAuthorizationUrl` · línea 66](../backend/services/oauthService.js#L66): Construye la dirección externa con callback, scopes y parámetros del proveedor. El cambio de dominio durante el acceso es la redirección normal de OAuth.
- [`oauthRequestFailure` · línea 89](../backend/services/oauthService.js#L89)
- [`fetchJson` · línea 100](../backend/services/oauthService.js#L100)
- [`exchangeCodeForTokens` · línea 198](../backend/services/oauthService.js#L198): Intercambia el código del callback usando credenciales privadas del backend y el verificador PKCE cuando corresponde. Nunca debe ejecutarse con el client secret dentro del navegador.
- [`verifyOidcToken` · línea 232](../backend/services/oauthService.js#L232)
- [`fetchNormalizedProfile` · línea 255](../backend/services/oauthService.js#L255): Consulta la identidad externa y la convierte al formato común. Si hay OIDC, compara la identidad firmada con UserInfo antes de entregar el perfil al controlador.
- [`validateNormalizedProfile` · línea 288](../backend/services/oauthService.js#L288)
- [`safeUsernameBase` · línea 314](../backend/services/oauthService.js#L314)
- [`decideOAuthAccountAction` · línea 330](../backend/services/oauthService.js#L330): Decisión pura: usar un vínculo existente, rechazar email ausente/no verificado o permitir vincular/registrar. No escribe SQL; el controlador aplica la decisión.

### [backend/services/tokenService.js](../backend/services/tokenService.js)

Crea los distintos tipos de credencial: JWT corto para acceso, refresh aleatorio para renovar y CSRF para autorizar peticiones que cambian datos. No son intercambiables.

**Se conecta con:** [backend/config/env.js](../backend/config/env.js).

**Funciones para buscar:**

- [`createCsrfToken` · línea 13](../backend/services/tokenService.js#L13)
- [`createRefreshToken` · línea 19](../backend/services/tokenService.js#L19): Devuelve dos representaciones del mismo secreto: rawToken para la cookie y tokenHash para SQL. No registrar rawToken en logs ni enviarlo en datos públicos del perfil.
- [`hashToken` · línea 27](../backend/services/tokenService.js#L27)
- [`refreshExpiryDate` · línea 30](../backend/services/tokenService.js#L30)
- [`signAccessToken` · línea 41](../backend/services/tokenService.js#L41): Firma un JWT con ID, rol, sesión y CSRF; incluye vencimiento, emisor y audiencia. Firmar permite detectar modificaciones, no cifra los datos del token.
- [`verifyAccessToken` · línea 63](../backend/services/tokenService.js#L63): Comprueba firma, vencimiento, emisor y audiencia del JWT. La vigencia de la sesión en SQL se comprueba además en el middleware.

### [backend/tests/accountFlows.test.js](../backend/tests/accountFlows.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [backend/tests/testDatabase.js](../backend/tests/testDatabase.js).

**Funciones para buscar:**

- [`request` · línea 42](../backend/tests/accountFlows.test.js#L42)
- [`login` · línea 69](../backend/tests/accountFlows.test.js#L69)
- [`latestCode` · línea 74](../backend/tests/accountFlows.test.js#L74)

### [backend/tests/auth.test.js](../backend/tests/auth.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [backend/tests/testDatabase.js](../backend/tests/testDatabase.js).

**Funciones para buscar:**

- [`request` · línea 44](../backend/tests/auth.test.js#L44)
- [`login` · línea 77](../backend/tests/auth.test.js#L77)
- [`register` · línea 82](../backend/tests/auth.test.js#L82)
- [`change` · línea 374](../backend/tests/auth.test.js#L374)

### [backend/tests/auth0.test.js](../backend/tests/auth0.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/tests/discord.test.js](../backend/tests/discord.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/tests/hosting.test.js](../backend/tests/hosting.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Funciones para buscar:**

- [`hostingOrigins` · línea 5](../backend/tests/hosting.test.js#L5)

### [backend/tests/microsoftDisabled.test.js](../backend/tests/microsoftDisabled.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/tests/mysql.test.js](../backend/tests/mysql.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [backend/tests/testDatabase.js](../backend/tests/testDatabase.js).

**Funciones para buscar:**

- [`action` · línea 103](../backend/tests/mysql.test.js#L103)

### [backend/tests/oauth.test.js](../backend/tests/oauth.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/tests/oauthErrors.test.js](../backend/tests/oauthErrors.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [backend/utils/oauthErrors.js](../backend/utils/oauthErrors.js), [backend/tests/testDatabase.js](../backend/tests/testDatabase.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/tests/oauthTransport.test.js](../backend/tests/oauthTransport.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/tests/oidcProfile.test.js](../backend/tests/oidcProfile.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [backend/services/oauthService.js](../backend/services/oauthService.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/tests/production.test.js](../backend/tests/production.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [backend/scripts/mysqlPaths.js](../backend/scripts/mysqlPaths.js), [backend/tests/testDatabase.js](../backend/tests/testDatabase.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/tests/structure.test.js](../backend/tests/structure.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [backend/scripts/localPaths.js](../backend/scripts/localPaths.js).

**Funciones para buscar:**

- [`readPackage` · línea 8](../backend/tests/structure.test.js#L8)

### [backend/tests/testDatabase.js](../backend/tests/testDatabase.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [backend/scripts/mysqlPaths.js](../backend/scripts/mysqlPaths.js), [backend/scripts/localMySQL.js](../backend/scripts/localMySQL.js), [backend/scripts/mysqlSchema.js](../backend/scripts/mysqlSchema.js).

**Funciones para buscar:**

- [`createTestDatabase` · línea 19](../backend/tests/testDatabase.js#L19)

### [backend/utils/errors.js](../backend/utils/errors.js)

Ayudas compartidas para transformar o validar datos. Usarlas desde varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito en la interfaz.

**Funciones para buscar:**

- [`asyncHandler` · línea 19](../backend/utils/errors.js#L19)

### [backend/utils/normalizers.js](../backend/utils/normalizers.js)

Ayudas compartidas para transformar o validar datos. Usarlas desde varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito en la interfaz.

**Funciones para buscar:**

- [`normalizeEmail` · línea 9](../backend/utils/normalizers.js#L9)
- [`normalizeUsername` · línea 14](../backend/utils/normalizers.js#L14)
- [`normalizeIdentifier` · línea 19](../backend/utils/normalizers.js#L19)
- [`cleanDisplayName` · línea 24](../backend/utils/normalizers.js#L24)

### [backend/utils/oauthErrors.js](../backend/utils/oauthErrors.js)

Ayudas compartidas para transformar o validar datos. Usarlas desde varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito en la interfaz.

**Funciones para buscar:**

- [`classifyOAuthError` · línea 11](../backend/utils/oauthErrors.js#L11)

### [backend/utils/passwordPolicy.js](../backend/utils/passwordPolicy.js)

Ayudas compartidas para transformar o validar datos. Usarlas desde varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito en la interfaz.

**Funciones para buscar:**

- [`validatePasswordStrength` · línea 22](../backend/utils/passwordPolicy.js#L22)

### [backend/validations/authValidation.js](../backend/validations/authValidation.js)

Reglas autoritativas de entrada para la API. Se ejecutan antes del controlador y convierten campos inválidos en errores HTTP; no dependen de que el formulario del navegador sea honesto.

**Se conecta con:** [backend/utils/passwordPolicy.js](../backend/utils/passwordPolicy.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/validations/codeValidation.js](../backend/validations/codeValidation.js)

Reglas autoritativas de entrada para la API. Se ejecutan antes del controlador y convierten campos inválidos en errores HTTP; no dependen de que el formulario del navegador sea honesto.

**Se conecta con:** [backend/utils/passwordPolicy.js](../backend/utils/passwordPolicy.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [backend/validations/userValidation.js](../backend/validations/userValidation.js)

Reglas autoritativas de entrada para la API. Se ejecutan antes del controlador y convierten campos inválidos en errores HTTP; no dependen de que el formulario del navegador sea honesto.

**Se conecta con:** [backend/utils/passwordPolicy.js](../backend/utils/passwordPolicy.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

## docs

### [docs/auth0/discord-fetch-user-profile.js](../docs/auth0/discord-fetch-user-profile.js)

Módulo auxiliar del proyecto. Las importaciones y símbolos siguientes permiten seguir su relación con el resto del código.

**Funciones para buscar:**

- [`fetchUserProfile` · línea 2](../docs/auth0/discord-fetch-user-profile.js#L2)

### [docs/auth0/twitch-fetch-user-profile.js](../docs/auth0/twitch-fetch-user-profile.js)

Módulo auxiliar del proyecto. Las importaciones y símbolos siguientes permiten seguir su relación con el resto del código.

**Funciones para buscar:**

- [`fetchUserProfile` · línea 2](../docs/auth0/twitch-fetch-user-profile.js#L2)

## frontend

### [frontend/eslint.config.js](../frontend/eslint.config.js)

Configuración del análisis estático de código. Define reglas y archivos revisados; no decide permisos de usuarios ni persistencia.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [frontend/src/App.jsx](../frontend/src/App.jsx)

Mapa de páginas de Umbral. Reúne rutas públicas y protegidas, sin implementar consultas SQL ni autenticación de proveedores dentro del componente.

**Se conecta con:** [frontend/src/components/AppShell.jsx](../frontend/src/components/AppShell.jsx), [frontend/src/components/ProtectedRoute.jsx](../frontend/src/components/ProtectedRoute.jsx), [frontend/src/pages/HomePage.jsx](../frontend/src/pages/HomePage.jsx), [frontend/src/pages/LoginPage.jsx](../frontend/src/pages/LoginPage.jsx), [frontend/src/pages/RegisterPage.jsx](../frontend/src/pages/RegisterPage.jsx), [frontend/src/pages/CodePage.jsx](../frontend/src/pages/CodePage.jsx).

**Funciones para buscar:**

- [`App` · línea 29](../frontend/src/App.jsx#L29)

### [frontend/src/components/admin/AuditActivity.jsx](../frontend/src/components/admin/AuditActivity.jsx)

Componente reutilizable AuditActivity. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Se conecta con:** [frontend/src/services/adminService.js](../frontend/src/services/adminService.js), [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx).

**Funciones para buscar:**

- [`AuditActivity` · línea 26](../frontend/src/components/admin/AuditActivity.jsx#L26)

### [frontend/src/components/admin/UserManagement.jsx](../frontend/src/components/admin/UserManagement.jsx)

Componente reutilizable UserManagement. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Se conecta con:** [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx), [frontend/src/services/adminService.js](../frontend/src/services/adminService.js).

**Funciones para buscar:**

- [`UserManagement` · línea 14](../frontend/src/components/admin/UserManagement.jsx#L14)
- [`updateDraft` · línea 63](../frontend/src/components/admin/UserManagement.jsx#L63)
- [`saveUser` · línea 74](../frontend/src/components/admin/UserManagement.jsx#L74)

### [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx)

Componente reutilizable Alert. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Funciones para buscar:**

- [`Alert` · línea 16](../frontend/src/components/Alert.jsx#L16)

### [frontend/src/components/AppShell.jsx](../frontend/src/components/AppShell.jsx)

Componente reutilizable AppShell. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Se conecta con:** [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx), [frontend/src/components/ThemeToggle.jsx](../frontend/src/components/ThemeToggle.jsx), [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx).

**Funciones para buscar:**

- [`AppShell` · línea 23](../frontend/src/components/AppShell.jsx#L23)

### [frontend/src/components/AuthLayout.jsx](../frontend/src/components/AuthLayout.jsx)

Componente reutilizable AuthLayout. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Funciones para buscar:**

- [`AuthLayout` · línea 62](../frontend/src/components/AuthLayout.jsx#L62)

### [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx)

Componente reutilizable Button. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Funciones para buscar:**

- [`Button` · línea 10](../frontend/src/components/Button.jsx#L10)

### [frontend/src/components/FormStatus.jsx](../frontend/src/components/FormStatus.jsx)

Componente reutilizable FormStatus. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Se conecta con:** [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx).

**Funciones para buscar:**

- [`FormStatus` · línea 10](../frontend/src/components/FormStatus.jsx#L10)

### [frontend/src/components/PasswordStrength.jsx](../frontend/src/components/PasswordStrength.jsx)

Componente reutilizable PasswordStrength. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Se conecta con:** [frontend/src/utils/validators.js](../frontend/src/utils/validators.js).

**Funciones para buscar:**

- [`PasswordStrength` · línea 11](../frontend/src/components/PasswordStrength.jsx#L11)

### [frontend/src/components/profile/EmailChangeForm.jsx](../frontend/src/components/profile/EmailChangeForm.jsx)

Componente reutilizable EmailChangeForm. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Se conecta con:** [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js), [frontend/src/hooks/useForm.js](../frontend/src/hooks/useForm.js), [frontend/src/services/codeService.js](../frontend/src/services/codeService.js), [frontend/src/utils/validators.js](../frontend/src/utils/validators.js), [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx), [frontend/src/components/FormStatus.jsx](../frontend/src/components/FormStatus.jsx), [frontend/src/components/TextField.jsx](../frontend/src/components/TextField.jsx).

**Funciones para buscar:**

- [`EmailChangeForm` · línea 22](../frontend/src/components/profile/EmailChangeForm.jsx#L22)

### [frontend/src/components/profile/PasswordChangeForm.jsx](../frontend/src/components/profile/PasswordChangeForm.jsx)

Componente reutilizable PasswordChangeForm. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Se conecta con:** [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js), [frontend/src/hooks/useForm.js](../frontend/src/hooks/useForm.js), [frontend/src/services/userService.js](../frontend/src/services/userService.js), [frontend/src/utils/validators.js](../frontend/src/utils/validators.js), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx), [frontend/src/components/FormStatus.jsx](../frontend/src/components/FormStatus.jsx), [frontend/src/components/PasswordStrength.jsx](../frontend/src/components/PasswordStrength.jsx), [frontend/src/components/TextField.jsx](../frontend/src/components/TextField.jsx).

**Funciones para buscar:**

- [`PasswordChangeForm` · línea 21](../frontend/src/components/profile/PasswordChangeForm.jsx#L21)

### [frontend/src/components/profile/ProfileDetailsForm.jsx](../frontend/src/components/profile/ProfileDetailsForm.jsx)

Componente reutilizable ProfileDetailsForm. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Se conecta con:** [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js), [frontend/src/hooks/useForm.js](../frontend/src/hooks/useForm.js), [frontend/src/services/userService.js](../frontend/src/services/userService.js), [frontend/src/utils/validators.js](../frontend/src/utils/validators.js), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx), [frontend/src/components/FormStatus.jsx](../frontend/src/components/FormStatus.jsx), [frontend/src/components/TextField.jsx](../frontend/src/components/TextField.jsx).

**Funciones para buscar:**

- [`ProfileDetailsForm` · línea 20](../frontend/src/components/profile/ProfileDetailsForm.jsx#L20)

### [frontend/src/components/ProtectedRoute.jsx](../frontend/src/components/ProtectedRoute.jsx)

Guarda visual de navegación mientras se comprueba sesión/rol. No protege la base por sí sola: el backend vuelve a exigir autorización.

**Se conecta con:** [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js).

**Funciones para buscar:**

- [`ProtectedRoute` · línea 12](../frontend/src/components/ProtectedRoute.jsx#L12)

### [frontend/src/components/SocialLoginButtons.jsx](../frontend/src/components/SocialLoginButtons.jsx)

Botones de redirección, no formularios de contraseña de la red social. Consulta disponibilidad, evita dobles activaciones y delega la autenticación al proveedor externo.

**Se conecta con:** [frontend/src/services/authService.js](../frontend/src/services/authService.js), [frontend/src/utils/socialLogin.js](../frontend/src/utils/socialLogin.js).

**Funciones para buscar:**

- [`SocialLoginButtons` · línea 22](../frontend/src/components/SocialLoginButtons.jsx#L22)
- [`resetNavigation` · línea 29](../frontend/src/components/SocialLoginButtons.jsx#L29)
- [`begin` · línea 56](../frontend/src/components/SocialLoginButtons.jsx#L56)

### [frontend/src/components/TextField.jsx](../frontend/src/components/TextField.jsx)

Componente reutilizable TextField. Sus props conectan contenido y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y los callbacks recibidos en lugar de suponer que guarda directamente en una base.

**Funciones para buscar:**

- [`TextField` · línea 18](../frontend/src/components/TextField.jsx#L18)

### [frontend/src/components/ThemeToggle.jsx](../frontend/src/components/ThemeToggle.jsx)

Parte del sistema visual: comparte colores, tamaños o preferencia de tema según su implementación. La preferencia de apariencia es independiente de la autenticación y de los datos de las tareas.

**Se conecta con:** [frontend/src/hooks/useTheme.js](../frontend/src/hooks/useTheme.js).

**Funciones para buscar:**

- [`ThemeToggle` · línea 11](../frontend/src/components/ThemeToggle.jsx#L11)

### [frontend/src/context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx)

Comparte solo el perfil público y el estado de sesión entre páginas. Las credenciales reales viven en cookies HttpOnly y el CSRF en memoria; al iniciar consulta /me.

**Se conecta con:** [frontend/src/services/apiClient.js](../frontend/src/services/apiClient.js), [frontend/src/services/authService.js](../frontend/src/services/authService.js).

**Funciones para buscar:**

- [`AuthProvider` · línea 27](../frontend/src/context/AuthContext.jsx#L27)

### [frontend/src/context/ThemeContext.jsx](../frontend/src/context/ThemeContext.jsx)

Parte del sistema visual: comparte colores, tamaños o preferencia de tema según su implementación. La preferencia de apariencia es independiente de la autenticación y de los datos de las tareas.

**Funciones para buscar:**

- [`getInitialTheme` · línea 12](../frontend/src/context/ThemeContext.jsx#L12)
- [`ThemeProvider` · línea 22](../frontend/src/context/ThemeContext.jsx#L22)

### [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js)

Hook reutilizable que agrupa estado o comportamiento de React. El nombre use permite reconocer que se consume desde componentes u otros hooks, no como un endpoint del servidor.

**Se conecta con:** [frontend/src/context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx).

**Funciones para buscar:**

- [`useAuth` · línea 11](../frontend/src/hooks/useAuth.js#L11)

### [frontend/src/hooks/useCooldown.js](../frontend/src/hooks/useCooldown.js)

Hook reutilizable que agrupa estado o comportamiento de React. El nombre use permite reconocer que se consume desde componentes u otros hooks, no como un endpoint del servidor.

**Funciones para buscar:**

- [`useCooldown` · línea 10](../frontend/src/hooks/useCooldown.js#L10)

### [frontend/src/hooks/useForm.js](../frontend/src/hooks/useForm.js)

Agrupa valores, validación, estado pendiente y errores por campo. Recibir una respuesta correcta del servidor es lo que permite mostrar éxito, no simplemente pulsar Enviar.

**Se conecta con:** [frontend/src/utils/validators.js](../frontend/src/utils/validators.js).

**Funciones para buscar:**

- [`useForm` · línea 11](../frontend/src/hooks/useForm.js#L11)
- [`field` · línea 19](../frontend/src/hooks/useForm.js#L19)
- [`run` · línea 30](../frontend/src/hooks/useForm.js#L30)
- [`submit` · línea 49](../frontend/src/hooks/useForm.js#L49)
- [`reset` · línea 58](../frontend/src/hooks/useForm.js#L58)

### [frontend/src/hooks/useTheme.js](../frontend/src/hooks/useTheme.js)

Parte del sistema visual: comparte colores, tamaños o preferencia de tema según su implementación. La preferencia de apariencia es independiente de la autenticación y de los datos de las tareas.

**Se conecta con:** [frontend/src/context/ThemeContext.jsx](../frontend/src/context/ThemeContext.jsx).

**Funciones para buscar:**

- [`useTheme` · línea 11](../frontend/src/hooks/useTheme.js#L11)

### [frontend/src/main.jsx](../frontend/src/main.jsx)

Punto de entrada del navegador: monta React sobre el elemento raíz del HTML e instala los proveedores/navegación declarados. No es un servidor Node.js ni una conexión a la base.

**Se conecta con:** [frontend/src/App.jsx](../frontend/src/App.jsx), [frontend/src/context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx), [frontend/src/context/ThemeContext.jsx](../frontend/src/context/ThemeContext.jsx), [frontend/src/styles/global.css](../frontend/src/styles/global.css).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [frontend/src/pages/AdminPage.jsx](../frontend/src/pages/AdminPage.jsx)

Pantalla AdminPage. Coordina presentación y eventos; seguir los servicios, hooks o contexto importados para encontrar dónde se comprueban y guardan los datos.

**Se conecta con:** [frontend/src/components/admin/UserManagement.jsx](../frontend/src/components/admin/UserManagement.jsx), [frontend/src/components/admin/AuditActivity.jsx](../frontend/src/components/admin/AuditActivity.jsx).

**Funciones para buscar:**

- [`AdminPage` · línea 13](../frontend/src/pages/AdminPage.jsx#L13)

### [frontend/src/pages/CodePage.jsx](../frontend/src/pages/CodePage.jsx)

Pantalla compartida de códigos. El propósito distingue verificar, desbloquear o restablecer; un mismo número no autoriza operaciones distintas sin el desafío correspondiente.

**Se conecta con:** [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx), [frontend/src/components/AuthLayout.jsx](../frontend/src/components/AuthLayout.jsx), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx), [frontend/src/components/FormStatus.jsx](../frontend/src/components/FormStatus.jsx), [frontend/src/components/PasswordStrength.jsx](../frontend/src/components/PasswordStrength.jsx), [frontend/src/components/TextField.jsx](../frontend/src/components/TextField.jsx), [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js), [frontend/src/hooks/useCooldown.js](../frontend/src/hooks/useCooldown.js), [frontend/src/hooks/useForm.js](../frontend/src/hooks/useForm.js), [frontend/src/services/codeService.js](../frontend/src/services/codeService.js), [frontend/src/utils/validators.js](../frontend/src/utils/validators.js).

**Funciones para buscar:**

- [`CodePage` · línea 36](../frontend/src/pages/CodePage.jsx#L36)
- [`sendCode` · línea 94](../frontend/src/pages/CodePage.jsx#L94)

### [frontend/src/pages/HomePage.jsx](../frontend/src/pages/HomePage.jsx)

Pantalla HomePage. Coordina presentación y eventos; seguir los servicios, hooks o contexto importados para encontrar dónde se comprueban y guardan los datos.

**Se conecta con:** [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js).

**Funciones para buscar:**

- [`HomePage` · línea 11](../frontend/src/pages/HomePage.jsx#L11)

### [frontend/src/pages/LoginPage.jsx](../frontend/src/pages/LoginPage.jsx)

Pantalla LoginPage. Coordina presentación y eventos; seguir los servicios, hooks o contexto importados para encontrar dónde se comprueban y guardan los datos.

**Se conecta con:** [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx), [frontend/src/components/AuthLayout.jsx](../frontend/src/components/AuthLayout.jsx), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx), [frontend/src/components/TextField.jsx](../frontend/src/components/TextField.jsx), [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js), [frontend/src/components/SocialLoginButtons.jsx](../frontend/src/components/SocialLoginButtons.jsx).

**Funciones para buscar:**

- [`LoginPage` · línea 46](../frontend/src/pages/LoginPage.jsx#L46)
- [`updateValue` · línea 61](../frontend/src/pages/LoginPage.jsx#L61)
- [`validate` · línea 66](../frontend/src/pages/LoginPage.jsx#L66)
- [`submit` · línea 77](../frontend/src/pages/LoginPage.jsx#L77)

### [frontend/src/pages/ProfilePage.jsx](../frontend/src/pages/ProfilePage.jsx)

Pantalla ProfilePage. Coordina presentación y eventos; seguir los servicios, hooks o contexto importados para encontrar dónde se comprueban y guardan los datos.

**Se conecta con:** [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx), [frontend/src/components/profile/EmailChangeForm.jsx](../frontend/src/components/profile/EmailChangeForm.jsx), [frontend/src/components/profile/PasswordChangeForm.jsx](../frontend/src/components/profile/PasswordChangeForm.jsx), [frontend/src/components/profile/ProfileDetailsForm.jsx](../frontend/src/components/profile/ProfileDetailsForm.jsx), [frontend/src/services/userService.js](../frontend/src/services/userService.js).

**Funciones para buscar:**

- [`ProfilePage` · línea 17](../frontend/src/pages/ProfilePage.jsx#L17)

### [frontend/src/pages/RegisterPage.jsx](../frontend/src/pages/RegisterPage.jsx)

Pantalla RegisterPage. Coordina presentación y eventos; seguir los servicios, hooks o contexto importados para encontrar dónde se comprueban y guardan los datos.

**Se conecta con:** [frontend/src/components/Alert.jsx](../frontend/src/components/Alert.jsx), [frontend/src/components/AuthLayout.jsx](../frontend/src/components/AuthLayout.jsx), [frontend/src/components/Button.jsx](../frontend/src/components/Button.jsx), [frontend/src/components/PasswordStrength.jsx](../frontend/src/components/PasswordStrength.jsx), [frontend/src/components/TextField.jsx](../frontend/src/components/TextField.jsx), [frontend/src/components/SocialLoginButtons.jsx](../frontend/src/components/SocialLoginButtons.jsx), [frontend/src/hooks/useAuth.js](../frontend/src/hooks/useAuth.js), [frontend/src/services/authService.js](../frontend/src/services/authService.js), [frontend/src/utils/validators.js](../frontend/src/utils/validators.js).

**Funciones para buscar:**

- [`RegisterPage` · línea 37](../frontend/src/pages/RegisterPage.jsx#L37)
- [`updateValue` · línea 153](../frontend/src/pages/RegisterPage.jsx#L153)
- [`markTouched` · línea 160](../frontend/src/pages/RegisterPage.jsx#L160)
- [`submit` · línea 164](../frontend/src/pages/RegisterPage.jsx#L164)

### [frontend/src/services/adminService.js](../frontend/src/services/adminService.js)

Servicio reutilizable de la aplicación. Separa operaciones de datos o comunicación de la presentación; sus funciones importadas indican si la operación es local, HTTP o de servidor.

**Se conecta con:** [frontend/src/services/apiClient.js](../frontend/src/services/apiClient.js).

**Funciones para buscar:**

- [`fetchUsers` · línea 10](../frontend/src/services/adminService.js#L10)
- [`fetchAuditEvents` · línea 14](../frontend/src/services/adminService.js#L14)
- [`updateUserAdmin` · línea 19](../frontend/src/services/adminService.js#L19)

### [frontend/src/services/apiClient.js](../frontend/src/services/apiClient.js)

Puente HTTP común: envía cookies, agrega CSRF y transforma respuestas en errores legibles. Si vence el acceso intenta una renovación compartida y reintenta una sola vez.

**Funciones para buscar:**

- [`setCsrfToken` · línea 27](../frontend/src/services/apiClient.js#L27)
- [`clearCsrfToken` · línea 32](../frontend/src/services/apiClient.js#L32)
- [`isUnsafeMethod` · línea 36](../frontend/src/services/apiClient.js#L36)
- [`parseResponse` · línea 40](../frontend/src/services/apiClient.js#L40)
- [`refreshSession` · línea 60](../frontend/src/services/apiClient.js#L60): Comparte una promesa de renovación entre solicitudes concurrentes. Actualiza CSRF con la respuesta y libera la promesa al terminar, también si falla.
- [`apiRequest` · línea 94](../frontend/src/services/apiClient.js#L94): Serializa el cuerpo, envía cookies y CSRF y convierte errores HTTP en ApiError. Ante 401 puede renovar y reintentar una vez; no confundir una respuesta fallida con éxito visual.

### [frontend/src/services/authService.js](../frontend/src/services/authService.js)

Funciones pequeñas para registro, acceso, sesión y proveedores. Mantienen las direcciones HTTP fuera de los formularios y delegan el transporte a apiClient.

**Se conecta con:** [frontend/src/services/apiClient.js](../frontend/src/services/apiClient.js).

**Funciones para buscar:**

- [`registerUser` · línea 16](../frontend/src/services/authService.js#L16)
- [`loginUser` · línea 26](../frontend/src/services/authService.js#L26)
- [`getCurrentUser` · línea 36](../frontend/src/services/authService.js#L36)
- [`logoutUser` · línea 45](../frontend/src/services/authService.js#L45)
- [`checkAvailability` · línea 56](../frontend/src/services/authService.js#L56)
- [`getOAuthProviders` · línea 68](../frontend/src/services/authService.js#L68)
- [`getOAuthStartUrl` · línea 74](../frontend/src/services/authService.js#L74)

### [frontend/src/services/codeService.js](../frontend/src/services/codeService.js)

Servicio reutilizable de la aplicación. Separa operaciones de datos o comunicación de la presentación; sus funciones importadas indican si la operación es local, HTTP o de servidor.

**Se conecta con:** [frontend/src/services/apiClient.js](../frontend/src/services/apiClient.js).

**Funciones para buscar:**

- [`post` · línea 10](../frontend/src/services/codeService.js#L10)
- [`requestCode` · línea 13](../frontend/src/services/codeService.js#L13)
- [`confirmCode` · línea 14](../frontend/src/services/codeService.js#L14)
- [`resetPassword` · línea 15](../frontend/src/services/codeService.js#L15)
- [`requestEmailChange` · línea 16](../frontend/src/services/codeService.js#L16)
- [`confirmEmailChange` · línea 18](../frontend/src/services/codeService.js#L18)

### [frontend/src/services/userService.js](../frontend/src/services/userService.js)

Servicio reutilizable de la aplicación. Separa operaciones de datos o comunicación de la presentación; sus funciones importadas indican si la operación es local, HTTP o de servidor.

**Se conecta con:** [frontend/src/services/apiClient.js](../frontend/src/services/apiClient.js).

**Funciones para buscar:**

- [`updateProfile` · línea 10](../frontend/src/services/userService.js#L10)
- [`changePassword` · línea 16](../frontend/src/services/userService.js#L16)
- [`getOAuthAccounts` · línea 22](../frontend/src/services/userService.js#L22)

### [frontend/src/utils/socialLogin.js](../frontend/src/utils/socialLogin.js)

Ayudas compartidas para transformar o validar datos. Usarlas desde varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito en la interfaz.

**Funciones para buscar:**

- [`isSocialProviderReady` · línea 11](../frontend/src/utils/socialLogin.js#L11)

### [frontend/src/utils/validators.js](../frontend/src/utils/validators.js)

Ayudas compartidas para transformar o validar datos. Usarlas desde varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito en la interfaz.

**Funciones para buscar:**

- [`evaluatePassword` · línea 29](../frontend/src/utils/validators.js#L29)
- [`validateEmail` · línea 43](../frontend/src/utils/validators.js#L43)
- [`validateUsername` · línea 54](../frontend/src/utils/validators.js#L54)
- [`validateDisplayName` · línea 65](../frontend/src/utils/validators.js#L65)
- [`validatePassword` · línea 75](../frontend/src/utils/validators.js#L75)
- [`validateConfirmPassword` · línea 83](../frontend/src/utils/validators.js#L83)
- [`fieldErrorsToObject` · línea 89](../frontend/src/utils/validators.js#L89)

### [frontend/tests/socialLogin.test.js](../frontend/tests/socialLogin.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [frontend/src/utils/socialLogin.js](../frontend/src/utils/socialLogin.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.

### [frontend/tests/validators.test.js](../frontend/tests/validators.test.js)

Pruebas automatizadas y sus ayudas locales. Leer las aserciones para conocer qué comportamiento se comprueba; no equivalen por sí solas a una prueba real de correo, hosting o teléfono.

**Se conecta con:** [frontend/src/utils/validators.js](../frontend/src/utils/validators.js).

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.


### [frontend/vite.config.js](../frontend/vite.config.js)

Configuración de Vite para desarrollo/compilación del frontend. Revisar aquí plugins, servidor y proxy cuando estén definidos; no es el backend de cuentas.

Este archivo define composición, datos, configuración, tipos o reexportaciones. Seguir sus importaciones o buscar dónde se utiliza para ver el efecto en la aplicación.
