/** Cada suite usa su propia base y cuenta MySQL, nunca los datos del trabajo. */
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { mysqlCredentialsPath, mysqlData } from "../scripts/mysqlPaths.js";
import {
  readMySQLCredentials,
  startLocalMySQL,
  localMySQLOptions,
} from "../scripts/localMySQL.js";
import {
  applyMySQLSchema,
  grantApplicationPrivileges,
} from "../scripts/mysqlSchema.js";
export const mysqlReady =
  existsSync(mysqlCredentialsPath) &&
  existsSync(path.join(mysqlData, "mysql.ibd"));
export async function createTestDatabase() {
  await startLocalMySQL();
  const credentials = await readMySQLCredentials();
  const name = "r5_test_" + randomBytes(6).toString("hex");
  const username = name + "_app";
  const password = randomBytes(24).toString("hex");
  const connection = await mysql.createConnection(
    localMySQLOptions(credentials),
  );
  await connection.query(
    "CREATE DATABASE " + name + " CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
  );
  await connection.query("USE " + name);
  await connection.query("SET time_zone = '+00:00'");
  await applyMySQLSchema(connection);
  await connection.query(
    `CREATE USER '${username}'@'localhost' IDENTIFIED BY ?`,
    [password],
  );
  await grantApplicationPrivileges(connection, name, username);
  return {
    name,
    account: `'${username}'@'localhost'`,
    owner: {
      async query(sql, params = []) {
        const [rows] = await connection.query(sql, params);
        if (Array.isArray(rows))
          for (const row of rows)
            if ("is_active" in row) row.is_active = Boolean(row.is_active);
        return {
          rows,
          rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows,
        };
      },
    },
    url: `mysql://${username}:${password}@127.0.0.1:3307/${name}`,
    async cleanup() {
      if (!/^r5_test_[a-f0-9]{12}$/.test(name))
        throw new Error("Nombre temporal inválido");
      try {
        await connection.query("DROP DATABASE " + name);
        await connection.query(`DROP USER '${username}'@'localhost'`);
      } finally {
        await connection.end();
      }
    },
  };
}
