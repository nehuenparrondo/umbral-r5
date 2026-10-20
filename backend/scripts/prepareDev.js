/** Valida MySQL antes de iniciar los dos paquetes. */
import { startLocalMySQL } from "./localMySQL.js";
try {
  const { env } = await import("../config/env.js");
  const url = new URL(env.databaseUrl);
  if (["localhost", "127.0.0.1"].includes(url.hostname) && url.port === "3307")
    await startLocalMySQL();
  const { checkDatabase } = await import("../services/databaseHealth.js");
  const { pool } = await import("../config/db.js");
  try {
    await checkDatabase();
    console.log("MySQL listo. Abrir http://localhost:5173/login.");
  } finally {
    await pool.end();
  }
} catch {
  console.error(
    "No se pudo preparar MySQL. Ejecutar npm run setup:local y npm run doctor.",
  );
  process.exitCode = 1;
}
