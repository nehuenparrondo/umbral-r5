# Microsoft como tercer proveedor de R5

> Antecedente histórico: el titular eligió reemplazar Microsoft por Discord. Microsoft ya no aparece en la interfaz y sigue desactivado. La configuración vigente está en [CONFIGURAR_DISCORD.md](CONFIGURAR_DISCORD.md); los pasos siguientes solo aplican a una futura reactivación de Microsoft.

Microsoft es una identidad distinta de Google y GitHub. Gmail ya pertenece a Google: no se duplica un botón para simular tres proveedores.

## Estado comprobado de esta copia

- Implementación local agregada; Google y GitHub continúan verificados.
- Conexión oficial `windowslive` creada en Auth0, estrategia Azure AD para cuentas personales, únicamente permiso User.Read y sincronización de perfil.
- Conexión habilitada para **Umbral R5** y callback exclusivo de Microsoft guardado.
- La prueba real llegó a Microsoft, que respondió `AADSTS900144`: falta el parámetro `client_id`. Las claves de desarrollo de esta conexión no proporcionan un Client ID funcional en esta copia.
- **Microsoft no está terminado ni probado hasta el perfil local.** Se necesita registrar una aplicación propia en Microsoft Entra, configurar sus claves en la conexión Auth0 y repetir la prueba. No se omite la validación de email para evitar ese requisito.
- Mientras faltan esas claves, Microsoft permanece visible pero desactivado en R5. Después de guardarlas en Auth0, agregar `microsoft` a AUTH0_ENABLED_PROVIDERS y reiniciar la API para realizar la prueba.
- Pruebas locales: 10 del frontend y 37 del backend aprobadas; lint y compilación correctos. Las pruebas automatizadas no sustituyen el acceso interactivo.

### Comprobación del panel de Azure

Se aceptó, con autorización del titular, el permiso de Microsoft para leer perfil y email de GitHub. Microsoft reconoció una cuenta personal existente y propuso vincular GitHub como credencial de acceso. Esa vinculación no se completó; se utilizó el ingreso directo para no modificar métodos de autenticación personales.

La sesión directa llegó tanto a Microsoft Entra como al portal de Azure. En ambos, el acceso a la administración del directorio fue rechazado con `AADSTS16000`: la cuenta personal no pertenece al directorio solicitado y no dispone de acceso a esa aplicación administrativa. Azure mostró además la bienvenida para una cuenta sin suscripción. No se contrataron planes, no se agregaron datos de pago ni se omitieron los controles de acceso.

El siguiente paso requiere una cuenta/directorio de Azure con permisos para registrar aplicaciones, o elegir otro proveedor como tercer acceso. La guía oficial de registro exige una cuenta Azure con suscripción activa, un tenant y al menos el rol Application Developer. Este bloqueo externo no se resuelve cambiando estilos ni inventando credenciales. Microsoft sigue desactivado localmente hasta cumplir esos requisitos y completar una prueba real.

## Obtener las claves propias

Entrar a [Microsoft Entra](https://entra.microsoft.com/) con una cuenta que pueda registrar aplicaciones, siguiendo la [guía oficial de Microsoft](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app?tabs=client-secret). No contratar planes ni ingresar datos de pago solo para intentar completar esta demostración.

En **App registrations > New registration**, preparar una aplicación para cuentas personales Microsoft con plataforma **Web** y el retorno del tenant propio:

```text
https://TU-TENANT.us.auth0.com/login/callback
```

No usar aquí el callback de Express ni el callback compartido `login.us.auth0.com`. Copiar el **Application (client) ID** y crear un secreto de cliente con vigencia acotada. El secreto se muestra una sola vez; lo debe guardar el titular en Auth0, sin publicarlo en el chat. Usar el **valor** del secreto, no el identificador del secreto.

En Auth0: **Authentication > Social > windowslive > Settings**, completar Client ID y Client Secret propios, guardar y volver a probar desde R5. Si la cuenta no dispone de directorio o permisos de registro, completar primero ese requisito con el titular o administrador; no eludirlo ni otorgar permisos globales innecesarios.

## Preparación en Auth0

1. Usar la aplicación propia **Umbral R5**, de tipo **Regular Web Application**.
2. En **Settings > Allowed Callback URLs**, agregar sin borrar los otros retornos:

   `http://localhost:4000/api/auth/oauth/microsoft/callback`

3. En **Authentication > Social > Create Connection**, elegir la integración oficial **Microsoft** y revisar sus términos.
4. Conservar el nombre `windowslive`. Para cuentas personales, usar la estrategia **Azure AD (personal accounts)** si el panel ofrece la selección de versión; no usar la API Live Connect antigua.
5. Solicitar únicamente los atributos básicos y email necesarios para iniciar sesión. No habilitar correo, contactos, calendarios ni almacenamiento si no son necesarios.
6. En la pestaña **Applications** de la conexión, habilitar **Umbral R5** y guardar.

Las claves de desarrollo de Auth0 son solo para pruebas. Si la conexión exige claves propias, crear la aplicación del proveedor correspondiente y registrar el callback del tenant de Auth0, no el de Express. Esas claves se guardan en la conexión de Auth0, nunca en React ni en el chat.

## Configuración local

En backend/.env:

```dotenv
AUTH0_ENABLED_PROVIDERS=google,github,microsoft
AUTH0_MICROSOFT_CONNECTION=windowslive
```

Conservar las credenciales privadas de la aplicación Auth0 propia. Reiniciar la API después de editar el entorno y ejecutar `npm run oauth:check`. El diagnóstico indica presencia de configuración y descubrimiento OIDC; no certifica el acceso real.

## Prueba completa

1. Abrir http://localhost:5173/login y elegir **Continuar con Microsoft**.
2. Iniciar sesión personalmente en Microsoft. No compartir contraseñas ni códigos con el asistente.
3. Revisar cualquier autorización de perfil/email.
4. Comprobar el regreso a `/perfil?oauth=microsoft`, la sesión local válida y la cuenta Microsoft vinculada.
5. Cerrar sesión y repetir para comprobar que no se duplica la cuenta.

La conexión social está destinada a cuentas Microsoft personales; una cuenta corporativa puede requerir una conexión empresarial diferente. Si Microsoft no proporciona email verificado, R5 rechaza el alta o vínculo en vez de inventar datos o quitar la verificación.

## Implementación y seguridad

- Microsoft reutiliza el flujo genérico de estado de un uso, PKCE, nonce, firma, emisor y audiencia. No se crea un flujo paralelo ni un login simulado.
- El subject original de UserInfo debe coincidir con el token OIDC firmado antes de normalizar el ID local.
- Sin Auth0 configurado y sin Microsoft habilitado, el botón queda desactivado; no existe un fallback directo ficticio.
- Las contraseñas sociales no pasan por R5 y los tokens del proveedor no se guardan.

Referencias oficiales: [Microsoft y cuentas personales en Auth0](https://support.auth0.com/center/s/article/try-connection-fails-for-windows-live-social-connection-with-business-accounts), [migración de Live Connect a Azure AD](https://support.auth0.com/center/s/article/Windows-Live-Error-Error-retrieving-AzureAD-profile), [limitaciones de claves de desarrollo](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/devkeys).

## Archivos de esta incorporación

- backend/config/env.js y backend/config/oauthProviders.js: Microsoft mediante Auth0, sin fallback simulado.
- backend/.env y backend/.env.example: selección explícita de proveedores y nombre windowslive.
- frontend/src/components/SocialLoginButtons.jsx y frontend/src/styles/auth.css: tres botones y distribución responsive.
- backend/tests/auth0.test.js, backend/tests/microsoftDisabled.test.js y frontend/tests/socialLogin.test.js: contratos y estados seguros de Microsoft.
- README.md y guías de Auth0, demostración, pruebas manuales y revisión: instrucciones y alcance real de la comprobación.
