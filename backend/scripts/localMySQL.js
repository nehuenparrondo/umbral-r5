/** Inicia MySQL Community oficial solo en localhost y no modifica servicios externos. */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { setTimeout as delay } from "node:timers/promises";
import {
  mysqlRoot,
  mysqlData,
  mysqlCredentialsPath,
  mysqlPort,
  localRoot,
} from "./mysqlPaths.js";

export async function readMySQLCredentials() {
  return JSON.parse(await readFile(mysqlCredentialsPath, "utf8"));
}
export function localMySQLOptions(credentials, database) {
  return {
    host: "127.0.0.1",
    port: mysqlPort,
    user: "root",
    password: credentials.rootPassword,
    database,
    timezone: "Z",
    connectTimeout: 2000,
  };
}
export async function startLocalMySQL({ bootstrap = false } = {}) {
  if (!existsSync(path.join(mysqlData, "mysql.ibd"))) return false;
  const credentials = await readMySQLCredentials();
  const options = localMySQLOptions(credentials);
  if (bootstrap) options.password = "";
  const ping = async () => {
    const connection = await mysql.createConnection(options);
    try {
      const [[row]] = await connection.query(
        "SELECT @@datadir AS dataDirectory",
      );
      if (
        path.resolve(row.dataDirectory).toLowerCase() !==
        path.resolve(mysqlData).toLowerCase()
      ) {
        const error = new Error(
          "El puerto pertenece a otra instalación MySQL; no se modifica.",
        );
        error.code = "R5_FOREIGN_MYSQL";
        throw error;
      }
    } finally {
      await connection.end();
    }
  };
  try {
    await ping();
    return true;
  } catch (error) {
    if (["ER_ACCESS_DENIED_ERROR", "R5_FOREIGN_MYSQL"].includes(error.code))
      throw error;
  }
  const child = spawn(
    path.join(mysqlRoot, "bin", "mysqld.exe"),
    [
      "--no-defaults",
      `--basedir=${mysqlRoot}`,
      `--datadir=${mysqlData}`,
      `--port=${mysqlPort}`,
      "--bind-address=127.0.0.1",
      "--mysqlx=OFF",
      `--log-error=${path.join(localRoot, "mysql.log")}`,
      `--pid-file=${path.join(localRoot, "mysql.pid")}`,
    ],
    { detached: true, windowsHide: true, stdio: "ignore" },
  );
  let launchError;
  child.once("error", (error) => {
    launchError = error;
  });
  child.unref();
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (launchError) throw launchError;
    try {
      await ping();
      return true;
    } catch (error) {
      if (["ER_ACCESS_DENIED_ERROR", "R5_FOREIGN_MYSQL"].includes(error.code))
        throw error;
      await delay(500);
    }
  }
  throw new Error(
    "MySQL no inició. Revisar .local/mysql.log y el puerto 3307.",
  );
}
export async function stopLocalMySQL() {
  if (!existsSync(mysqlCredentialsPath)) return;
  const connection = await mysql.createConnection(
    localMySQLOptions(await readMySQLCredentials()),
  );
  try {
    const [[row]] = await connection.query("SELECT @@datadir AS dataDirectory");
    if (
      path.resolve(row.dataDirectory).toLowerCase() !==
      path.resolve(mysqlData).toLowerCase()
    )
      throw new Error("No se detiene un servidor ajeno.");
    await connection.query("SHUTDOWN");
  } finally {
    await connection.end();
  }
}
