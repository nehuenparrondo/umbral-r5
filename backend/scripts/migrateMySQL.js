/** Crea el esquema en una base MySQL ya asignada, sin usar root en la API. */
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { applyMySQLSchema } from "./mysqlSchema.js";
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
const { mysqlConnectionOptions } = await import("../config/db.js");
const { env } = await import("../config/env.js");
const { pool } = await import("../config/db.js");
const url = process.env.DATABASE_MIGRATION_URL || env.databaseUrl;
let connection;
try {
  connection = await mysql.createConnection(
    mysqlConnectionOptions(url, {
      ssl: env.databaseSsl,
      ca: env.databaseSslCa,
    }),
  );
  await connection.query("SET time_zone = '+00:00'");
  await applyMySQLSchema(connection);
  console.log(
    "Esquema MySQL aplicado. No se eliminaron tablas ni cuentas existentes.",
  );
} catch {
  console.error(
    "No se pudo aplicar el esquema MySQL. Revisar conexión y permisos CREATE/ALTER de la cuenta de migración.",
  );
  process.exitCode = 1;
} finally {
  await connection?.end();
  await pool.end();
}
