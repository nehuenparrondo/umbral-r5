# Frontend · Umbral R5

Interfaz React con Vite. Contiene únicamente presentación, navegación, validación
inmediata y comunicación HTTP. No importa código de backend ni usa credenciales
SQL, SMTP, JWT o secretos OAuth.

## Ejecutar

Instalar con npm ci desde la raíz del repositorio. Después, desde esta carpeta:

```powershell
npm run dev
npm run lint
npm test
npm run build
```

Vite abre http://localhost:5173 y redirige /api a http://127.0.0.1:4000. Express
debe estar iniciado. La salida de producción queda en frontend/dist.

## Responsabilidades

- App define rutas; ProtectedRoute organiza el acceso visual según la sesión.
- AppShell compone navegación, tema y pie; no valida permisos de API.
- AuthLayout es el panel editorial reutilizado por acceso, registro y códigos.
- pages conservan los formularios y estados existentes, sin lógica SQL.
- services/apiClient gestiona cookies, CSRF y un refresh compartido entre peticiones.
- hooks/useForm centraliza envío/errores; useCooldown limpia su temporizador.
- styles/global.css importa seis capas: tokens, base, shell, auth, forms y dashboard.
- tests verifica los contratos de los validadores con node:test.

El tema predeterminado es oscuro; una preferencia guardada clara se respeta.
Si el navegador bloquea localStorage, el tema sigue funcionando en memoria.
Los formularios no se reemplazaron por demostraciones: siguen consumiendo la API real.

## Configuración y accesibilidad

frontend/.env es opcional y solo admite configuración pública como en .env.example.
Vite no carga backend/.env. No copiar secretos bajo prefijos VITE_.

Los campos conservan label/id, ayudas y aria-invalid; las contraseñas admiten
mostrar/ocultar. Hay enlace de salto al contenido, foco visible, estilos de carga
y movimiento reducido. En móvil se simplifica la ilustración, no los formularios.
Las tablas privadas se desplazan dentro de su contenedor sin ampliar la página.
