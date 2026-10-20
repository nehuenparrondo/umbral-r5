/** Importación local única: conserva UUID, hashes y vínculos; no migra sesiones ni códigos. */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { localRoot } from "./mysqlPaths.js";
export async function importPreviousAccounts(connection) {
  const backup = path.join(localRoot, "migration-postgres-backup.json");
  if (!existsSync(backup)) return;
  const [[count]] = await connection.query(
    "SELECT COUNT(*) AS total FROM users",
  );
  if (count.total) return;
  const source = JSON.parse(await readFile(backup, "utf8"));
  const [roles] = await connection.query("SELECT id,name FROM roles");
  const roleIds = new Map(
    source.roles.map((role) => [
      role.id,
      roles.find((current) => current.name === role.name).id,
    ]),
  );
  await connection.beginTransaction();
  try {
    for (const table of ["users", "oauth_accounts", "audit_logs"]) {
      for (const original of source[table]) {
        const row = { ...original };
        delete row.email_normalized;
        delete row.username_normalized;
        if (table === "users") row.role_id = roleIds.get(row.role_id);
        if (table === "audit_logs") row.metadata = JSON.stringify(row.metadata);
        for (const key of Object.keys(row))
          if (key.endsWith("_at") && row[key]) row[key] = new Date(row[key]);
        const columns = Object.keys(row);
        if (columns.some((key) => !/^[a-z_]+$/.test(key)))
          throw new Error("Columna inesperada");
        await connection.query(
          `INSERT INTO \`${table}\` (${columns.map((key) => `\`${key}\``).join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
          Object.values(row),
        );
      }
    }
    await connection.commit();
    console.log(
      "Cuentas, contraseñas hasheadas y vínculos OAuth importados. Se requiere iniciar sesión nuevamente.",
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
