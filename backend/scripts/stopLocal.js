import { stopLocalMySQL } from "./localMySQL.js";
try {
  await stopLocalMySQL();
  console.log("MySQL local detenido.");
} catch {
  console.error("No se pudo detener MySQL local. Revisar .local/mysql.log.");
  process.exitCode = 1;
}
