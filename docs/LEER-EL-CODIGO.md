# Consigna 4 · Umbral, login tradicional y social

## El mapa para no perderse

frontend contiene React/Vite; backend contiene Node/Express/MySQL. El navegador no conoce SQL ni secretos OAuth. La web pública se sirve desde Render y la base está en Aiven; el entorno local usa su propia configuración. GitHub guarda código, no enciende esos servicios ni contiene sus claves.

Para seguir una acción: pantalla → servicio HTTP → ruta → validación/middleware → controlador → servicio/modelo → respuesta → contexto/pantalla.

## Login: dónde se guarda cada dato

AuthContext conserva el perfil público en memoria de React. El cliente apiClient manda cookies con fetch y conserva CSRF solo en memoria. backend/controllers/authController.login comprueba bcrypt, cuenta activa, verificación y bloqueo. Tres fallos pueden bloquear la cuenta; no es un simple contador del formulario.

issueNewSession crea una sesión SQL y dos credenciales diferentes: JWT de acceso corto y refresh aleatorio. Las cookies HttpOnly transportan las credenciales; user_sessions conserva el hash del refresh. requireAuth verifica JWT y sesión activa; requireCsrfToken protege las operaciones que cambian datos. Si vence el acceso, apiClient comparte una renovación entre solicitudes y reintenta una sola vez.

La cookie no guarda la contraseña del usuario. JWT está firmado, no cifrado. Cambiar el rol visible en React no convierte la cuenta en administradora porque el servidor aplica permisos.

## Registro y códigos: no funcionan igual que Vértice

RegisterPage → registerUser → /api/auth/register → authController.register. Se crea el registro users con hash bcrypt y se solicita verificación por correo. **No se abre sesión tradicional hasta verificar el email.** Una cuenta puede quedar creada aunque falle el envío; la interfaz permite solicitar otro código.

challengeService genera seis dígitos, pero SQL guarda un HMAC ligado al ID y propósito del desafío. Exige vigencia, intentos y entrega confirmada; el código vale 10 minutos, no los 15 minutos del enlace de Vértice. Hay límites de solicitud e intentos. Los propósitos verify_email, unlock, reset_password y change_email no son intercambiables.

codeController verifica o desbloquea según propósito. Para recuperar contraseña consume un desafío reset_password, guarda el nuevo hash e invalida sesiones anteriores dentro de la operación transaccional. Verificar email vuelve al login; desbloquear puede abrir una sesión nueva.

## Google, GitHub y Discord

SocialLoginButtons no recibe la contraseña de esas redes: redirige al backend y después al proveedor. startOAuth guarda una transacción temporal con state, cookie y, cuando corresponde, PKCE/nonce. El callback debe coincidir con esa transacción antes de aceptar la identidad externa.

oauthService intercambia el código desde Node con el secreto privado y comprueba/normaliza el perfil. oauthController busca provider + providerUserId; puede crear o vincular la cuenta si se cumplen las condiciones de email verificado. Guarda el vínculo en oauth_accounts y emite una sesión local de Umbral. No almacena la contraseña ni mensajes del proveedor. Un alta social puede tener password_hash nulo; no inventar una contraseña de la red.

Google/GitHub pasan por Auth0 y Discord usa la integración configurada. Que el dominio cambie durante la autorización es normal. El dominio de retorno y la elección de cuenta se ajustan en config/oauthProviders.js y en los paneles externos, no reemplazando el texto del botón.

## Tablas y transacciones

El esquema incluye roles, users, user_sessions, oauth_accounts, oauth_identity_locks, oauth_login_states, auth_challenges y audit_logs. Los modelos traducen consultas/resultados. withTransaction pasa una misma conexión a todas las escrituras de una operación y hace commit o rollback; usar el pool fuera de ese client no incorpora esa consulta a la transacción.

La auditoría registra acciones sin volverlas editables desde el perfil. Los scripts de migración y administración pueden modificar datos reales: no ejecutarlos solo para leer el código.

## Leer y ejecutar

Empezar por frontend/src/context/AuthContext.jsx, frontend/src/services/apiClient.js, backend/routes/authRoutes.js y backend/controllers/authController.js; después leer tokenService, challengeService y oauthController. Los archivos .env y .env.hosting son privados; los .env.example describen nombres, nunca claves reales.

En la raíz: npm ci; npm run dev inicia el entorno local según su configuración y puede arrancar MySQL local. Para verificar sin tocar cuentas reales: npm run build, npm run lint y npm test (tests aislados). El envío de correo desde hosting y las observaciones anteriores requieren su comprobación específica; documentar no equivale a repetir esos ensayos externos.

## Encontrar una función en el editor

En el archivo de código, los bloques de comentario explican responsabilidades, entradas/salidas y efectos importantes. Buscar el nombre con Ctrl+F permite encontrar la función; después usar Buscar referencias para ver quién la llama. El mapa siguiente incluye enlaces a los archivos reales y a las líneas vigentes al documentar.

[Mapa de archivos y funciones](MAPA-ARCHIVOS-Y-FUNCIONES.md).

Documentación en español del código activo. No se cambiaron instrucciones ejecutables, dependencias, secretos ni datos. Los respaldos con fechas, node_modules, compilaciones y archivos privados no son el código activo documentado. Los resultados de comprobación se registran por separado y no certifican servicios externos ni requisitos pendientes.
