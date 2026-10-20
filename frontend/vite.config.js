/**
 * Desarrollo independiente: Vite solo lee variables de frontend/.
 * /api se redirige a Express para conservar cookies y las rutas existentes.
 * Los secretos de backend/.env no se cargan ni se incorporan al bundle.
 */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const settings = loadEnv(mode, frontendRoot, "");
  return {
    plugins: [react()],
    server: {
      host: "localhost",
      port: Number(settings.FRONTEND_PORT) || 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: settings.API_PROXY_TARGET || "http://127.0.0.1:4000",
          changeOrigin: true,
        },
      },
    },
  };
});
