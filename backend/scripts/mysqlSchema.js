/** Aplica SQL propio y permisos mínimos sin depender del nombre de la base alojada. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./mysqlPaths.js";

export async function applyMySQLSchema(connection) {
  const sql = await readFile(
    path.join(projectRoot, "backend/db/schema.sql"),
    "utf8",
  );
  for (const statement of sql
    .replace(/^\s*--.*$/gm, "")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean)) {
    await connection.query(statement);
  }
}
export async function grantApplicationPrivileges(
  connection,
  database,
  username,
) {
  if (!/^[a-z0-9_]+$/.test(database) || !/^[a-z0-9_]+$/.test(username))
    throw new Error("Nombre SQL inválido.");
  const permissions = {
    roles: "SELECT",
    users: "SELECT, INSERT, UPDATE",
    user_sessions: "SELECT, INSERT, UPDATE, DELETE",
    oauth_accounts: "SELECT, INSERT, UPDATE, DELETE",
    oauth_identity_locks: "SELECT, INSERT, UPDATE",
    oauth_login_states: "SELECT, INSERT, UPDATE, DELETE",
    auth_challenges: "SELECT, INSERT, UPDATE, DELETE",
    audit_logs: "SELECT, INSERT",
  };
  for (const [table, privileges] of Object.entries(permissions)) {
    await connection.query(
      `GRANT ${privileges} ON \`${database}\`.\`${table}\` TO '${username}'@'localhost'`,
    );
  }
}
