# Revisión de identidad y acceso social

Actualización posterior: el titular eligió **Discord como tercer proveedor**, reemplazando Microsoft en la interfaz. Google y GitHub permanecen verificados mediante Auth0; Discord quedó configurado con credenciales propias solo en el backend y completó el ingreso real mediante OAuth directo. El perfil local muestra los tres proveedores vinculados, sin duplicación al repetir Discord. Consultar [CONFIGURAR_DISCORD.md](CONFIGURAR_DISCORD.md). El detalle siguiente conserva el registro de la revisión anterior.

## Correcciones locales

- Se retiraron el dominio y las credenciales de la aplicación Auth0 copiada; ahora se usa una aplicación propia llamada **Umbral R5**. Los valores privados permanecen exclusivamente en backend/.env, excluido de Git.
- No se encontraron otras referencias a la identidad anterior en los archivos de texto revisados, incluidos configuración privada, fuentes, documentos y compilación pública. Se excluyeron dependencias, historial Git y datos binarios de PostgreSQL. No se alteraron historiales de autoría ni respaldos de datos.
- Los botones sociales esperan la configuración de la API. Una carga pendiente, fallida, un proveedor ausente o desactivado impiden navegar. Un fallo de consulta permite reintentar y no bloquea el formulario habitual.
- Un rechazo del proveedor ya no se informa automáticamente como una cancelación. Se distinguen errores de configuración, rechazos y cancelaciones explícitas sin mostrar descripciones externas.
- Se conservan la validación del estado/cookie, consumo de un solo uso, PKCE, nonce, validación OIDC y requisito de email verificado.
- Se corrigió el rechazo de todos los perfiles Auth0: se comparaba el subject firmado con un ID local al que ya se había quitado el prefijo de conexión. Ahora se compara el subject original del token con el de UserInfo antes de mapear el ID local. Se mantiene el rechazo de identidades distintas y nonce incorrecto.
- El diagnóstico de OAuth diferencia presencia de credenciales de una prueba real de acceso.
- Se corrigió el aislamiento de pruebas SQL: los permisos de conexión se aplican a la base temporal de cada prueba, no a la base diaria compartida. Esto evita la colisión de las pruebas paralelas.

## Configuración remota realizada con autorización

- Creada **Umbral R5** como **Regular Web Application** en la cuenta propia.
- Registrados callbacks exactos de Google, Facebook, GitHub y X bajo http://localhost:4000/api/auth/oauth/PROVEEDOR/callback.
- Registrados origen http://localhost:5173 y retorno de salida http://localhost:5173/login.
- Google y GitHub están habilitados para Umbral R5 con las claves de desarrollo de Auth0. Se completó un ingreso real con cada uno, con las autorizaciones del titular, hasta el perfil local. Ambos quedaron vinculados a la misma cuenta por su email verificado.
- Se crearon y habilitaron también las conexiones oficiales de Facebook y X con autorización del titular; X usa OAuth 2.0 y únicamente sus scopes requeridos por Auth0.
- La prueba de Facebook llegó al proveedor, que respondió: «El inicio de sesión con Facebook no está disponible actualmente para esta app». La aplicación de prueba de Auth0 no permite completar ese ingreso; se requiere una aplicación propia en Meta.
- X volvió con un error de configuración. El diagnóstico de Auth0 confirmó: «OAuth2Strategy requires a clientID option». Se requieren Client ID y Client Secret propios para esa conexión.
- **Google y GitHub están habilitados localmente. Facebook y X quedan desactivados** para no ofrecer accesos comprobados como fallidos. Sus conexiones permanecen preparadas en Auth0 hasta completar las claves y permisos propios.

## Verificaciones

| Verificación                                          | Resultado                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Pruebas del frontend                                  | 9 aprobadas                                                                     |
| Pruebas del backend                                   | 35 aprobadas, ninguna omitida                                                   |
| Revisión estática de ambos paquetes                   | Sin errores                                                                     |
| Compilación del frontend                              | Correcta                                                                        |
| Auditoría de dependencias de producción               | 0 vulnerabilidades informadas                                                   |
| Descubrimiento OIDC del tenant propio                 | Disponible                                                                      |
| Inicio OAuth de Google                                | Redirige al tenant propio                                                       |
| Acceso real Google y GitHub                           | Perfil local y ambas cuentas vinculadas correctamente                           |
| Subject OIDC original y nonce                         | Coinciden antes del mapeo; identidades distintas o nonce incorrecto se rechazan |
| Callback con conexión deshabilitada                   | Error de configuración seguro                                                   |
| Callback cancelado/rechazado                          | Mensaje correspondiente, sin descripción externa                                |
| Callback sin cookie o reutilizado                     | Rechazado; no se emite sesión                                                   |
| Secretos configurados en archivos públicos compilados | Ninguna coincidencia                                                            |

## Pendiente externo: Facebook y X

Google y GitHub ya se verificaron de punta a punta. Facebook y X no están resueltos: sus restricciones no se corrigen cambiando estilos ni inventando credenciales.

El titular debe crear sus aplicaciones de desarrollador en Meta y X, registrar el callback del tenant propio de Auth0 (no el callback de Express) y completar las claves en Authentication > Social > conexión > Settings. No publicar esas claves en el chat ni en React. En Meta, verificar también modo de aplicación, permisos y usuarios de prueba que corresponda.

X puede no compartir un email verificado. R5 no debe inventarlo ni omitir la verificación para permitir el alta. Si la conexión no proporciona ese dato, se necesita definir un flujo adicional seguro de verificación antes de ofrecer ese acceso para cuentas nuevas.

Después de completar cada conexión, incorporarla a AUTH0_ENABLED_PROVIDERS, reiniciar la API y realizar un acceso real. No publicar claves, no simular autenticaciones y no dar estas pruebas por completadas antes de ver una sesión local válida.

## Archivos de esta revisión

- backend/.env: aplicación propia y selección de proveedores.
- backend/controllers/oauthController.js y backend/utils/oauthErrors.js: clasificación segura.
- backend/services/oauthService.js y backend/tests/oidcProfile.test.js: subject OIDC original antes de la normalización, firma, nonce e identidades distintas.
- backend/scripts/checkOAuth.js: diagnóstico sin prometer disponibilidad remota.
- backend/tests/oauthErrors.test.js y backend/tests/testDatabase.js: regresiones e integración aislada.
- frontend/src/components/SocialLoginButtons.jsx, frontend/src/utils/socialLogin.js y frontend/src/services/authService.js: carga segura, cancelación de consultas y reintento.
- frontend/src/pages/LoginPage.jsx: mensajes de error claros.
- frontend/tests/socialLogin.test.js: habilitación segura de botones.
- README.md, docs/CONFIGURAR_AUTH0.md, docs/REVISION_2026-10-18.md y este informe: estado y límites de la verificación.
