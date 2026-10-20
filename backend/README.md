# Backend · API R5

Node.js + Express + MySQL 8 mediante `mysql2`. Conserva los contratos de la aplicación:
autenticación, códigos, perfil, administración, auditoría y OAuth/OIDC.
React no participa en estas decisiones.

## Ejecutar

Instalar con npm ci desde la raíz. Desde esta carpeta:

```powershell
npm run db:start
npm run dev
npm run doctor
npm test
```

El entorno se lee de backend/.env por una ruta absoluta derivada del módulo.
La recarga de desarrollo utiliza node --watch con Node.js 24; las dependencias
vulnerables de nodemon se retiraron sin cambiar la lógica de la API.
No depende de dónde esté abierta la terminal. Usar .env.example como referencia,
sin publicar el archivo real. Los scripts de MySQL guardan datos privados
en .local del repositorio; no deben copiarse a frontend/public.

## Flujo de una petición

1. app.js instala cabeceras, CORS, JSON, cookies y rutas.
2. middlewares comprueban sesión, CSRF, rol, límites y validación.
3. controllers traducen la petición a operaciones de services/models.
4. models ejecutan consultas preparadas con `?` dentro de MySQL/InnoDB.
5. Los errores pasan por un manejador central sin devolver secretos.

server.js comprueba la base antes de escuchar y cierra recursos al apagarse.
En producción app.js sirve solo ../frontend/dist; /api desconocidas siguen
devolviendo un 404 JSON, no el HTML de React.

## Límites de seguridad y pruebas

- La cuenta SQL de la aplicación no es propietaria ni administradora.
- Los códigos no se guardan legibles: se validan con HMAC, caducidad e intentos.
- La bandeja testOutbox solo existe para NODE_ENV=test y EMAIL_TRANSPORT=test.
- Las pruebas de integración crean y eliminan exclusivamente una base temporal
  de nombre generado; nunca vacían la base diaria.
- La baja disponible en la consigna es lógica (isActive), revoca sesiones y se audita.
- mail:check verifica autenticación SMTP sin enviar mensajes.
- Los tests de OAuth validan contratos y decisiones locales; no reemplazan un
  ingreso real interactivo con una cuenta de cada proveedor.

La migración a MySQL conserva las reglas de negocio, políticas de claves, desafíos,
cookies y endpoints. Se reemplazaron el driver, el esquema, las consultas, los bloqueos
y los errores SQL específicos del motor anterior. `db.js` mantiene una interfaz común
de resultados y transacciones, sin traducir SQL de otro dialecto en tiempo de ejecución.

Las filas de `oauth_identity_locks` serializan el alta/vinculación social mediante
bloqueos InnoDB dentro de la misma transacción. El consumo de estado OAuth usa
`SELECT ... FOR UPDATE` y no admite dos callbacks concurrentes con el mismo estado.
Consultar [MySQL y hosting](../docs/MYSQL_Y_HOSTING.md).
