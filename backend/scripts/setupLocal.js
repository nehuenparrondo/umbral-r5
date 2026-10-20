/** Prepara MySQL local sin modificar XAMPP, PostgreSQL anterior ni claves sociales. */
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import {
  projectRoot,
  localRoot,
  mysqlRoot,
  mysqlData,
  mysqlCredentialsPath,
} from "./mysqlPaths.js";
import { startLocalMySQL, localMySQLOptions } from "./localMySQL.js";
import { applyMySQLSchema, grantApplicationPrivileges } from "./mysqlSchema.js";
import { importPreviousAccounts } from "./importPreviousAccounts.js";
const execute = promisify(execFile);
const secret = () => randomBytes(24).toString("hex");
const envPath = path.join(projectRoot, "backend/.env");
async function main() {
  if (process.platform !== "win32")
    throw new Error(
      "Usar un servidor MySQL 8 externo y seguir docs/MYSQL_Y_HOSTING.md.",
    );
  const previous = existsSync(envPath) ? await readFile(envPath, "utf8") : "";
  const settings = dotenv.parse(previous);
  const localUrl = existsSync(mysqlCredentialsPath)
    ? JSON.parse(await readFile(mysqlCredentialsPath, "utf8"))
    : null;
  if (
    settings.DATABASE_URL?.startsWith("mysql:") &&
    settings.DATABASE_URL !== localUrl?.databaseUrl
  ) {
    throw new Error(
      "La configuración ya usa otra base MySQL; no se reemplaza.",
    );
  }
  if (
    settings.DATABASE_URL?.startsWith("postgres") &&
    !["127.0.0.1", "localhost"].includes(
      new URL(settings.DATABASE_URL).hostname,
    )
  ) {
    throw new Error("No se reemplaza automáticamente una conexión externa.");
  }
  await mkdir(localRoot, { recursive: true });
  const credentials = localUrl || {
    rootPassword: secret(),
    appPassword: secret(),
    rootConfigured: false,
  };
  credentials.databaseUrl ||= `mysql://umbral_r5_app:${credentials.appPassword}@127.0.0.1:3307/umbral_r5`;
  await writeFile(mysqlCredentialsPath, JSON.stringify(credentials, null, 2), {
    mode: 0o600,
  });
  if (!existsSync(path.join(mysqlRoot, "bin/mysqld.exe"))) {
    await execute(
      "powershell.exe",
      [
        "-NoProfile",
        "-File",
        path.join(projectRoot, "backend/scripts/downloadMySQL.ps1"),
      ],
      { windowsHide: true },
    );
  }
  if (!existsSync(path.join(mysqlData, "mysql.ibd"))) {
    await execute(
      path.join(mysqlRoot, "bin/mysqld.exe"),
      [
        "--no-defaults",
        "--initialize-insecure",
        `--basedir=${mysqlRoot}`,
        `--datadir=${mysqlData}`,
      ],
      { windowsHide: true },
    );
  }
  await startLocalMySQL({ bootstrap: !credentials.rootConfigured });
  if (!credentials.rootConfigured) {
    const bootstrap = await mysql.createConnection({
      ...localMySQLOptions(credentials),
      password: "",
    });
    try {
      await bootstrap.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [
        credentials.rootPassword,
      ]);
    } finally {
      await bootstrap.end();
    }
    credentials.rootConfigured = true;
    await writeFile(
      mysqlCredentialsPath,
      JSON.stringify(credentials, null, 2),
      { mode: 0o600 },
    );
  }
  const owner = await mysql.createConnection(localMySQLOptions(credentials));
  let needsAdmin = false;
  try {
    await owner.query(
      "CREATE DATABASE IF NOT EXISTS umbral_r5 CHARACTER SET utf8mb4 COLLATE utf8mb4_bin",
    );
    await owner.query("USE umbral_r5");
    await owner.query("SET time_zone = '+00:00'");
    await applyMySQLSchema(owner);
    await owner.query(
      "CREATE USER IF NOT EXISTS 'umbral_r5_app'@'localhost' IDENTIFIED BY ?",
      [credentials.appPassword],
    );
    await grantApplicationPrivileges(owner, "umbral_r5", "umbral_r5_app");
    await importPreviousAccounts(owner);
    const [[count]] = await owner.query("SELECT COUNT(*) AS total FROM users");
    needsAdmin = count.total === 0;
  } finally {
    await owner.end();
  }
  const values = {
    DATABASE_URL: credentials.databaseUrl,
    DATABASE_SSL: "false",
  };
  if (!settings.JWT_SECRET) values.JWT_SECRET = secret();
  if (needsAdmin) {
    credentials.adminPassword ||= `Aa1!${secret()}`;
    await writeFile(
      mysqlCredentialsPath,
      JSON.stringify(credentials, null, 2),
      { mode: 0o600 },
    );
    Object.assign(values, {
      ADMIN_EMAIL: settings.ADMIN_EMAIL || "admin@umbral.local",
      ADMIN_USERNAME: settings.ADMIN_USERNAME || "admin",
      ADMIN_PASSWORD: settings.ADMIN_PASSWORD || credentials.adminPassword,
      ADMIN_DISPLAY_NAME: settings.ADMIN_DISPLAY_NAME || "Administrador",
    });
  }
  const kept = previous
    .split(/\r?\n/)
    .filter(
      (line) => !Object.keys(values).some((key) => line.startsWith(key + "=")),
    );
  await writeFile(
    envPath,
    [
      ...kept,
      ...Object.entries(values).map(([key, value]) => key + "=" + value),
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  if (needsAdmin) {
    await execute(process.execPath, ["backend/scripts/createAdmin.js"], {
      cwd: projectRoot,
      windowsHide: true,
    });
  }
  await writeFile(
    path.join(localRoot, "ACCESOS-MYSQL.txt"),
    [
      "PRIVADO. No publicar ni entregar este archivo.",
      "MySQL: 127.0.0.1:3307 / umbral_r5 / umbral_r5_app",
      `Clave SQL: ${credentials.appPassword}`,
      ...(needsAdmin
        ? [
            `Admin inicial: ${values.ADMIN_USERNAME}`,
            `Clave inicial admin: ${values.ADMIN_PASSWORD}`,
          ]
        : ["Se conservaron las cuentas y contraseñas existentes."]),
      "Las claves iniciales no restauran contraseñas que ya hayan cambiado.",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  console.log(
    "MySQL 8.4 listo: esquema, usuario limitado y cuentas anteriores conservadas.",
  );
  console.log("OAuth y Mailtrap mantienen sus claves. Ejecutar npm run dev.");
}
main().catch(() => {
  console.error(
    "No se pudo preparar MySQL. Revisar .local/mysql.log, el puerto 3307 y docs/MYSQL_Y_HOSTING.md.",
  );
  process.exitCode = 1;
});
