/** Prueba la distribución pública con MySQL y el mismo servidor Express de producción. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { projectRoot } from "../scripts/mysqlPaths.js";
import { createTestDatabase, mysqlReady } from "./testDatabase.js";

test(
  "Distribución de producción con frontend y API bajo un mismo origen",
  {
    skip:
      mysqlReady &&
      existsSync(path.join(projectRoot, "frontend/dist/index.html"))
        ? false
        : "Ejecutar setup:local y build antes de esta prueba.",
  },
  async (context) => {
    const database = await createTestDatabase();
    Object.assign(process.env, {
      DATABASE_URL: database.url,
      DATABASE_SSL: "false",
      NODE_ENV: "production",
      JWT_SECRET: randomBytes(32).toString("hex"),
      COOKIE_SECURE: "true",
      CLIENT_ORIGIN: "https://example.test",
      SERVER_ORIGIN: "https://example.test",
    });
    const { default: app } = await import("../app.js");
    const { pool } = await import("../config/db.js");
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    context.after(async () => {
      await new Promise((resolve) => server.close(resolve));
      await pool.end();
      await database.cleanup();
    });
    const base = `http://127.0.0.1:${server.address().port}`;

    await context.test(
      "React se sirve en la raíz y en rutas profundas con recursos y cabeceras",
      async () => {
        for (const route of ["/", "/login", "/perfil", "/recuperar"]) {
          const response = await fetch(base + route);
          assert.equal(response.status, 200);
          assert.match(response.headers.get("content-type"), /text\/html/);
          assert.ok(response.headers.has("content-security-policy"));
          const html = await response.text();
          assert.match(html, /<div id="root">/);
          if (route === "/") {
            const script = html.match(/src="([^"]+\.js)"/)[1];
            const asset = await fetch(base + script);
            assert.equal(asset.status, 200);
            assert.match(asset.headers.get("content-type"), /javascript/);
          }
        }
      },
    );

    await context.test(
      "Health comprueba MySQL y una API inexistente no devuelve el HTML",
      async () => {
        const health = await fetch(base + "/api/health");
        assert.equal(health.status, 200);
        assert.deepEqual(await health.json(), {
          status: "ok",
          database: "connected",
        });
        const missing = await fetch(base + "/api/no-existe");
        assert.equal(missing.status, 404);
        assert.match(missing.headers.get("content-type"), /application\/json/);
      },
    );

    await context.test(
      "Los archivos privados y el código del servidor no se publican",
      async () => {
        for (const route of [
          "/backend/.env",
          "/.local/mysql-credentials.json",
          "/backend/config/db.js",
        ]) {
          const response = await fetch(base + route);
          assert.match(response.headers.get("content-type"), /text\/html/);
          assert.match(await response.text(), /<div id="root">/);
        }
      },
    );
  },
);
