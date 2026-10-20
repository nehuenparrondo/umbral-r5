# Demostracion final de R5 con Auth0

## Que mostrar

1. Ejecutar `npm run dev` desde la carpeta `R5`.
2. Abrir `http://localhost:5173/login`.
3. Mostrar Google, GitHub y Discord. Los tres completaron el ingreso real y aparecen vinculados al mismo perfil; ver [CONFIGURAR_DISCORD.md](CONFIGURAR_DISCORD.md). En otra computadora se deben configurar las claves privadas y repetir las pruebas.
4. Pulsar preferentemente Google o GitHub y explicar que R5 redirige al dominio del tenant Auth0.
5. Completar el ingreso en el proveedor y comprobar el regreso al perfil de R5.

## Como funciona

1. R5 crea un `state`, un `nonce` y un desafio PKCE distintos para cada intento.
2. El backend redirige al endpoint `/authorize` de Auth0 indicando la conexion elegida.
3. Auth0 delega la autenticación en Google o GitHub según el botón elegido.
4. Auth0 vuelve al callback autorizado del backend con un codigo de un solo uso.
5. El backend intercambia el codigo, valida firma, emisor, audiencia, `nonce` y perfil.
6. R5 crea o vincula el usuario local y abre su propia sesion segura.

## Aclaraciones para la entrega

- Auth0 centraliza Google y GitHub. Discord se autentica directamente con Authorization Code y estado de un uso; su retorno termina en la misma sesión local. Las contraseñas sociales nunca pasan por R5.
- Los secretos estan solamente en `backend/.env`, que Git no versiona.
- Discord reemplaza a Microsoft y necesita su Client ID y Client Secret propios, solo en el backend. Sin claves, su botón queda desactivado; no se simula un acceso exitoso.
- El backend conserva otros proveedores como opciones futuras fuera de la interfaz.
- Mailtrap y el sistema de usuarios heredado de R3 siguen disponibles.
- La validación automática es: `npm run lint`, `npm run build`, `npm test` y `npm run oauth:check`. El último comando no reemplaza una prueba real. Ver el estado comprobado en [REVISION_ACCESO_SOCIAL.md](REVISION_ACCESO_SOCIAL.md).

<!-- This file exports: guion breve para presentar la integracion Auth0. -->
<!-- It is used by: estudiante y docente durante la demostracion final. -->
