# Discord como tercer proveedor de R5

Actualización del motor: R5 usa MySQL 8. Los tres proveedores se probaron nuevamente hasta el perfil y las 61 pruebas actuales están documentadas en [MYSQL_Y_HOSTING.md](MYSQL_Y_HOSTING.md). Los resultados de 52 pruebas siguientes corresponden a la revisión inicial del reemplazo de Microsoft.

La interfaz de ingreso y registro ofrece **Google, GitHub y Discord**. Discord reemplaza a Microsoft en la entrega; Gmail pertenece a Google y no se cuenta como otro proveedor.

## Arquitectura y estado

- Google y GitHub mantienen Auth0 y sus pruebas reales anteriores satisfactorias. Discord también completó el acceso real hasta el perfil local.
- Discord usa la integración OAuth directa existente de Express, sin modificar usuarios, contraseñas, Mailtrap ni la base de datos.
- Microsoft no se muestra y permanece desactivado. Su guía se conserva como antecedente, no como configuración de entrega.
- Discord está configurado y habilitado en esta copia. En otras instalaciones queda desactivado si faltan sus credenciales privadas. La presencia del botón o una prueba automática no reemplaza el acceso real.

## Configurar la aplicación propia

1. Entrar al [panel oficial de Discord](https://discord.com/developers/applications) con la cuenta del titular.
2. Crear **Umbral R5**, revisando los términos de desarrolladores y completando personalmente cualquier verificación humana.
3. En **OAuth2**, registrar exactamente este retorno y guardar:

   `http://localhost:4000/api/auth/oauth/discord/callback`

4. Copiar el **Client ID** y el **Client Secret** de esa aplicación al archivo privado `backend/.env`. No usar el Public Key ni un Bot Token. No publicar las claves ni pegarlas en un chat.

```dotenv
AUTH0_ENABLED_PROVIDERS=google,github
DISCORD_CLIENT_ID=identificador-propio
DISCORD_CLIENT_SECRET=secreto-propio
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/oauth/discord/callback
```

No agregar `discord` a `AUTH0_ENABLED_PROVIDERS`: eso seleccionaría otra integración, mediante Auth0, que no se utiliza en esta entrega. El retorno directo de Discord es el de Express, no `/login/callback` de Auth0.

5. Reiniciar el proceso del backend para cargar las variables. Las claves nunca se colocan en React ni en variables `VITE_`.
6. Ejecutar `npm run oauth:check`. Debe informar Google/GitHub por Auth0 y Discord directo. Este comando revisa configuración; no reemplaza el ingreso real.

## Permisos mínimos y seguridad

Se solicitan únicamente `identify email`: identidad, perfil y dirección de correo. No se solicita acceso a mensajes, servidores, contactos ni instalación de bots.

Express utiliza Authorization Code con un estado aleatorio, vencimiento, cookie HTTP-only y consumo único. Intercambia el código con el secreto solo en el backend. Discord directo no utiliza el token OIDC ni el nonce de Auth0; Google y GitHub conservan PKCE y sus verificaciones OIDC.

El campo `verified` debe ser estrictamente `true` para vincular automáticamente una cuenta existente por email. No se inventan correos ni se omite su verificación. Los tokens externos no se guardan como credenciales de la sesión local.

## Prueba real antes de entregar

1. Abrir `http://localhost:5173/login` y pulsar **Continuar con Discord**.
2. Revisar el consentimiento de Discord: solo identidad y email. Autorizar personalmente o con confirmación específica del titular.
3. Comprobar el retorno a `/perfil?oauth=discord`, la sesión y la fila Discord en **Cuentas vinculadas**.
4. Cerrar sesión y repetir: debe reutilizar la cuenta local.
5. Cancelar un intento nuevo: debe volver al login con mensaje y sin iniciar sesión.
6. Verificar Google y GitHub sin cambiar sus credenciales.

Ejecutar además `npm test`, `npm run lint` y `npm run build`. Los tests usan datos locales aislados y no requieren credenciales reales de Discord.

## Revisión local del reemplazo

- 52 pruebas aprobadas: 10 del frontend y 42 del backend, incluidas cinco específicas de Discord directo, permisos mínimos, perfil, vinculación segura y ausencia de secretos públicos.
- Revisión de código y compilación de producción completadas sin errores.
- API saludable y MySQL conectado. La lista pública confirma Google/GitHub por Auth0 y Discord directo con credenciales configuradas; Microsoft permanece desactivado.
- Login revisado en navegador: muestra Google, GitHub y Discord; no muestra Microsoft. En móvil no se detectó desbordamiento horizontal.
- Revisión de 153 archivos de texto sin coincidencias del nombre anterior ni claves privadas configuradas dentro de la compilación pública.
- Aplicación propia **Umbral R5** creada en Discord tras completar la verificación humana autorizada. El callback fue guardado con autorización del titular. El titular generó el secreto y sus credenciales se guardaron únicamente en `backend/.env`, excluido de Git. Se reinició la API y se aceptó el consentimiento de perfil y correo con autorización específica, sin permisos de mensajes.
- Acceso real Discord completado hasta `/perfil?oauth=discord`. La misma cuenta local muestra exactamente tres identidades vinculadas: Google, GitHub y Discord.
- Cierre de sesión y cancelación comprobados: cancelar vuelve al login con mensaje de rechazo, sin autenticar. Un nuevo ingreso Discord vuelve al mismo perfil y conserva exactamente tres vínculos, sin duplicación.
- Recargar el perfil conserva la sesión. La revisión de consola del navegador no registró errores. Se dejó el perfil abierto para probar el trabajo.

Referencia: [OAuth2 oficial de Discord](https://docs.discord.com/developers/topics/oauth2).
