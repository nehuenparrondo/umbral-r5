# Arquitectura de R5: dos paquetes, un contrato HTTP

## Separación física y de dependencias

frontend y backend tienen su propio package.json, configuración ESLint y README.
La raíz es un orquestador npm workspaces: comparte instalación y lockfile, no código
de ejecución. React y los iconos solo están declarados en frontend; Express, mysql2,
bcrypt, correo y tokens solo en backend.

El flujo es **navegador → /api → Express → MySQL**. Los servicios del navegador
no importan controladores ni modelos. El backend no importa componentes React.

## Desarrollo y producción

En desarrollo Vite sirve la interfaz y redirige /api con un proxy. Esto conserva
el origen del navegador y las cookies existentes, sin publicar SQL en la red.
Los puertos originales 5173/4000 y los callbacks OAuth se conservaron.

En producción Vite construye frontend/dist y Express sirve esa carpeta pública.
Las rutas de API mantienen prioridad y errores JSON; el fallback SPA solo sirve
las rutas de navegación. No se expone el directorio backend.

## Variables de entorno

- backend/config/env.js resuelve ../.env desde su propia ubicación.
- frontend/vite.config.js resuelve únicamente el entorno de frontend.
- Los secretos permanecen en backend/.env. Ningún campo público los necesita.
- frontend/.env.example contiene solo base URL, destino de proxy y puerto.
- Los scripts de preparación también escriben exclusivamente backend/.env.

## Presentación modular

AuthLayout aporta textos e ilustración decorativa según el recorrido público.
Las páginas conservan su estado, servicios y validadores. AppShell solo organiza
el marco y la navegación visible; ProtectedRoute no sustituye la autorización real.

El estilo se reparte por responsabilidad:

| Archivo       | Responsabilidad                                                 |
| ------------- | --------------------------------------------------------------- |
| tokens.css    | Colores semánticos, temas, radios y tipografía                  |
| base.css      | Lectura, selección, foco, enlace de salto y movimiento reducido |
| shell.css     | Marca, navegación, ancho global y pie                           |
| auth.css      | Composición pública, ilustración y acceso social                |
| forms.css     | Entradas, botones, mensajes y medidor de contraseña             |
| dashboard.css | Perfil, administración, tablas y paginación                     |
| global.css    | Índice de importaciones, sin reglas duplicadas                  |

TextField conserva el contrato accesible y añade iconos sin mezclar validación.
Button sigue centralizando disabled/loading. Los mensajes son integrados en la
interfaz; no se suprimen errores de red ni se simulan respuestas correctas.

## Datos locales y respaldo

La versión actual usa MySQL Community 8.4.8. Se conservaron UUID, hashes de contraseña,
roles, identidades sociales y auditoría al migrar. Las sesiones y códigos anteriores
no se trasladan: se exige iniciar sesión de nuevo. El motor anterior ya no forma
parte de las dependencias ni del arranque. Ver [MYSQL_Y_HOSTING.md](MYSQL_Y_HOSTING.md).

Como antecedente histórico de la primera revisión:

La base incluida no pudo iniciar por un registro de checkpoint inválido.
Con autorización del usuario, se preservó la carpeta completa en
.local/postgres-data-respaldo-2026-10-18 y se inicializó una base nueva para probar.
No se usó pg_resetwal, no se intentó una reparación destructiva y no se
sobrescribieron los archivos anteriores. Las credenciales privadas y datos locales
siguen excluidos de Git y de la entrega.

## Qué se conserva

Se conservan endpoints, políticas de contraseña, validación autoritativa, roles,
auditoría, emisión de correo y flujo OAuth. Modelos, esquema, driver y scripts usan
SQL nativo de MySQL. app.js sirve frontend/dist; env.js y setupLocal.js resuelven backend/.env.
Las suites existentes de integración se ejecutan también desde el workspace backend.
