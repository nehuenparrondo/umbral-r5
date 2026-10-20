# Configurar Auth0 para el login social de R5

La interfaz ofrece **Google, GitHub y Discord**. Google y GitHub usan Auth0 con Authorization Code, PKCE y OpenID Connect. Discord usa Authorization Code directo contra su API; seguir [CONFIGURAR_DISCORD.md](CONFIGURAR_DISCORD.md). El backend conserva proveedores opcionales anteriores sin mostrarlos en la entrega.

## 1. Crear la aplicacion

1. Entrar a <https://manage.auth0.com/>.
2. Ir a **Applications > Applications > Create Application**.
3. Nombre sugerido: `Umbral R5`.
4. Elegir **Regular Web Applications**. El secreto queda solamente en Express, nunca en React.
5. En **Settings**, copiar `Domain`, `Client ID` y `Client Secret` al archivo `backend/.env`:

```dotenv
AUTH0_DOMAIN=TU-TENANT.us.auth0.com
AUTH0_CLIENT_ID=valor-del-panel
AUTH0_CLIENT_SECRET=valor-del-panel
AUTH0_ENABLED_PROVIDERS=google,github
```

No agregar `https://` en `AUTH0_DOMAIN` y nunca subir `backend/.env` a GitHub.

## 2. URLs permitidas

En **Allowed Callback URLs**, registrar estas dos direcciones exactas:

```text
http://localhost:4000/api/auth/oauth/google/callback,
http://localhost:4000/api/auth/oauth/github/callback
```

En **Allowed Logout URLs** usar `http://localhost:5173/login` y en **Allowed Web Origins** usar `http://localhost:5173`. Guardar los cambios.

## 3. Activar conexiones sociales

Ir a **Authentication > Social > Create Connection**. En la pestaña **Applications** de cada conexión hay que habilitar `Umbral R5`.

En `AUTH0_ENABLED_PROVIDERS` incluir únicamente las redes realmente preparadas. No copiar el tenant ni las claves de otro proyecto o persona. Los botones esperan la respuesta de la API y quedan desactivados si falta configuración o falla esa consulta; permiten reintentar sin salir de la pantalla.

| Boton de R5 | Nombre de conexion esperado | Tipo                      |
| ----------- | --------------------------- | ------------------------- |
| Google      | `google-oauth2`             | Conexion oficial de Auth0 |
| GitHub      | `github`                    | Conexion oficial de Auth0 |

Para una demostracion local, Auth0 permite probar algunas conexiones oficiales con sus **Developer Keys**. Son solamente para desarrollo: en produccion cada proveedor exige una aplicacion propia y sus credenciales.

## 4. Discord directo y alternativa Auth0

Discord aparece en la interfaz y usa OAuth directo en esta entrega. Registrar su callback de Express y sus claves según [CONFIGURAR_DISCORD.md](CONFIGURAR_DISCORD.md). No activar la conexión Auth0 `discord` para ese modo.

Solo si se decidiera migrarlo posteriormente a Auth0, se necesitaría la siguiente configuración alternativa, que no se combina con el callback directo:

Crear una aplicacion en Discord Developer Portal. La redireccion que se registra en Discord no es la de R5, sino:

```text
https://TU_AUTH0_DOMAIN/login/callback
```

Crear una Custom Social Connection en Auth0 con:

- Connection Name: `discord`
- Authorization URL: `https://discord.com/oauth2/authorize`
- Token URL: `https://discord.com/api/v10/oauth2/token`
- Scope: `identify email`
- Fetch User Profile Script: copiar [discord-fetch-user-profile.js](auth0/discord-fetch-user-profile.js)

## 5. Twitch opcional

Twitch no aparece en la interfaz final porque no hay credenciales del proveedor. Para habilitarlo en una ampliacion futura:

Crear una aplicacion en Twitch Developer Console con callback `https://TU_AUTH0_DOMAIN/login/callback`. En Auth0:

- Connection Name: `twitch`
- Authorization URL: `https://id.twitch.tv/oauth2/authorize`
- Token URL: `https://id.twitch.tv/oauth2/token`
- Scope: `openid user:read:email`
- Fetch User Profile Script: copiar [twitch-fetch-user-profile.js](auth0/twitch-fetch-user-profile.js)

Twitch exige solicitar los claims `email`, `email_verified`, `picture` y `preferred_username`. Si el editor de la conexion permite parametros de autorizacion, agregarlos en `claims`; la referencia exacta esta en [Twitch OIDC](https://dev.twitch.tv/docs/authentication/getting-tokens-oidc/).

## 6. X

La conexión oficial se llama `twitter`. Revisar la versión y credenciales que admita el panel actual de Auth0. Puede requerir una aplicación del portal de desarrolladores y depender del nivel de acceso de la cuenta. Si X no entrega un email verificado, R5 rechaza el alta de forma segura en lugar de inventar una identidad.

Para la entrega demostrar Google y GitHub por Auth0 y Discord directo, una vez completada su prueba real. Facebook/Meta, X, Twitch y Microsoft no se muestran.

## 7. Verificar

Reiniciar el proyecto y ejecutar:

```powershell
npm run dev
npm run oauth:check
```

`npm run oauth:check` no imprime secretos. Muestra presencia de credenciales y disponibilidad de descubrimiento OIDC, no una certificación de acceso. Las claves de desarrollo sirven solo para pruebas y pueden requerir volver a autenticarse con el proveedor.

Abrir <http://localhost:5173/login>. Al pulsar Google o GitHub, la secuencia correcta es:

1. R5 genera `state`, `nonce` y PKCE.
2. El navegador va a `/authorize` de Auth0 con la conexion elegida.
3. Auth0 autentica con la red social.
4. Auth0 vuelve al callback exacto de Express con un codigo de un solo uso.
5. Express cambia el codigo por tokens, valida firma, emisor, audiencia, nonce y perfil.
6. R5 crea o vincula la cuenta y emite su propia sesion local.

## 8. Diagnóstico de errores

- `oauth_configuration`: revisar credenciales, callback exacto y conexión habilitada para la aplicación en Auth0.
- `oauth_denied`: el proveedor o una política rechazó el acceso; no implica necesariamente que el usuario canceló.
- `oauth_cancelled`: el proveedor informó explícitamente una cancelación.
- `oauth_invalid_state`: solicitud vencida, sin su cookie de origen o ya utilizada. Volver al login e iniciar un intento nuevo.

Usar siempre `http://localhost:5173` para la demostración; no alternar con `127.0.0.1` en medio del acceso. Las descripciones externas no se publican en la URL del frontend. La comprobación de estado, PKCE, nonce, firma y correo verificado se conserva.

Referencias oficiales: [Authorization Code de Auth0](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow/add-login-auth-code-flow), [conexiones OAuth2 personalizadas](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/oauth2) y [Developer Keys](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/devkeys).
