/** Pool MySQL con consultas preparadas y transacciones reales. */
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";
import { env } from "./env.js";

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
export const query = (sql, params) => pool.query(sql, params);

export async function withTransaction(callback) {
  const connection = await driverPool.getConnection();
  const client = wrapMySQLConnection(connection);
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
