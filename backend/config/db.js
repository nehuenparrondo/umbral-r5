/** Pool MySQL con consultas preparadas y transacciones reales.
 *
 * Lectura guiada. Pool MySQL y adaptador del resultado de las consultas. Usa parámetros y
 * transacciones; la base puede estar en Aiven con TLS o en la configuración local, sin
 * cambiar los modelos.
 */
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";
import { env } from "./env.js";

/**
 * Convierte DATABASE_URL en opciones de mysql2: decodifica usuario, clave y base, y fija
 * UTC/utf8mb4.
 * Si se solicita TLS, exige certificado e identidad válidos; los problemas de URL/configuración se
 * propagan al arranque.
 */
export function mysqlConnectionOptions(databaseUrl, { ssl = false, ca = "" } = {}) {
  const url = new URL(databaseUrl);
  if (url.protocol !== "mysql:")
    throw new Error("DATABASE_URL debe usar mysql://.");
  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)) || undefined,
    charset: "utf8mb4",
    timezone: "Z",
    connectTimeout: 10000,
    decimalNumbers: true,
    supportBigNumbers: true,
    ...(ssl
      ? {
          ssl: {
            rejectUnauthorized: true,
            verifyIdentity: true,
            ...(ca ? { ca } : {}),
          },
        }
      : {}),
  };
}

/**
 * Adapta una conexión o pool de mysql2 a query(sql, params). Los valores se envían separados del
 * SQL mediante execute.
 * Las lecturas devuelven {rows, rowCount}; las escrituras agregan insertId y usan affectedRows.
 * También convierte las columnas booleanas conocidas. Este formato de resultado sigue consultando
 * MySQL.
 */
export function wrapMySQLConnection(connection) {
  return {
    async query(sql, params = []) {
      const [result] = await connection.execute(sql, params);
      if (!Array.isArray(result))
        return {
          rows: [],
          rowCount: result.affectedRows,
          insertId: result.insertId,
        };
      const rows = result.map((row) => {
        for (const field of ["isActive", "is_active", "hasPassword"]) {
          if (field in row) row[field] = Boolean(row[field]);
        }
        return row;
      });
      return { rows, rowCount: rows.length };
    },
  };
}

const driverPool = mysql.createPool({
  ...mysqlConnectionOptions(env.databaseUrl, {
    ssl: env.databaseSsl,
    ca: env.databaseSslCa,
  }),
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 30000,
  enableKeepAlive: true,
});
driverPool.on("connection", (connection) =>
  connection.query("SET time_zone = '+00:00'"),
);
export const pool = {
  ...wrapMySQLConnection(driverPool),
  end: () => driverPool.end(),
};
/**
 * Ejecuta una consulta parametrizada mediante el pool compartido y devuelve su resultado adaptado.
 * Para varias escrituras atómicas usar el client de withTransaction: llamadas sueltas al pool
 * pueden tomar conexiones distintas.
 */
export const query = (sql, params) => pool.query(sql, params);

/**
 * Entrega una conexión a una operación y coordina commit/rollback y liberación. Todas sus
 * consultas deben usar ese client para pertenecer a la misma transacción.
 * Devuelve el resultado del callback tras commit; ante error hace rollback y lo propaga.
 * finally devuelve siempre la conexión al pool, tanto si se confirmó como si falló.
 */
export async function withTransaction(callback) {
  const connection = await driverPool.getConnection();
  const client = wrapMySQLConnection(connection);
  /**
   * Serializa altas/vinculaciones OAuth que comparten identidad o email, incluso si aún
   * no hay usuario que bloquear. Inserta una clave hash estable y toma FOR UPDATE;
   * el bloqueo se libera al confirmar o revertir esta misma transacción.
   */
  client.lockIdentity = async (identity) => {
    const key = createHash("sha256").update(identity).digest("hex");
    await client.query(
      "INSERT IGNORE INTO oauth_identity_locks (lock_key) VALUES (?)",
      [key],
    );
    await client.query(
      "SELECT lock_key FROM oauth_identity_locks WHERE lock_key = ? FOR UPDATE",
      [key],
    );
  };
  try {
    await connection.beginTransaction();
    const result = await callback(client);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
