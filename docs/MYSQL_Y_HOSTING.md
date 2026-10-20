# MySQL obligatorio y publicación de Umbral R5

## Estado comprobado

- Frontend React/Vite y backend Node/Express separados. La base activa es **MySQL Community 8.4.8 real**, no PostgreSQL ni MariaDB.
- Driver `mysql2` con consultas preparadas `?`, transacciones InnoDB, claves foráneas, índices únicos normalizados y fechas UTC.
- Se conservaron dos cuentas, sus UUID y hashes bcrypt, tres vínculos sociales y los eventos de auditoría. Se exige un nuevo login porque sesiones, estados OAuth y códigos anteriores no se trasladan.
- La base anterior y el respaldo local siguen intactos, excluidos de Git. La API no los usa; `pg` ya no es una dependencia.
- Google, GitHub y Discord completaron nuevamente el acceso real hasta el perfil usando MySQL. Siguen vinculados a la misma cuenta y sin duplicados.
- 70 pruebas aprobadas: 10 de frontend y 60 de backend, incluidas concurrencia del estado OAuth, bloqueo de identidad, límite exacto de cinco códigos fallidos, distribución de producción, orígenes en Render y transporte OAuth con diagnóstico privado y pausa ante HTTP 429.
- La distribución de producción se probó localmente con MySQL: HTML/recursos de React, rutas profundas, cabeceras, health y JSON 404 de API. Los archivos privados y el código del backend no se sirven al navegador.
- Diagnóstico SQL y autenticación SMTP/Mailtrap correctos. El correo de las pruebas se simula solo dentro del entorno de test.
- **Web pública desplegada:** [https://umbral-r5.onrender.com](https://umbral-r5.onrender.com). Render confirmó `Deploy succeeded | Live`; `/api/health` responde 200 con MySQL conectado. Google, GitHub y Discord completaron el login real hasta el perfil del dominio público.

### FreeDB: preparación comprobada el 19/10/2026

- El titular autorizó usar la base vacía `freedb_C3RVezF3`. Se comprobó que tenía cero tablas antes de importar únicamente `backend/db/schema.sql` por el panel HTTPS.
- La importación finalizó correctamente: MySQL `8.0.46-0ubuntu0.22.04.4`, ocho tablas y cero usuarios, cuentas sociales o eventos de auditoría. Solo se insertaron los roles propios del esquema; no se transfirieron cuentas, hashes ni datos locales.
- La conexión está guardada en `backend/.env.hosting`, excluido de Git y separado de `backend/.env`. La aplicación local continúa usando su MySQL local; este archivo no cambia automáticamente el entorno activo ni se carga en el frontend.
- El servidor informa `have_ssl=YES`, pero esto no demuestra una conexión externa cifrada válida. Las primeras pruebas agotaron el tiempo de conexión. El diagnóstico posterior sí recibió el saludo MySQL por TCP y confirmó `HANDSHAKE_SSL_ERROR`: `self-signed certificate in certificate chain`. No se desactivó TLS ni se aceptaron certificados no válidos.
- Para usar esta base con el login se necesita un certificado/CA oficial verificable y un nombre de servidor válido facilitados por FreeDB, o elegir otro proveedor MySQL con TLS válido. No se debe confiar automáticamente en un certificado descargado de la misma conexión no verificada.
- La configuración TLS de `mysql2` ahora exige también `verifyIdentity: true`, además de validar la cadena del certificado. Su regresión se comprueba en la suite MySQL.
- Queda pendiente resolver el certificado y comprobar la conexión desde el alojamiento web antes de activar esta base en la aplicación pública. No se debe presentar el esquema importado como un despliegue completo o un login remoto probado.
- El panel indica eliminación automática a los 30 días y 100 MB de capacidad. El alojamiento web todavía no fue creado ni se publicaron código o secretos en servicios nuevos.

## Archivos principales modificados

- `backend/package.json` y `package-lock.json`: `mysql2` reemplaza a `pg`; comandos de migración actualizados.
- `backend/config/db.js` y `env.js`: conexión MySQL, TLS, consultas preparadas y transacciones.
- `backend/db/schema.sql` y `least-privilege.sql`: esquema InnoDB y permisos por tabla.
- `backend/models/`: SQL nativo de MySQL y resultados compatibles con la API existente.
- `backend/controllers/authController.js`, `oauthController.js`, `codeController.js` y `emailController.js`: parámetros, bloqueos y actualizaciones compatibles con MySQL.
- `backend/services/challengeService.js`, `databaseHealth.js` y `middlewares/errorHandler.js`: intervalos, intentos, salud y errores del motor.
- `backend/scripts/`: instalación oficial local, preparación, importación privada, diagnóstico y migración MySQL. Se retiraron los scripts de arranque/migración PostgreSQL.
- `backend/tests/`: suites existentes adaptadas y nuevas regresiones de MySQL/concurrencia/producción.
- `render.yaml`, `backend/.env.example`, README y guías: preparación del despliegue sin claves públicas. El frontend conserva su diseño y contrato HTTP.

## Instalación local Windows

Desde la raíz, con Node.js 24 y npm:

```powershell
npm ci
npm run setup:local
npm run doctor
npm run dev
```

Abrir `http://localhost:5173/login`. El asistente descarga el ZIP oficial de MySQL, lo instala en `.local/mysql`, configura `.local/mysql-data` y escucha solo `127.0.0.1:3307`. No cambia XAMPP, servicios de Windows ni instalaciones ajenas. Antes de reutilizar/detener un servidor comprueba su directorio de datos.

El usuario de API es `umbral_r5_app`, sin privilegios administrativos globales ni capacidad para modificar/borrar auditoría. La cuenta root solo se utiliza para preparar la base y las pruebas aisladas. Sus claves aleatorias quedan fuera de Git. No distribuir `.local`, archivos de datos ni accesos privados.

En una instalación vacía se crea el administrador inicial. En esta copia se conserva el administrador existente sin restaurar ni cambiar su contraseña. Los accesos iniciales de una nueva instalación quedan en `.local/ACCESOS-MYSQL.txt`.

## Base externa y FreeDB

FreeDB aloja **la base**, no el frontend ni el servidor Node. Elegir una base separada para la entrega, sin borrar ni reutilizar datos de otros trabajos. Su plan gratuito es temporal: comprobar la fecha de eliminación que muestre el panel; no contratar planes ni cargar tarjetas automáticamente.

1. Iniciar sesión personalmente en `https://freedb.tech/login`.
2. Crear o seleccionar la base MySQL del proyecto con autorización del titular.
3. Revisar versión (`SELECT VERSION()`), host, puerto, base, usuario, límites y soporte TLS. Este esquema está preparado para MySQL 8.0 o superior.
4. Guardar las credenciales únicamente como secretos del backend/hosting. No enviarlas en el chat, subirlas al repositorio ni usar variables `VITE_`.
5. Ejecutar `backend/db/schema.sql` dentro de la base asignada. No hace falta permiso para crear una base nueva ni crear usuarios globales. Alternativamente ejecutar `npm run db:migrate` con `DATABASE_MIGRATION_URL` desde un entorno privado.
6. Usar para la API una cuenta limitada si el proveedor permite crearla. Si solo entrega una cuenta con permisos sobre su base, documentar esa limitación; no presentarla como equivalente a permisos por tabla comprobados localmente.
7. Crear cuentas de demostración nuevas por defecto. No transferir emails, hashes ni auditoría locales a terceros sin autorización específica del titular.

Ejemplo sin secretos reales:

```dotenv
DATABASE_URL=mysql://USUARIO:CLAVE_CODIFICADA@HOST:3306/BASE
DATABASE_SSL=true
```

Codificar caracteres especiales de usuario/clave con `encodeURIComponent` al construir la URL. TLS valida el certificado del servidor (`rejectUnauthorized: true`). Si el proveedor no admite TLS o su certificado no es válido, no desactivar las protecciones para ocultarlo: resolverlo con el proveedor o elegir otro alojamiento **MySQL** seguro. La conexión local usa `DATABASE_SSL=false` únicamente en loopback.

## Aiven MySQL gratuito: alternativa elegida

El titular eligió y autorizó Aiven después del error de validación del certificado de FreeDB. El 20/10/2026 se creó `umbral-r5` con el plan **Free ($0)** en su propio proyecto, sin tarjeta ni plan pago. No se eliminó la base FreeDB ni se cambió la conexión local.

Comprobación real: MySQL **8.4.11**, certificado CA obtenido del panel HTTPS oficial, validación de cadena y nombre del servidor activadas, y cifrado **TLS_AES_256_GCM_SHA384**. Se verificó una base vacía antes de crear ocho tablas InnoDB. Después de importar hay dos roles, cero usuarios, cero vínculos sociales y cero eventos de auditoría; no se copiaron cuentas ni hashes locales. La comprobación de salud usa el mismo módulo SQL de la aplicación.

La conexión y el CA quedan únicamente en `backend/.env.hosting`, ignorado por Git. La aplicación local conserva `backend/.env`. El titular autorizó crear `umbral_r5_web`: exige SSL, tiene permisos por tabla y no administra el motor ni puede modificar/borrar auditoría. Se verificaron las ocho tablas y el rechazo real de un UPDATE de auditoría. La credencial inicial solo se conserva como `DATABASE_MIGRATION_URL` para preparación privada; **no se cargó en Render**.

1. Ingresar personalmente en `https://console.aiven.io/`. Si no hay cuenta, completar el registro y aceptar personalmente los términos. No introducir tarjetas ni activar pruebas o planes pagos.
2. Seleccionar **MySQL**, un servicio nuevo para R5 y el plan **Free ($0)**. Comprobar el importe antes de crear. No usar PostgreSQL, MariaDB ni un servicio ajeno.
3. Descargar el **CA Certificate** desde **Overview > Connection information** del servicio autenticado. No confiar en certificados extraídos de una conexión no verificada.
4. Guardar el contenido PEM en `DATABASE_SSL_CA`, únicamente en el entorno privado del backend/hosting. Puede contener saltos de línea reales o `\n` escapados. Mantener `DATABASE_SSL=true`.
5. Configurar la URL MySQL con el host y puerto exactos asignados por Aiven. El driver y la migración exigen una cadena válida y que el certificado corresponda al nombre del servidor (`rejectUnauthorized` y `verifyIdentity` activados).
6. Crear únicamente el esquema del proyecto en una base vacía autorizada, sin transferir cuentas locales. Separar la cuenta de preparación y la de la API cuando los permisos del servicio lo permitan.
7. Verificar conexión TLS real, ocho tablas y flujos de autenticación desde el alojamiento definitivo antes de afirmar que el despliegue está terminado.

Según [Aiven Free MySQL](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier), el plan gratuito no requiere tarjeta ni tiene un plazo fijo de eliminación, pero puede detenerse por inactividad y no tiene SLA. El [certificado CA oficial](https://aiven.io/docs/platform/concepts/tls-ssl-certificates) es necesario para verificar la identidad de MySQL.

## Alojamiento web con Render

Publicación del 20/10/2026: se conectó GitHub después de la autorización del titular y su confirmación personal por email. Render puede acceder únicamente al repositorio privado `nehuenparrondo/umbral-r5`. Se creó el servicio `srv-dbbtt1d9fdbs73a8q4k0` con el plan **Free ($0)**, compilación reproducible, Node 24, cookies seguras y health check `/api/health`. No se cargaron tarjetas ni se contrataron planes pagos.

Las 19 variables de backend se importaron a Render con autorización explícita y se compararon en memoria, incluido el PEM completo del CA. Se generó un JWT exclusivo del servicio. La cuenta SQL es limitada; ninguna credencial de administración, archivo de datos o cuenta local se transfirió a la web. Las claves de Auth0, Discord y SMTP permanecen en las variables privadas del servicio, nunca en GitHub o variables VITE.

Comprobaciones públicas: health y sesión anónima 200; lista de proveedores sin secretos; API inexistente 404 JSON; rutas profundas sirven React; los intentos de leer archivos privados solo reciben el HTML de la SPA, no esos archivos. Cabeceras HSTS/nosniff activas. Los tres inicios OAuth generan retornos HTTPS correctos y cookies Secure/HttpOnly. En móvil de 390 px no se observó desbordamiento horizontal. Esto no equivale a completar cada autorización real ni los correos desde Render.

Discord conserva el retorno localhost y agrega `https://umbral-r5.onrender.com/api/auth/oauth/discord/callback`. En la aplicación Auth0 existente se guardaron y verificaron los retornos públicos de Google/GitHub, el origen HTTPS y la salida a `/login`, sin quitar los locales. Se recuperó la cuenta original de Auth0 con GitHub; no se creó otro tenant.

Los tres accesos reales se comprobaron el 20/10/2026, con autorización del titular para guardar su perfil/email en Aiven. Google creó una cuenta pública nueva; GitHub y Discord quedaron vinculados a ella. La comprobación SQL posterior confirmó **un usuario y tres vínculos**, sin duplicados ni copia de cuentas locales.

### Discord: diagnóstico y verificación pública

El primer acceso desde Render alcanzaba el consentimiento pero fallaba al intercambiar el código. El registro seguro identificó **HTTP 429** en el endpoint oficial de tokens de Discord; no se registraron claves, códigos, tokens ni cuerpos de respuestas. No se atribuyó este error a una contraseña del usuario ni se desactivaron verificaciones.

Se agregó el User-Agent de aplicación que exige la [referencia oficial de Discord](https://docs.discord.com/developers/reference#user-agent) a las solicitudes de token y perfil. El transporte reconoce 429 incluso si devuelve HTML, conserva únicamente metadatos permitidos y respeta `Retry-After` o `retry_after` antes de emitir otra solicitud al mismo endpoint dentro del proceso. Sin plazo informado usa una pausa conservadora de 60 segundos; no reintenta automáticamente. El frontend muestra un aviso específico y permite elegir otro método.

Después de publicar esta corrección y esperar antes de la nueva prueba, Discord completó el acceso hasta `/perfil`, con el mensaje de éxito y las tres cuentas vinculadas visibles. Esto verifica el resultado; no demuestra por sí solo si el 429 anterior se debió al User-Agent, al límite de la IP compartida u otra condición del proveedor. Los límites externos siguen siendo responsabilidad del proveedor; no se usaron proxies ni se cambiaron IP para eludirlos. Referencia: [límites y Retry-After de Discord](https://docs.discord.com/developers/topics/rate-limits).

El ciclo completo de correo desde Render todavía no está comprobado. La autenticación SMTP local y las pruebas automatizadas no equivalen a confirmar la entrega pública de códigos en Mailtrap.

La instalación limpia de la copia detectó el aviso [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv), incorporado a la base de avisos el 20/10/2026. Se actualizó únicamente Vite a **6.4.4**, sin cambiar la lógica de la aplicación. La auditoría volvió a cero vulnerabilidades. La verificación final local aprobó lint, compilación y 70 pruebas; la copia limpia compila con las variables privadas configuradas exclusivamente en Render.

En producción, si no se definen explícitamente `CLIENT_ORIGIN` y `SERVER_ORIGIN`, el backend adopta `RENDER_EXTERNAL_URL`, que asigna el alojamiento. Así no se adivina una URL pública ni se utiliza localhost por defecto en Render. Los valores explícitos siguen teniendo prioridad y el desarrollo local ignora esa variable de Render.

`render.yaml` define un único servicio Node **Free** que construye React y sirve frontend/API desde el mismo dominio HTTPS. No define ninguna base PostgreSQL.

1. El titular autorizó y se publicó una copia limpia en el repositorio privado `nehuenparrondo/umbral-r5`. Se incluyeron 144 archivos revisados, sin credenciales, datos, dependencias instaladas ni historial anterior. La copia de publicación está separada de la carpeta original; esta conserva sus cambios y su Git intactos. No cambiar la visibilidad del repositorio para resolver permisos de Render.
2. Ingresar a Render y crear el servicio con el repositorio y `render.yaml`, revisando permisos, términos y plan antes de confirmar.
3. Compilación: `npm ci --include=dev && npm run build`. Inicio: `npm start`. Salud: `/api/health`. El puerto lo proporciona Render mediante `PORT`.
4. Configurar `DATABASE_URL` de MySQL, `DATABASE_SSL=true`, `NODE_ENV=production`, `COOKIE_SECURE=true` y un `JWT_SECRET` propio de despliegue.
5. Establecer **CLIENT_ORIGIN y SERVER_ORIGIN con el mismo dominio HTTPS real** que asigne Render. No conservar localhost ni usar dos dominios diferentes para las cookies.
6. Configurar claves Auth0, `AUTH0_ENABLED_PROVIDERS=google,github`, Client ID/Secret de Discord y SMTP privado. No copiar el archivo `.env` al código del repositorio.
7. Mantener Mailtrap Sandbox si se trata de una demostración: los códigos llegan al buzón de pruebas, no al correo real del destinatario. Probar SMTP desde el alojamiento; no suponer que la prueba local certifica la red externa.

En Render Free el servicio puede dormirse tras inactividad. No está diseñado para alta disponibilidad de producción. Las restricciones de SMTP incluyen los puertos 25, 465 y 587; el proyecto usa Mailtrap en 2525, cuya conectividad también debe verificarse al desplegar. No eludir cuotas ni contratar un plan para resolverlo sin consentimiento.

## Callbacks del dominio definitivo

Registrar sin eliminar los retornos locales necesarios para seguir desarrollando:

| Servicio                      | Configuración nueva                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Auth0, Allowed Callback URLs  | `https://DOMINIO/api/auth/oauth/google/callback` y `https://DOMINIO/api/auth/oauth/github/callback` |
| Auth0, Allowed Web Origins    | `https://DOMINIO`                                                                                   |
| Auth0, Allowed Logout URLs    | `https://DOMINIO/login`                                                                             |
| Discord, OAuth2 Redirects     | `https://DOMINIO/api/auth/oauth/discord/callback`                                                   |
| Backend, DISCORD_REDIRECT_URI | El mismo retorno HTTPS registrado en Discord                                                        |

Las claves de desarrollo de Auth0 son solo para demostración y tienen limitaciones. Confirmar cada proveedor en la URL final antes de dar la entrega por lista; un dominio nuevo puede necesitar credenciales propias/configuración adicional.

## Lista de verificación de la URL pública

- `/api/health` comprueba tablas y responde 200 con base conectada.
- Login, registro, rutas profundas y recursos de React responden por HTTPS; una API inexistente devuelve JSON 404.
- Registrar, verificar email en Mailtrap, ingresar, editar, recuperar contraseña, cambiar email y cerrar sesión.
- Probar Google, GitHub y Discord hasta el perfil del dominio público; repetir sin crear cuentas duplicadas.
- Cuenta normal recibe 403 en administración. Admin puede gestionar cuentas y consultar auditoría. Baja lógica revoca sesiones.
- Cookies HTTP-only/Secure, CSRF, límites y ausencia de claves en recursos públicos.
- Documentar fecha de expiración de FreeDB y limitaciones del hosting. Guardar un respaldo lógico privado antes de que venza la base.

Referencias oficiales: [FreeDB](https://freedb.tech/), [Render Free](https://render.com/docs/free), [Blueprint de Render](https://render.com/docs/blueprint-spec), [MySQL2](https://sidorares.github.io/node-mysql2/docs).
