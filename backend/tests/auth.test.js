// Requisitos 4/5/8: pruebas HTTP contra MySQL real, separado de datos de clase.
import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { createTestDatabase, mysqlReady } from "./testDatabase.js";

test(
  "Registro, privacidad, administracion y auditoria con MySQL",
  {
    skip: mysqlReady
      ? false
      : "Ejecuta npm run setup:local para habilitar esta suite.",
  },
  async (t) => {
    const database = await createTestDatabase();
    // Sobrescribe solo el entorno de este proceso; no edita .env del alumno.
    process.env.DATABASE_URL = database.url;
    process.env.JWT_SECRET = randomBytes(32).toString("hex");
    process.env.NODE_ENV = "test";
    process.env.EMAIL_TRANSPORT = "test";
    process.env.BCRYPT_SALT_ROUNDS = "4";
    const { default: app } = await import("../app.js");
    const { testOutbox } = await import("../services/mailService.js");
    const { pool } = await import("../config/db.js");
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(async () => {
      await new Promise((resolve) => server.close(resolve));
      await pool.end();
      await database.cleanup();
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const password = "PruebaSegura123!";
    const first = {
      email: "alumna@example.com",
      username: "alumna",
      displayName: "Alumna",
      password,
      confirmPassword: password,
    };

    async function request(
      route,
      { method = "GET", body, session, csrf = true, headers = {} } = {},
    ) {
      const response = await fetch(`${base}${route}`, {
        method,
        redirect: "manual",
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(session ? { Cookie: session.cookie } : {}),
          ...(session && csrf ? { "X-CSRF-Token": session.csrf } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      const data =
        response.headers.get("content-type")?.includes("application/json") &&
        text
          ? JSON.parse(text)
          : null;
      const cookies = response.headers.getSetCookie();
      return {
        status: response.status,
        data,
        headers: response.headers,
        session: {
          cookie: cookies.map((cookie) => cookie.split(";")[0]).join("; "),
          csrf: data?.csrfToken,
        },
        cookies,
      };
    }
    const login = (identifier, pass = password) =>
      request("/api/auth/login", {
        method: "POST",
        body: { identifier, password: pass },
      });
    const register = async (body) => {
      const registration = await request("/api/auth/register", {
        method: "POST",
        body,
      });
      if (registration.status !== 201) return registration;

      // Confirma el código del alta; en la demostración el alumno lo leería en Mailtrap.
      const mail = [...testOutbox]
        .reverse()
        .find(
          (message) =>
            message.to.toLowerCase() === body.email.trim().toLowerCase() &&
            message.purpose === "verify_email",
        );
      assert.ok(mail, "El registro debe emitir un codigo de verificacion");
      const verification = await request("/api/auth/codes/confirm", {
        method: "POST",
        body: {
          challengeId: registration.data.challengeId,
          code: mail.code,
          purpose: "verify_email",
        },
      });
      assert.equal(verification.status, 200);
      const authenticated = await login(body.username, body.password);
      return {
        ...authenticated,
        status: registration.status,
        registration,
      };
    };
    let alice, bob, admin;

    await t.test(
      "Health consulta tablas; raiz redirige; visitante no genera error",
      async () => {
        assert.equal((await request("/api/health")).data.database, "connected");
        assert.equal((await request("/")).status, 302);
        assert.equal((await request("/api/auth/session")).data.user, null);
        assert.equal((await request("/api/admin/users")).status, 401);
      },
    );

    await t.test(
      "Registro ignora rol admin enviado; guarda hash; cookies httpOnly",
      async () => {
        alice = await register({ ...first, role: "admin" });
        assert.equal(alice.status, 201);
        assert.equal(alice.data.user.role, "user");
        assert.ok(
          alice.cookies.every(
            (value) =>
              value.includes("HttpOnly") && value.includes("SameSite=Strict"),
          ),
        );
        const { rows } = await database.owner.query(
          "SELECT password_hash FROM users WHERE id = ?",
          [alice.data.user.id],
        );
        assert.notEqual(rows[0].password_hash, password);
        assert.ok(await bcrypt.compare(password, rows[0].password_hash));
        assert.ok(!JSON.stringify(alice.data).includes("passwordHash"));
        bob = await register({
          ...first,
          email: "otro@example.com",
          username: "otro",
        });
        assert.equal(bob.status, 201);
      },
    );

    await t.test(
      "Duplicados normalizados y validacion directa de API",
      async () => {
        const duplicate = await register({
          ...first,
          email: " ALUMNA@EXAMPLE.COM ",
          username: " ALUMNA ",
        });
        assert.equal(duplicate.status, 409);
        assert.deepEqual(
          duplicate.data.details.map((item) => item.field).sort(),
          ["email", "username"],
        );
        for (const invalid of [
          { username: "<script>" },
          { password: "debil" },
          { email: "invalido" },
          { confirmPassword: "distinta" },
          { password: `Aa1!${"a".repeat(73)}` },
          { password: { malicious: true } },
        ]) {
          assert.equal((await register({ ...first, ...invalid })).status, 422);
        }
      },
    );

    await t.test(
      "Usuario normal no lista cuentas ni auditoria, tampoco cambia otra cuenta",
      async () => {
        for (const route of ["/api/admin/users", "/api/admin/audit"])
          assert.equal(
            (await request(route, { session: alice.session })).status,
            403,
          );
        const update = await request("/api/users/me", {
          method: "PUT",
          session: alice.session,
          body: {
            ...first,
            displayName: "Mi perfil",
            id: bob.data.user.id,
            role: "admin",
          },
        });
        assert.equal(update.status, 200);
        assert.equal(update.data.user.id, alice.data.user.id);
        assert.equal(update.data.user.role, "user");
        assert.equal(
          (await request("/api/users/me", { session: bob.session })).data.user
            .displayName,
          "Alumna",
        );
        assert.equal(
          (
            await request(`/api/users/${bob.data.user.id}`, {
              session: alice.session,
            })
          ).status,
          404,
        );
      },
    );

    await t.test(
      "Vinculos OAuth se listan por usuario y state se consume una sola vez",
      async () => {
        const { createOAuthAccount } =
          await import("../models/oauthAccountModel.js");
        const { createOAuthState, consumeOAuthState } =
          await import("../models/oauthStateModel.js");
        await createOAuthAccount({
          userId: alice.data.user.id,
          provider: "github",
          providerUserId: "external-123",
          emailAtProvider: first.email,
        });
        const linked = await request("/api/users/me/oauth-accounts", {
          session: alice.session,
        });
        assert.equal(linked.status, 200);
        assert.equal(linked.data.accounts[0].provider, "github");

        const stateHash = randomBytes(32).toString("hex");
        await createOAuthState({
          stateHash,
          provider: "github",
          codeVerifier: "verifier",
          nonce: null,
          expiresAt: new Date(Date.now() + 60_000),
        });
        assert.equal(
          (await consumeOAuthState({ stateHash, provider: "github" }))
            .codeVerifier,
          "verifier",
        );
        assert.equal(
          await consumeOAuthState({ stateHash, provider: "github" }),
          null,
        );
      },
    );

    await t.test(
      "CSRF bloquea cambios y CORS rechaza origen ajeno",
      async () => {
        assert.equal(
          (
            await request("/api/users/me", {
              method: "PUT",
              session: alice.session,
              csrf: false,
              body: first,
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await request("/api/auth/session", {
              headers: { Origin: "https://ajeno.example" },
            })
          ).status,
          403,
        );
      },
    );

    await t.test(
      "Login generico y normalizacion de identificador",
      async () => {
        const existing = await login("alumna", "incorrecta");
        const missing = await login("no_existe", "incorrecta");
        assert.equal(existing.status, 401);
        assert.deepEqual(existing.data, missing.data);
        assert.equal((await login(" ALUMNA@EXAMPLE.COM ")).status, 200);
      },
    );

    await t.test(
      "Cambio de clave exige la actual y revoca otras sesiones",
      async () => {
        const otherSession = await login("alumna");
        const body = {
          currentPassword: "incorrecta",
          newPassword: "NuevaClave123!",
          confirmPassword: "NuevaClave123!",
        };
        assert.equal(
          (
            await request("/api/users/me/password", {
              method: "PATCH",
              session: alice.session,
              body,
            })
          ).status,
          400,
        );
        body.currentPassword = password;
        assert.equal(
          (
            await request("/api/users/me/password", {
              method: "PATCH",
              session: alice.session,
              body,
            })
          ).status,
          200,
        );
        assert.equal(
          (await request("/api/users/me", { session: otherSession.session }))
            .status,
          401,
        );
        assert.equal((await login("alumna", body.newPassword)).status, 200);
      },
    );

    await t.test(
      "Admin lista sin secretos y consulta actividad auditada",
      async () => {
        const { createUser } = await import("../models/userModel.js");
        await createUser({
          email: "admin@test.local",
          username: "admin",
          displayName: "Admin",
          passwordHash: await bcrypt.hash(password, 4),
          role: "admin",
          verified: true,
        });
        admin = await login("admin");
        const list = await request("/api/admin/users", {
          session: admin.session,
        });
        assert.equal(list.status, 200);
        assert.equal(list.data.total, 3);
        assert.ok(
          !/password|refreshToken|csrfToken/.test(JSON.stringify(list.data)),
        );
        const events = await request("/api/admin/audit?action=LOGIN_FAILURE", {
          session: admin.session,
        });
        assert.equal(events.status, 200);
        assert.ok(events.data.events.length >= 2);
        assert.ok(
          events.data.events.every((event) => event.action === "LOGIN_FAILURE"),
        );
        assert.equal(
          (
            await database.owner.query(
              "SELECT count(*) AS n FROM audit_logs WHERE action = 'ADMIN_VIEW_AUDIT'",
            )
          ).rows[0].n,
          1,
        );
      },
    );

    await t.test(
      "Admin no se bloquea; booleanos falsos se validan; baja revoca sesion",
      async () => {
        const change = (id, body) =>
          request(`/api/admin/users/${id}`, {
            method: "PATCH",
            session: admin.session,
            body,
          });
        assert.equal(
          (
            await change(admin.data.user.id.toUpperCase(), {
              role: "user",
              isActive: true,
            })
          ).status,
          400,
        );
        assert.equal(
          (await change(bob.data.user.id, { role: "user", isActive: "false" }))
            .status,
          422,
        );
        assert.equal(
          (await change(bob.data.user.id, { role: "user", isActive: false }))
            .status,
          200,
        );
        assert.equal((await login("otro")).status, 401);
        assert.equal(
          (await change(bob.data.user.id, { role: "user", isActive: true }))
            .status,
          200,
        );
        assert.equal(
          (await request("/api/users/me", { session: bob.session })).status,
          401,
        );
        bob = await login("otro");
        assert.equal(bob.status, 200);
      },
    );

    await t.test(
      "Dos refresh simultaneos: solo uno puede rotar el token",
      async () => {
        const results = await Promise.all(
          [1, 2].map(() =>
            request("/api/auth/refresh", {
              method: "POST",
              session: bob.session,
            }),
          ),
        );
        assert.deepEqual(
          results.map((result) => result.status).sort(),
          [200, 401],
        );
        bob.session = results.find((result) => result.status === 200).session;
        assert.equal(
          (
            await request("/api/auth/logout", {
              method: "POST",
              session: bob.session,
            })
          ).status,
          204,
        );
        assert.equal(
          (await request("/api/users/me", { session: bob.session })).status,
          401,
        );
      },
    );

    await t.test(
      "Rol SQL no administra motor ni puede alterar auditoria",
      async () => {
        const { rows } = await pool.query("SHOW GRANTS");
        assert.ok(
          rows.every(
            (row) =>
              !/GRANT ALL PRIVILEGES ON \*\.\*/i.test(
                Object.values(row).join(" "),
              ),
          ),
        );
        await assert.rejects(pool.query("DELETE FROM audit_logs WHERE false"), {
          code: "ER_TABLEACCESS_DENIED_ERROR",
        });
        await assert.rejects(
          pool.query("UPDATE audit_logs SET action = 'ALTERED' WHERE false"),
          { code: "ER_TABLEACCESS_DENIED_ERROR" },
        );
      },
    );

    await t.test(
      "Sin auditoria no se confirma un cambio administrativo",
      async () => {
        // Simula un fallo real de permisos solo dentro de la base temporal.
        await database.owner.query(
          `REVOKE INSERT ON ${database.name}.audit_logs FROM ${database.account}`,
        );
        try {
          const response = await request(
            `/api/admin/users/${alice.data.user.id}`,
            {
              method: "PATCH",
              session: admin.session,
              body: { role: "user", isActive: false },
            },
          );
          assert.equal(response.status, 500);
          assert.equal(
            (
              await database.owner.query(
                "SELECT is_active FROM users WHERE id = ?",
                [alice.data.user.id],
              )
            ).rows[0].is_active,
            true,
          );
        } finally {
          await database.owner.query(
            `GRANT INSERT ON ${database.name}.audit_logs TO ${database.account}`,
          );
        }
      },
    );

    await t.test(
      "Infraestructura SQL indisponible devuelve 503, no credenciales incorrectas",
      async () => {
        // Renombrar solo una tabla de la base temporal simula esquema no disponible.
        await database.owner.query(
          "ALTER TABLE users RENAME TO users_unavailable",
        );
        try {
          assert.equal((await request("/api/health")).status, 503);
          const response = await request("/api/users/me", {
            session: admin.session,
          });
          assert.equal(response.status, 503);
          assert.equal(response.data.details, null);
        } finally {
          await database.owner.query(
            "ALTER TABLE users_unavailable RENAME TO users",
          );
        }
      },
    );

    await t.test("Fuerza bruta recibe 429", async () => {
      let last;
      for (let index = 0; index < 9; index += 1)
        last = await login("desconocido", "incorrecta");
      assert.equal(last.status, 429);
      assert.ok(last.headers.has("retry-after"));
    });
  },
);

// Exporta: casos node:test. Consumido por npm test.
// Usa: testDatabase, Express real y pg; los datos temporales se eliminan al finalizar.
