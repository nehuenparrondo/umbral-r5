# Umbral · R5

## Entender el código paso a paso

- [Guía sencilla de funcionamiento](docs/LEER-EL-CODIGO.md): recorrido de los datos, guardado, pantallas y operaciones.
- [Mapa de archivos y funciones](docs/MAPA-ARCHIVOS-Y-FUNCIONES.md): enlaces al código y conexiones entre módulos.

Los comentarios dentro de los archivos explican las decisiones y efectos importantes en español. La documentación distingue ejecución normal, demo y límites pendientes; no contiene claves privadas.

Sistema de cuentas con **React + Vite en frontend/** y **Node.js + Express + MySQL en backend/**. Incluye registro con verificación, login tradicional y social, recuperación de contraseña, perfil, cambio de email y administración con auditoría.

La interfaz fue rediseñada con identidad propia: azul noche, lavanda y acentos menta; tipografía editorial, formularios consistentes y versiones móvil/escritorio. Se conserva el modo claro y la preferencia de tema.

## Abrir y probar en esta computadora

Usar Node.js 24 (versión verificada: 24.15.0) y npm. La recarga de Express usa
el modo watch nativo de Node, sin una dependencia adicional de nodemon.

La carpeta del repositorio es **R5/R5**, dentro de la carpeta indicada. Abrir una terminal allí:

```powershell
npm ci
npm run dev
```

Abrir **[http://localhost:5173/login](http://localhost:5173/login)** y mantener la terminal abierta. Ctrl+C detiene React y Express. Si PowerShell bloquea npm.ps1, usar npm.cmd o Símbolo del sistema; no cambiar políticas de seguridad.

- Primera instalación de MySQL local en Windows: `npm run setup:local`.
- Diagnóstico: `npm run doctor`. Comprueba tablas y rol SQL de mínimo privilegio.
- Accesos SQL e iniciales de una instalación nueva: archivo privado **.local/ACCESOS-MYSQL.txt**. No subirlo ni entregar las credenciales. En esta computadora se conservan las cuentas y contraseñas anteriores.
- La migración a MySQL conservó las dos cuentas, sus hashes, los tres vínculos sociales y la auditoría. La base anterior permanece intacta como respaldo; ya no se usa para ejecutar R5. Se invalidaron las sesiones y los códigos temporales para exigir un ingreso nuevo.
- [MySQL, FreeDB y publicación web](docs/MYSQL_Y_HOSTING.md): configuración actual y pasos pendientes de alojamiento.

## Estructura clara

```text
R5/
├── frontend/                 # Todo lo que ejecuta el navegador
│   ├── src/
│   │   ├── components/       # Controles, marco visual y formularios reutilizables
│   │   ├── pages/            # Acceso, registro, códigos, perfil y administración
│   │   ├── context/          # Sesión y tema
│   │   ├── hooks/            # Formularios, cooldown y acceso a contextos
│   │   ├── services/         # Cliente HTTP y adaptadores de /api
│   │   ├── styles/           # Tokens, base, marco, acceso, controles y paneles
│   │   └── utils/            # Validadores para respuesta inmediata
│   ├── public/              # Recursos públicos
│   ├── tests/               # Pruebas unitarias de validación
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example         # Solo variables públicas y proxy local
│   └── package.json
├── backend/                  # Todo lo que ejecuta Node.js
│   ├── controllers/         # Traducción entre HTTP y los servicios/modelos
│   ├── services/            # Correo, desafíos, tokens y OAuth/OIDC
│   ├── models/              # Consultas MySQL parametrizadas
│   ├── routes/              # Endpoints
│   ├── middlewares/         # Sesión, CSRF, roles, límites y errores
│   ├── validations/         # Validación autoritativa
│   ├── config/              # Entorno, conexión, cookies y proveedores
│   ├── db/                  # Esquema y permisos SQL
│   ├── scripts/             # Preparación y diagnóstico local
│   ├── tests/               # Integración aislada y contratos de OAuth
│   ├── .env                 # Privado; NO se versiona
│   ├── .env.example
│   ├── app.js               # Composición HTTP y distribución de producción
│   ├── server.js            # Inicio y apagado del servidor
│   └── package.json
├── docs/
├── .local/                  # Motor, datos y accesos privados; no es código entregable
├── package.json             # Orquestador: npm workspaces y comandos cómodos
└── package-lock.json        # Único lockfile para reproducir ambos paquetes
```

**El frontend no importa archivos del backend, no conoce SQL ni recibe secretos.** En desarrollo Vite redirige /api a Express. En producción Express puede servir exclusivamente la compilación pública frontend/dist.

## Configuración separada

| Archivo                  | Qué puede contener                                                       |
| ------------------------ | ------------------------------------------------------------------------ |
| backend/.env             | SQL, JWT, SMTP y secretos OAuth. Solo lo lee Node.js.                    |
| frontend/.env (opcional) | VITE_API_BASE_URL, API_PROXY_TARGET y FRONTEND_PORT. Nunca credenciales. |

Los ejemplos están junto al paquete correspondiente. No existe un .env compartido en la raíz. La API resuelve su archivo por su propia ubicación, no por el directorio actual de la terminal. Si se cambia el puerto API, ajustar backend/.env y el proxy de frontend/.env; registrar también los callbacks OAuth nuevos si corresponde.

`npm ci` se ejecuta en la raíz: npm workspaces instala las dependencias declaradas por cada paquete y puede compartir node_modules sin mezclar sus responsabilidades. No hace falta duplicar lockfiles.

## Comandos

| Comando desde la raíz | Propósito                                                |
| --------------------- | -------------------------------------------------------- |
| npm run dev           | Prepara la base local e inicia ambos paquetes            |
| npm run dev:client    | Solo Vite (5173)                                         |
| npm run dev:server    | Solo Express con recarga (4000)                          |
| npm run build         | Construye frontend/dist                                  |
| npm run lint          | Revisa frontend y backend con reglas separadas           |
| npm test              | Validadores, estructura, API/SQL y contratos OAuth       |
| npm run check:backend | Comprueba sintaxis del servidor                          |
| npm run doctor        | Verifica SQL y permisos                                  |
| npm run mail:check    | Verifica SMTP sin enviar correos                         |
| npm run oauth:check   | Verifica proveedores configurados y descubrimiento Auth0 |
| npm run setup:local   | Prepara MySQL local; crea admin solo en una base vacía   |
| npm run db:migrate    | Aplica el esquema MySQL en una base asignada             |
| npm run db:stop       | Detiene solo el MySQL local de esta copia                |

También se puede entrar en frontend y ejecutar npm run dev, o en backend y ejecutar npm run db:start y npm run dev. La configuración es independiente. El asistente instala MySQL Community 8.4.8 oficial solo dentro de .local y escucha en 127.0.0.1:3307, sin modificar XAMPP ni otros servicios. En otras plataformas se puede usar MySQL 8 externo configurando backend/.env.

## Funcionalidades preservadas

- Registro sin sesión hasta verificar el email; disponibilidad y duplicados normalizados.
- Login con contraseña, bloqueo por intentos y acceso por código.
- Recuperación de contraseña y cambio de email con desafíos de un solo uso.
- Edición del perfil propio y cambio de contraseña validando la actual.
- Roles, activación/baja lógica de cuentas y revocación de sesiones desde administración.
- Actividad auditada, paginación y filtros exclusivos para administradores.
- Sesiones en cookies httpOnly, refresh rotativo y protección CSRF en las mutaciones.
- Acceso social con Google y GitHub mediante Auth0 y Discord mediante OAuth directo. Solo habilitar las conexiones activas y probar cada proveedor con una cuenta real. [Preparación de Discord](docs/CONFIGURAR_DISCORD.md). No se simula un login ni se duplica Gmail como otro proveedor.

Los códigos reales de esta copia siguen usando el SMTP de **Mailtrap Sandbox** configurado, no un outbox expuesto. Las pruebas automatizadas usan un transporte de prueba y una base temporal separada; no envían correo real ni modifican la base de uso diario.

## Producción y entrega

1. Ejecutar npm ci, npm run lint, npm test y npm run build desde la raíz.
2. Configurar backend/.env con NODE_ENV=production, orígenes reales, SQL y secretos válidos.
3. Usar HTTPS y configurar cookies seguras; registrar callbacks OAuth exactos.
4. Ejecutar npm start. Express sirve frontend/dist y mantiene /api independiente.
5. No entregar node_modules, .local, .env, respaldos privados, credenciales ni compilaciones antiguas.

El archivo `render.yaml` prepara un servicio gratuito para frontend y API bajo el mismo dominio HTTPS. Requiere una base MySQL externa configurada, un repositorio autorizado y registrar los callbacks del dominio definitivo en Auth0 y Discord. **La aplicación local no equivale a un despliegue público terminado.** Ver [MYSQL_Y_HOSTING.md](docs/MYSQL_Y_HOSTING.md).

No ejecutar npm audit fix --force sin evaluar la compatibilidad. La auditoría de paquetes no equivale a las pruebas funcionales; consultar el informe de esta revisión.

## Documentación

- [Arquitectura y separación](docs/ARQUITECTURA.md).
- [Mapa de archivos](docs/MAPA_DE_ARCHIVOS.md).
- [Frontend](frontend/README.md) y [backend](backend/README.md).
- [Revisión y pruebas](docs/REVISION_2026-10-18.md).
- [Requisitos originales](docs/CUMPLIMIENTO_REQUERIMIENTOS.md).
- [Configuración Auth0](docs/CONFIGURAR_AUTH0.md).
- [Pruebas de usuarios y Mailtrap](docs/PRUEBAS_MANUALES_USUARIOS_Y_MAILTRAP.md).
