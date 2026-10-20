# Pruebas manuales de OAuth 2.0 con Auth0

Los tests automaticos validan `state`, PKCE, nonce, URLs y perfiles sin depender de Internet. Esta guia cubre la prueba real de navegador con el tenant configurado segun [CONFIGURAR_AUTH0.md](CONFIGURAR_AUTH0.md).

## Preparacion comun

1. Ejecutar `npm ci`, `npm run setup:local` y `npm run dev`.
2. Ejecutar `npm run oauth:check`: Google y GitHub deben indicar Auth0 con discovery OIDC disponible; Discord debe indicar modo directo con credenciales propias.
3. Abrir `http://localhost:5173/login` y pulsar un proveedor.
4. Google/GitHub pasan por Auth0 con `response_type=code`, `state`, `nonce`, PKCE y su `connection`. Discord va directamente a `discord.com/oauth2/authorize` con `response_type=code`, `state`, callback de Express y scope `identify email`.
5. Autorizar en la red social y comprobar la llegada a `/perfil?oauth=<proveedor>`.
6. Confirmar en **Cuentas vinculadas** el proveedor y en `audit_logs` uno de `OAUTH_REGISTER`, `OAUTH_LINK` u `OAUTH_LOGIN`.
7. Cerrar sesion y repetir: debe reutilizar el mismo usuario local.

## Matriz de proveedores

| Boton   | Conexion esperada en Auth0 | Resultado correcto                                                |
| ------- | -------------------------- | ----------------------------------------------------------------- |
| Google  | `google-oauth2`            | Auth0 entrega `sub`, perfil y email confirmado.                   |
| GitHub  | `github`                   | Se recibe el email autorizado y confirmado.                       |
| Discord | OAuth directo, sin Auth0   | Identidad, email y `verified` verdadero para vincular por correo. |

La interfaz muestra Google, GitHub y Discord, sin duplicar Gmail. Los tres se probaron de punta a punta y quedaron vinculados al mismo perfil local. Discord también se comprobó al cancelar, repetir el ingreso sin duplicar vínculos y recargar la sesión; ver [CONFIGURAR_DISCORD.md](CONFIGURAR_DISCORD.md). Facebook, X, Microsoft y Twitch no se renderizan; el backend conserva sus implementaciones opcionales.

## Casos negativos obligatorios

- Cancelar el consentimiento: vuelve a Login con mensaje, sin crear usuario.
- Cambiar o borrar `state`: se rechaza como `oauth_invalid_state`.
- Reutilizar el mismo callback: el estado y el codigo de un solo uso se rechazan.
- Quitar `AUTH0_CLIENT_SECRET`: los botones vuelven al fallback directo o quedan desactivados.
- Deshabilitar una conexion para la aplicacion en Auth0: Auth0 rechaza el intento y R5 no crea usuario.
- Usar un email existente que el proveedor no haya verificado: no se vincula.

## Que mostrar al profesor

1. Los tres botones de Google, GitHub y Discord; no presentar un proveedor desactivado o sin prueba real como acceso terminado.
2. La redirección a Auth0 para Google/GitHub y directamente a Discord para ese proveedor.
3. El regreso al perfil autenticado.
4. La fila de cuenta vinculada y el evento de auditoria.
5. El codigo: `state`, PKCE y nonce se generan en `backend/services/oauthService.js`; los tokens externos no se guardan.

El modo directo anterior continua disponible si Auth0 no esta configurado. En ese caso, las callbacks son las de `backend/.env.example` y cada proveedor necesita sus propias credenciales.

<!-- This file exports: manual OAuth/Auth0 verification guide. -->
<!-- It is used by: students and reviewers performing end-to-end tests. -->
<!-- It imports from: CONFIGURAR_AUTH0.md and the implemented OAuth flow. -->
