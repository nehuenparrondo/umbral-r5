/** Contrato de separación: impide volver a mezclar código, paquetes o secretos. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { projectRoot } from "../scripts/localPaths.js";

const readPackage = (folder) =>
  JSON.parse(
    readFileSync(path.join(projectRoot, folder, "package.json"), "utf8"),
  );

test("Dos paquetes explícitos con un orquestador y lockfile reproducible", () => {
  const workspace = readPackage("");
  assert.deepEqual(workspace.workspaces, ["frontend", "backend"]);
  assert.equal(readPackage("frontend").name, "@r5/frontend");
  assert.equal(readPackage("backend").name, "@r5/backend");
  assert.ok(existsSync(path.join(projectRoot, "package-lock.json")));
  assert.ok(existsSync(path.join(projectRoot, "frontend", "index.html")));
  assert.equal(existsSync(path.join(projectRoot, "src")), false);
});

test("La interfaz no declara dependencias privadas del servidor", () => {
  const frontend = readPackage("frontend");
  for (const dependency of [
    "express",
    "mysql2",
    "bcrypt",
    "jsonwebtoken",
    "nodemailer",
    "jose",
  ]) {
    assert.equal(frontend.dependencies[dependency], undefined);
  }
});

test("La API no declara dependencias visuales de React", () => {
  const backend = readPackage("backend");
  for (const dependency of [
    "react",
    "react-dom",
    "react-router-dom",
    "lucide-react",
  ]) {
    assert.equal(backend.dependencies[dependency], undefined);
  }
});

test("El ejemplo de entorno público no contiene claves privadas", () => {
  const publicEnvironment = readFileSync(
    path.join(projectRoot, "frontend", ".env.example"),
    "utf8",
  );
  assert.doesNotMatch(
    publicEnvironment,
    /^(DATABASE_URL|JWT_SECRET|SMTP_PASSWORD|AUTH0_CLIENT_SECRET)=/m,
  );
  assert.ok(existsSync(path.join(projectRoot, "backend", ".env.example")));
});
