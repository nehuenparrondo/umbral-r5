/** Regresiones de la migración: MySQL real, estados de un uso y bloqueos concurrentes. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { createTestDatabase, mysqlReady } from "./testDatabase.js";

test(
  "MySQL conserva seguridad y concurrencia sin depender de PostgreSQL",
  {
    skip: mysqlReady ? false : "Preparar MySQL con npm run setup:local.",
  },
  async (context) => {
    const database = await createTestDatabase();
    Object.assign(process.env, {
      DATABASE_URL: database.url,
      DATABASE_SSL: "false",
      JWT_SECRET: randomBytes(32).toString("hex"),
      NODE_ENV: "test",
      EMAIL_TRANSPORT: "test",
    });
    const { pool, withTransaction, mysqlConnectionOptions } =
      await import("../config/db.js");
    const { createOAuthState, consumeOAuthState } =
      await import("../models/oauthStateModel.js");
    const { createUser } = await import("../models/userModel.js");
    const { issueChallenge, consumeChallenge } =
      await import("../services/challengeService.js");
    const { testOutbox } = await import("../services/mailService.js");
    context.after(async () => {
      await pool.end();
      await database.cleanup();
    });

    await context.test(
      "Motor MySQL real, tablas InnoDB y conexión parametrizada",
      async () => {
        const { rows } = await pool.query("SELECT VERSION() AS version");
        assert.match(rows[0].version, /^8\./);
        assert.doesNotMatch(rows[0].version, /mariadb/i);
        const tables = await pool.query(
          "SELECT ENGINE AS engine FROM information_schema.tables WHERE table_schema = DATABASE()",
        );
        assert.equal(tables.rows.length, 8);
        assert.ok(tables.rows.every((table) => table.engine === "InnoDB"));
        assert.throws(
          () => mysqlConnectionOptions("postgresql://invalid/unused"),
          /mysql:/,
        );
        const options = mysqlConnectionOptions(
          "mysql://persona:clave%40segura@db.example:3307/demo",
          { ssl: true },
        );
        assert.equal(options.password, "clave@segura");
        assert.equal(options.ssl.rejectUnauthorized, true);
        assert.equal(options.ssl.verifyIdentity, true);
        assert.equal(options.ssl.ca, undefined);
        const certificate = "certificado del proveedor para esta prueba";
        const customCaOptions = mysqlConnectionOptions(
          "mysql://persona:clave@db.example/demo",
          { ssl: true, ca: certificate },
        );
        assert.equal(customCaOptions.ssl.ca, certificate);
        assert.equal(customCaOptions.ssl.rejectUnauthorized, true);
        assert.equal(customCaOptions.ssl.verifyIdentity, true);
        assert.equal(
          mysqlConnectionOptions("mysql://persona:clave@localhost/demo", {
            ca: certificate,
          }).ssl,
          undefined,
        );
      },
    );

    await context.test(
      "Dos callbacks simultáneos consumen el estado exactamente una vez",
      async () => {
        const stateHash = randomBytes(32).toString("hex");
        await createOAuthState({
          stateHash,
          provider: "discord",
          codeVerifier: null,
          nonce: null,
          expiresAt: new Date(Date.now() + 60000),
        });
        const results = await Promise.all([
          consumeOAuthState({ stateHash, provider: "discord" }),
          consumeOAuthState({ stateHash, provider: "discord" }),
        ]);
        assert.equal(results.filter(Boolean).length, 1);
        assert.equal(
          await consumeOAuthState({ stateHash, provider: "discord" }),
          null,
        );
      },
    );

    await context.test(
      "La misma identidad OAuth serializa transacciones concurrentes",
      async () => {
        let active = 0;
        let maximum = 0;
        const action = () =>
          withTransaction(async (client) => {
            await client.lockIdentity("discord:identidad-de-prueba");
            active += 1;
            maximum = Math.max(maximum, active);
            await delay(40);
            active -= 1;
          });
        await Promise.all([action(), action()]);
        assert.equal(maximum, 1);
      },
    );

    await context.test(
      "Cinco códigos incorrectos invalidan el desafío, no cuatro",
      async () => {
        const user = await createUser({
          email: "limite@example.com",
          username: "limite",
          displayName: "Limite",
          passwordHash: null,
          verified: true,
        });
        const { challengeId } = await issueChallenge({
          userId: user.id,
          purpose: "reset_password",
          targetEmail: user.email,
        });
        const code = testOutbox.at(-1).code;
        const wrong = code === "000000" ? "111111" : "000000";
        for (let attempt = 1; attempt <= 5; attempt += 1) {
          await assert.rejects(
            consumeChallenge(
              { challengeId, purpose: "reset_password", code: wrong },
              async () => assert.fail("No debe validar un código incorrecto"),
            ),
          );
          const { rows } = await pool.query(
            "SELECT attempts,consumed_at FROM auth_challenges WHERE id = ?",
            [challengeId],
          );
          assert.equal(rows[0].attempts, attempt);
          assert.equal(Boolean(rows[0].consumed_at), attempt === 5);
        }
        await assert.rejects(
          consumeChallenge(
            { challengeId, purpose: "reset_password", code },
            async () => assert.fail("No debe recuperar un desafío invalidado"),
          ),
        );
      },
    );
  },
);
