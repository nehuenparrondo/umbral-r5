# R5 · Guía completa de Umbral

Revisión del código del 16 de noviembre de 2026.

R5 es una web de cuentas con React y Vite en frontend y Node.js/Express con MySQL
en backend. Permite acceso tradicional, códigos de correo y Google, GitHub o Discord.
La versión pública funciona en https://umbral-r5.onrender.com con MySQL en Aiven.

## 1. Las dos partes del proyecto

| Ubicación | Trabajo que realiza |
| --- | --- |
| frontend/src/main.jsx | Monta React, BrowserRouter y los proveedores globales. |
| frontend/src/App.jsx | Define las rutas de la web. |
| frontend/src/pages | Formularios y páginas completas. |
| frontend/src/components | Controles, tarjeta de perfil, navegación y panel admin. |
| frontend/src/context | Perfil de sesión y tema. |
| frontend/src/hooks | Acceso a contextos y estado reutilizable de formularios. |
| frontend/src/services | Peticiones a la API mediante apiClient. |
| backend/server.js | Comprueba las tablas SQL y abre el puerto HTTP. |
| backend/app.js | Compone Express, seguridad HTTP, rutas y entrega web en producción. |
| backend/routes | Conecta método/ruta con validaciones y controladores. |
| backend/controllers | Coordina las operaciones solicitadas. |
| backend/models | Ejecuta consultas MySQL parametrizadas. |
| backend/services | Sesiones, tokens, códigos, correo y protocolo OAuth. |
| backend/middlewares | Autenticación, rol, CSRF, límites y tratamiento de errores. |
| backend/validations | Reglas de entrada del servidor. |
| backend/db | Esquema de tablas y permisos SQL. |
| backend/scripts y tests | Preparación, diagnóstico y comprobaciones aisladas. |

El package.json raíz coordina los paquetes frontend y backend mediante workspaces.
El navegador consume HTTP y recibe JSON. El servidor conserva la conexión SQL y
las credenciales privadas.

## 2. Páginas y recorrido de ingreso

| Ruta | Contenido | Acceso |
| --- | --- | --- |
| / | Redirige a ingreso o bienvenida según sesión. | General. |
| /login | Email/usuario y contraseña, más acceso social. | Visitante. |
| /registro | Alta y comprobación de disponibilidad. | Visitante. |
| /verificar-email | Confirmación del alta con código. | Código de propósito verify_email. |
| /codigo-acceso | Desbloqueo de acceso. | Código de propósito unlock. |
| /recuperar | Elegir una contraseña nueva mediante código. | Código de propósito reset_password. |
| /bienvenida | Saludo y Configurar mi perfil. | Sesión válida. |
| /perfil | Tarjeta editable y opciones agrupadas. | Sesión válida. |
| /admin | Usuarios y actividad auditada. | Rol admin. |

El recorrido normal es ingreso → bienvenida → configuración del perfil.
También los administradores llegan primero a la bienvenida y disponen del enlace
Administración. ProtectedRoute espera la restauración de sesión y controla la
navegación visual. El backend vuelve a exigir los permisos en cada petición.

## 3. Ingresar con usuario y contraseña

[LoginPage](../frontend/src/pages/LoginPage.jsx#L52) mantiene identifier y password
en estado local. submit evita la recarga del formulario, valida campos y llama a
login del contexto.

1. AuthContext.login utiliza loginUser de authService.
2. apiClient envía POST /api/auth/login y transporta cookies.
3. authRoutes ejecuta límites, validaciones y el controlador.
4. [login del backend](../backend/controllers/authController.js#L179) busca la cuenta y
   compara bcrypt dentro de una transacción con bloqueo de la fila.
5. Exige usuario activo, sin bloqueo y con email verificado.
6. issueNewSession crea una sesión SQL, JWT de acceso, refresh aleatorio y CSRF.
7. La respuesta instala cookies HttpOnly y devuelve user más csrfToken.
8. applySession actualiza el perfil del contexto y el CSRF en memoria.
9. La navegación abre /bienvenida.

Si el email está pendiente, la API devuelve EMAIL_VERIFICATION_REQUIRED y el
formulario abre la verificación. Los errores de credenciales son genéricos.
Al tercer intento incorrecto de una cuenta activa se marca login_locked_at, se
revocan sesiones y se intenta enviar un código. El desbloqueo se realiza mediante
el recorrido de código de acceso.

## 4. Registro y verificación

RegisterPage separa valores, campos tocados y errores. Consulta disponibilidad
mediante /api/auth/check-availability. La respuesta ayuda a completar el formulario,
y los índices únicos de MySQL resuelven posibles altas simultáneas.

| Campo | Regla del servidor |
| --- | --- |
| email | Formato válido y hasta 254 caracteres. |
| username | De 3 a 30 caracteres, letras ASCII, números, guion bajo o punto. |
| displayName | Opcional, hasta 80 caracteres y sin signos de etiquetas HTML. |
| password | Al menos 10 caracteres con mayúscula, minúscula, número y símbolo, hasta 72 bytes UTF-8. |
| confirmPassword | Debe coincidir con password. |

[register](../backend/controllers/authController.js#L106) normaliza email y usuario,
comprueba duplicados y calcula bcrypt. La transacción crea users y su auditoría.
Después issueChallenge solicita el código verify_email.

El alta responde HTTP 201 y verificationRequired. Si el correo falla después de
crear la cuenta, responde igualmente 201 con un mensaje para solicitar otro código.
La sesión tradicional se crea al confirmar el email.

CodePage recoge challengeId, purpose y code. confirmCode valida el propósito y el
desafío, actualiza email_verified_at y aplica la sesión devuelta antes de abrir
la bienvenida.

## 5. Sesiones, cookies y renovación

| Elemento | Función | Ubicación |
| --- | --- | --- |
| user | Perfil público usado en la interfaz. | AuthContext, en memoria. |
| Access token | JWT firmado para acceso de corta duración. | Cookie proyectouno_access HttpOnly. |
| Refresh token | Credencial aleatoria para renovar el acceso. | Cookie proyectouno_refresh HttpOnly. |
| Hash del refresh | Permite consultar y revocar la sesión. | user_sessions.refresh_token_hash. |
| CSRF | Verifica peticiones que modifican datos. | Memoria del frontend y cabecera x-csrf-token. |
| Preferencia de tema | Apariencia clara u oscura. | localStorage del contexto visual. |

Los valores por defecto son 15 minutos de acceso y 7 días de sesión de renovación.
env.js permite configurarlos. El JWT contiene sub, role, sessionId y csrfToken,
con vencimiento, emisor y audiencia. La firma permite detectar alteraciones.

[requireAuth](../backend/middlewares/authMiddleware.js#L21) verifica el JWT y
consulta tanto la sesión activa como el usuario en SQL. El rol vigente sale de la
cuenta del servidor. requireCsrfToken protege las rutas mutables y requireRole
reserva administración para admin.

apiClient consulta /api/auth/session al restaurar. Un visitante recibe user null
sin un error de acceso a una ruta privada. Si existe refresh, el cliente intenta
renovar. refreshSession comparte una promesa entre solicitudes concurrentes.
apiRequest reintenta una sola vez después de renovar.

El backend rota el refresh comparando su hash anterior. Dos solicitudes simultáneas
no pueden confirmar la misma rotación. Logout revoca la sesión y elimina cookies.

## 6. Códigos, recuperación y cambio de email

[issueChallenge](../backend/services/challengeService.js#L36) crea un UUID y
seis dígitos aleatorios. Guarda un HMAC SHA-256 calculado con un secreto del servidor
y el ID, propósito y código. El texto del código se utiliza para el envío.

| Regla | Comportamiento |
| --- | --- |
| Vencimiento | Diez minutos. |
| Reenvío reciente | Puede reutilizar el desafío vigente creado en los últimos 60 segundos. |
| Solicitudes | Máximo cinco desafíos por usuario y propósito en quince minutos. |
| Intentos incorrectos | El quinto consume e invalida el desafío. |
| Entrega | El desafío solo sirve con delivery_status sent. |
| Un solo uso | consumed_at impide aceptar nuevamente el mismo desafío. |

consumeChallenge bloquea cuenta y desafío, valida vencimiento, propósito,
destinatario e intentos, ejecuta la operación y consume el desafío en la misma
transacción. Si falla la operación autorizada, sus escrituras se revierten.

### Recuperar contraseña

CodePage con purpose reset_password solicita el código y después envía challengeId,
code, newPassword y confirmPassword. [resetPassword](../backend/controllers/codeController.js#L123)
calcula bcrypt, actualiza users.password_hash, revoca todas las sesiones e invalida
desafíos anteriores. Se vuelve al login para utilizar la contraseña nueva.

### Cambiar contraseña desde el perfil

PasswordChangeForm usa PATCH /api/users/me/password. Para una cuenta que ya tiene
contraseña exige la actual y la compara mediante bcrypt.compare.
[changePassword](../backend/controllers/userController.js#L102) calcula el
hash nuevo, conserva la sesión actual y revoca las demás dentro de una transacción
que también registra auditoría.

Una cuenta creada mediante OAuth puede tener password_hash vacío. En ese caso
el formulario permite crear una contraseña local. Las credenciales de la red
social permanecen en el proveedor.

### Cambiar email

EmailChangeForm solicita un desafío para el nuevo destinatario. El backend exige
una contraseña local válida. Si la cuenta nació por OAuth y todavía no tiene una,
primero debe crearla desde el perfil. Después se confirma el código enviado al email
nuevo. requestEmailChange comprueba disponibilidad y confirmEmailChange actualiza y
verifica el email, revoca las otras sesiones y registra la operación.

## 7. Google, GitHub y Discord

SocialLoginButtons consulta la disponibilidad real en /api/auth/oauth/providers.
Mientras carga, falla o el proveedor está desactivado, su botón no inicia el acceso.

| Proveedor de la interfaz | Integración configurada |
| --- | --- |
| Google | Auth0, conexión específica de Google. |
| GitHub | Auth0, conexión específica de GitHub. |
| Discord | OAuth directo con la aplicación Umbral R5. |

oauthProviders.js también contiene soporte configurable para otros proveedores.
Eso no equivale a tenerlos habilitados en la interfaz actual.

1. El botón navega a /api/auth/oauth/:provider.
2. startOAuth genera state y, cuando corresponde, nonce y PKCE.
3. SQL conserva el hash de state y los datos temporales con vencimiento.
4. El navegador visita al proveedor para elegir o confirmar la cuenta.
5. El callback compara cookie y state, y consume la transacción una sola vez.
6. El backend intercambia el código usando sus credenciales privadas.
7. oauthService valida y normaliza el perfil, incluyendo OIDC cuando corresponde.
8. oauthCallback busca un vínculo por proveedor e identificador externo.
9. Si debe vincular por email, exige que el proveedor lo haya verificado.
10. La transacción crea o vincula la cuenta y emite la sesión local de R5.
11. El navegador vuelve a /bienvenida?oauth=proveedor.

Los bloqueos por identidad y email evitan altas duplicadas en callbacks concurrentes.
Google y GitHub solicitan interacción con la cuenta mediante la configuración de
Auth0. Discord presenta la autorización y permite cambiar de cuenta.
El cambio temporal de dominio forma parte de este recorrido.

## 8. Bienvenida y tarjeta de perfil

WelcomePage presenta el nombre visible, el email y Configurar mi perfil.
ProfilePage organiza la tarjeta y los paneles desplegables de email, contraseña
y cuentas vinculadas.

[ProfileDetailsForm](../frontend/src/components/profile/ProfileDetailsForm.jsx#L25)
comienza mostrando la tarjeta. Editar perfil abre un borrador con username y
displayName. Cancelar descarta lo escrito. Guardar valida y envía PUT /api/users/me.

Solo cuando la API confirma la escritura se actualiza AuthContext y vuelve a
mostrarse la tarjeta con Datos guardados. Si falla, conserva el formulario y los
datos confirmados. Los campos de email y contraseña tienen sus propios recorridos.
La tarjeta de R5 presenta un icono de perfil. La carga de fotos del trabajo RN1
pertenece a esa otra aplicación.

## 9. Administración y auditoría

AdminPage alterna usuarios y actividad. UserManagement lista por páginas y mantiene
un borrador por fila. El administrador puede cambiar rol y estado activo.
La baja que implementa este panel consiste en desactivar la cuenta y revocar sus
sesiones. Se impide que el administrador se bloquee a sí mismo.

AuditActivity consulta acciones, actores y fechas desde audit_logs, con paginación
y filtro por acción. La aplicación registra accesos, cambios sensibles y operaciones
administrativas. La cuenta SQL de la web tiene permisos limitados para preservar
la auditoría.

El perfil propio actual ofrece edición, email y contraseña. La API de R5 no incluye
un endpoint de autoeliminación física de cuenta. Esa funcionalidad sí está presente
en RN1 y debe distinguirse al explicar los dos proyectos.

## 10. API y permisos

| Método y ruta | Función / entrada principal |
| --- | --- |
| GET /api/health | Comprueba conexión, tablas y permisos SQL. |
| GET /api/auth/check-availability | Consulta email o username disponibles. |
| POST /api/auth/register | Alta con email, username, displayName y contraseñas. |
| POST /api/auth/login | identifier y password. |
| GET /api/auth/session | Consulta inicial, admite visitante. |
| GET /api/auth/me | Perfil de una sesión válida. |
| POST /api/auth/refresh | Renueva y rota la sesión. |
| POST /api/auth/logout | Revoca sesión, exige CSRF. |
| POST /api/auth/codes/request | Solicita código por identifier y purpose. |
| POST /api/auth/codes/confirm | Confirma challengeId, code y purpose. |
| POST /api/auth/password/reset | Código y contraseña nueva. |
| GET /api/auth/oauth/providers | Disponibilidad pública de proveedores. |
| GET /api/auth/oauth/:provider | Inicia OAuth. |
| GET /api/auth/oauth/:provider/callback | Retorno validado del proveedor. |
| GET /api/users/me | Consulta del perfil autenticado. |
| PUT /api/users/me | username y displayName, exige sesión y CSRF. |
| PATCH /api/users/me/password | Contraseña actual cuando exista, nueva y confirmación. |
| POST /api/users/me/email/request | Nuevo email y contraseña local obligatoria. |
| POST /api/users/me/email/confirm | Código del desafío de cambio. |
| GET /api/users/me/oauth-accounts | Identidades vinculadas a la cuenta actual. |
| GET /api/admin/users | Lista paginada, exige admin. |
| PATCH /api/admin/users/:id | Cambia rol/estado, exige admin y CSRF. |
| GET /api/admin/audit | Actividad paginada, exige admin. |

Las rutas enlazan validaciones de express-validator, límites de solicitudes y
controladores. validateRequest devuelve errores de campo. errorHandler traduce
errores operativos y de SQL a mensajes públicos, incluido HTTP 503 si la base
no está disponible.

## 11. Las ocho tablas y sus relaciones

El esquema está en [schema.sql](../backend/db/schema.sql).

| Tabla | Contenido y relación |
| --- | --- |
| roles | user y admin. users referencia role_id. |
| users | UUID, email, username, display_name, password_hash, rol, estado, verificación, bloqueo y fechas. |
| user_sessions | Usuario, hash de refresh, vencimiento y revocación. |
| oauth_accounts | Usuario, proveedor e identificador externo únicos. |
| oauth_identity_locks | Claves para serializar altas y vinculaciones sociales. |
| oauth_login_states | Hash de state, proveedor, PKCE, nonce, vencimiento y consumo. |
| auth_challenges | Propósito, destinatario, HMAC, intentos, entrega, vencimiento y consumo. |
| audit_logs | Actor, acción, destinatario, IP, agente, metadatos y fecha. |

users mantiene columnas normalizadas e índices únicos para email y username.
password_hash admite null para cuentas sociales sin contraseña local.
Las claves foráneas conservan las relaciones. Una eliminación física SQL de
users haría cascada sobre sesiones, conexiones y desafíos; la auditoría conserva
el evento con las referencias afectadas a null.

## 12. Configuración y despliegue

[mysqlConnectionOptions](../backend/config/db.js#L17) interpreta
DATABASE_URL y configura el pool. En Aiven se utiliza TLS con certificado CA e
identidad del servidor verificados. withTransaction reserva una conexión, confirma
con commit o revierte con rollback y la libera.

| Configuración | Lugar y finalidad |
| --- | --- |
| DATABASE_URL | Backend privado. Usuario, clave, host, puerto y base MySQL. |
| DATABASE_SSL y DATABASE_SSL_CA | TLS y certificado de la base alojada. |
| JWT_SECRET y opciones JWT | Firma y duración de credenciales. |
| CLIENT_ORIGIN y SERVER_ORIGIN | Orígenes de interfaz, API y retornos. |
| AUTH0_* | Integración de Google/GitHub mediante Auth0. |
| DISCORD_* | Aplicación y callback de Discord. |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM | Envío de códigos a Mailtrap. |
| backend/.env | Configuración privada local. |
| backend/.env.hosting | Copia privada de preparación del alojamiento. |
| Variables privadas de Render | Configuración efectiva de la web pública. |
| frontend/.env.example | Solo configuración pública del cliente. |

env.js carga backend/.env y respeta las variables del proceso del alojamiento.
Modificar .env en la PC no modifica las variables de Render.

En desarrollo, Vite usa localhost:5173 y redirige /api a Express en 4000.
npm run dev desde la raíz prepara MySQL local y arranca ambos paquetes.
En producción, Express sirve frontend/dist y la API bajo el mismo dominio HTTPS.
El fallback entrega index.html para rutas de React como /bienvenida. Las rutas
API desconocidas siguen devolviendo JSON 404.

Render compila con npm ci --include=dev y npm run build, e inicia con npm start.
render.yaml documenta la configuración. server.js comprueba las tablas antes de
escuchar. /api/health devuelve database connected o HTTP 503 con disconnected.

Si Render se queda en la pantalla de arranque, revisar primero sus logs. En esta
revisión la causa fue MySQL apagado en Aiven. Para recuperarlo se abrió umbral-r5,
Service actions → Power on service, se esperó Running y se repitió el despliegue.
En Workbench se consultan las tablas de defaultdb usando TLS y la cuenta configurada.

## 13. Correo y comprobaciones

mailService utiliza Nodemailer y SMTP con TLS obligatorio. En esta instalación
Mailtrap Sandbox captura los mensajes de prueba. La dirección escrita por el usuario
aparece como destinatario, y el mensaje se consulta en el buzón de Mailtrap.
La bandeja testOutbox solo existe en pruebas con NODE_ENV test y transporte test.

Comandos disponibles desde la raíz.

    npm run lint
    npm run build
    npm test
    npm run doctor

doctor comprueba configuración y dependencias de la ejecución. mail:check verifica
la conexión SMTP. Las pruebas automatizadas preparan bases temporales y servicios
aislados. El acceso social real y la recepción del correo se verifican por separado.

Recorrido de demostración recomendado.

1. Ingresar y mostrar /bienvenida.
2. Abrir el perfil, editar un borrador y cancelarlo.
3. Guardar una edición propia y comprobar la respuesta.
4. Mostrar dónde están email, contraseña y cuentas vinculadas.
5. Explicar la sesión y el hash en SQL sin publicar sus valores.
6. Mostrar el panel admin únicamente con una cuenta autorizada.

## 14. Preguntas para la defensa

| Pregunta | Respuesta y código para mostrar |
| --- | --- |
| ¿Dónde recibe el formulario el ingreso? | LoginPage.submit y AuthContext.login. |
| ¿Dónde se compara la contraseña? | authController.login con bcrypt.compare. |
| ¿Dónde se guarda la nueva? | userController.changePassword o codeController.resetPassword calculan bcrypt; userModel.updatePasswordHash escribe SQL. |
| ¿Qué guarda el navegador? | Cookies HttpOnly de acceso/refresh y preferencia de tema. El perfil del contexto está en memoria. |
| ¿Para qué sirve CSRF? | requireCsrfToken exige una prueba asociada a la sesión en peticiones mutables. |
| ¿Cómo se bloquea el acceso repetido? | login incrementa intentos bajo bloqueo SQL y marca la cuenta al tercero. |
| ¿Cómo funciona olvidar contraseña? | Código con propósito reset_password, bcrypt nuevo y revocación de sesiones. |
| ¿La contraseña de Google se guarda aquí? | Se guarda la identidad social vinculada. El proveedor gestiona su credencial. |
| ¿Por qué se cambia el dominio al ingresar con una red? | El navegador solicita autorización al proveedor y vuelve al callback del backend. |
| ¿Dónde está la base pública? | MySQL de Aiven, base defaultdb, configurada mediante variables privadas de Render. |
| ¿GitHub aloja la aplicación funcionando? | Conserva el código. Render ejecuta Express y sirve la web compilada. |
| ¿Cómo se hace una baja? | El administrador desactiva la cuenta y el backend revoca sus sesiones. |

El [mapa navegable de archivos y funciones](MAPA-ARCHIVOS-Y-FUNCIONES.md) permite
localizar cada implementación con sus líneas actuales.

## 15. Verificación de esta revisión

| Comprobación desde la raíz | Resultado |
| --- | --- |
| npm run lint | Frontend y backend correctos. |
| npm run build | Web de producción compilada correctamente. |
| npm test | 16 pruebas del frontend y 61 del backend aprobadas. |

Las 77 pruebas terminaron sin fallos ni omisiones. Incluyen validaciones,
bienvenida, separación de paquetes, sesiones y concurrencia en MySQL.
El alcance de esta ejecución es local y automatizado. El consentimiento de cada
proveedor y la recepción real en Mailtrap requieren su recorrido manual.

El mapa reúne 118 archivos y enlaza 225 funciones o componentes declarados.
Se actualizaron README.md, esta guía, MAPA-ARCHIVOS-Y-FUNCIONES.md e
INICIO_Y_DEFENSA.md. Los comentarios de módulos y operaciones importantes
explican entradas, permisos, escrituras y respuestas; se quitaron listas de pie
repetidas que duplicaban imports/exports y mezclaban idiomas.

La comparación del código ejecutable antes y después confirma que esta revisión
de documentación mantiene las mismas reglas y consultas de la aplicación.

## Comentarios dentro del código (17 de noviembre de 2026)

Las funciones del frontend y del backend tienen comentarios propios sobre sus entradas, resultados y efectos. En los formularios se distingue borrador de dato confirmado; en la API se explica validación, permisos, transacciones y respuestas. En los modelos, `client` permite participar en la misma transacción: omitirlo usa el pool y no une automáticamente varias escrituras.

Para seguir un caso, empezar por el evento del formulario, abrir su servicio HTTP, localizar la ruta en el backend y continuar al controlador, servicio y modelo. Los comentarios de sesiones y desafíos aclaran qué llega al navegador, qué se guarda en SQL y qué se invalida después de cada operación.
