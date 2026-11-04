/**
 * Arranca el servidor HTTP y cierra el pool SQL en apagado ordenado. Resuelve
 * ejecucion backend y limpieza de recursos.
 *
 * Lectura guiada. Punto de arranque y apagado de Node.js. Usa la configuración validada
 * para escuchar; no es donde se escribe la lógica de formularios o consultas de usuarios.
 */
import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";
import { checkDatabase, databaseHelp } from "./services/databaseHealth.js";

// No anunciar un sistema listo cuando la base todavia no funciona.
let server;
try {
  await checkDatabase();
  server = app.listen(env.port, () => {
    console.log(`Interfaz: ${env.clientOrigins[0]}/login`);
    console.log(
      `API: http://localhost:${env.port}/api/health | MySQL conectado`,
    );
  });
  server.on("error", (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? `El puerto ${env.port} esta ocupado. Cerra la otra terminal del proyecto.`
        : "No se pudo iniciar la API.",
    );
    pool.end().finally(() => {
      process.exitCode = 1;
    });
  });
} catch (error) {
  console.error(databaseHelp(error));
  await pool.end();
  process.exitCode = 1;
}

const shutdown = async () => {
  server?.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Exporta: no named exports; it starts the HTTP server.
// Lo utilizan: npm run dev:server and npm start.
// Depende de: backend/app.js, backend/config/env.js, backend/config/db.js.
