# Verificacion local (16 de septiembre de 2026)

## Fallos reproducidos

- PostgreSQL inexistente en 5432: `ECONNREFUSED` al registrar/iniciar sesion.
- Raiz de API sin ruta en desarrollo: 404 al abrir `localhost:4000/`.
- Errores internos repetidos y ausencia de una comprobacion SQL al arrancar.

## Correcciones comprobadas

- PostgreSQL 17.11 local con SCRAM, tablas reales, claves aleatorias y rol SQL limitado.
- `/api/health` responde `database: connected` tras consultar las tablas.
- `/` de Express redirige al login de React en desarrollo.
- Sesion inicial de visitante sin 401 innecesarios ni refresh en bucle.
- Gestion de cuentas y actividad en componentes separados y rutas solo para admin.
- Transacciones de cambios sensibles y auditoria; baja de cuenta revoca sesiones.
- Limite bcrypt de 72 bytes; control de refresh concurrente; booleanos JSON estrictos.
- Errores de infraestructura diferenciados de errores de credenciales.

## Pruebas automatizadas

`npm test` usa una base temporal `r3_test_<id>` y la elimina al finalizar.
Los casos prueban la API mediante HTTP real y el motor PostgreSQL local.
Incluyen registro, hash, duplicados, entradas invalidas, privacidad del perfil,
rol, CSRF, CORS, cambio de clave, revocacion, auditoria, privilegios SQL,
rotacion simultanea y limite de intentos. La prueba de rollback provoca un
fallo de permisos deliberado; su mensaje de error interno es esperado.

`npm run lint` y `npm run build` verifican reglas de codigo y compilacion.

## Navegador

Verificado con Playwright y Edge en 1440x900, 768x1024 y 390x844:
login, registro con errores, registro correcto, perfil, restricciones de usuario,
login de ambos roles, listado admin, actividad filtrada y persistencia del tema.
Sin errores JavaScript ni errores de consola en esos recorridos normales.
Las tablas anchas usan desplazamiento horizontal dentro de su contenedor.
Capturas locales en `.local/verification`, fuera del repositorio.

Se creo una cuenta normal de demostracion. Sus datos estan en
`.local/CUENTA-DEMO.txt`. El administrador inicial esta en
`.local/ACCESOS-LOCALES.txt`. Ambos archivos son privados y no se entregan.

## Alcance

Estas pruebas no sustituyen una auditoria de seguridad de produccion.
No se probaron despliegues HTTPS, correo/MFA ni multiples instancias distribuidas.
No se afirma que el sistema tenga la infraestructura o protecciones de Google.

<!-- Exporta: evidencia y alcance de pruebas. Consumido por el alumno/profesor. -->
<!-- Usa: resultados locales de npm, pruebas HTTP y comprobaciones de navegador. -->

# Versión vigente: MySQL

El contenido siguiente es un registro histórico. La versión actual usa MySQL 8, con 61 pruebas aprobadas y los tres proveedores sociales verificados nuevamente. Seguir [MYSQL_Y_HOSTING.md](MYSQL_Y_HOSTING.md) para instalar o publicar; no usar las instrucciones antiguas de PostgreSQL.
