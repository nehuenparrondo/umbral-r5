/**
 * Recorridos de correo y recuperación contra MySQL temporal y transporte
 * de prueba. No modifica cuentas diarias ni envía mensajes a Mailtrap real.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { createTestDatabase, mysqlReady } from "./testDatabase.js";

test(
  "Verificación, recuperación, cambio de email y desbloqueo completos",
  {
    skip: mysqlReady ? false : "Preparar MySQL con npm run setup:local.",
  },
  async (context) => {
    const database = await createTestDatabase();
    process.env.DATABASE_URL = database.url;
    process.env.JWT_SECRET = randomBytes(32).toString("hex");
    process.env.NODE_ENV = "test";
    process.env.EMAIL_TRANSPORT = "test";
    process.env.BCRYPT_SALT_ROUNDS = "4";
    const { default: app } = await import("../app.js");
    const { pool } = await import("../config/db.js");
    const { testOutbox } = await import("../services/mailService.js");
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    context.after(async () => {
      await new Promise((resolve) => server.close(resolve));
      await pool.end();
      await database.cleanup();
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const account = {
      email: "recorrido@example.com",
      username: "recorrido",
      password: "PruebaSegura123!",
    };
    let session;
    let currentPassword = account.password;

    async function request(
      route,
      { method = "GET", body, authenticated = false } = {},
    ) {
      const response = await fetch(base + route, {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(authenticated
            ? { Cookie: session.cookie, "X-CSRF-Token": session.csrf }
            : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = response.status === 204 ? null : await response.json();
      return {
        status: response.status,
        data,
        session: {
          cookie: response.headers
            .getSetCookie()
            .map((cookie) => cookie.split(";")[0])
            .join("; "),
          csrf: data?.csrfToken,
        },
      };
    }
    const login = (password = currentPassword) =>
      request("/api/auth/login", {
        method: "POST",
        body: { identifier: account.username, password },
      });
    const latestCode = (purpose) =>
      [...testOutbox].reverse().find((mail) => mail.purpose === purpose).code;

    await context.test(
      "Registro exige verificar el correo y el código no se reutiliza",
      async () => {
        const registration = await request("/api/auth/register", {
          method: "POST",
          body: { ...account, confirmPassword: account.password },
        });
        assert.equal(registration.status, 201);
        assert.equal(registration.data.user, undefined);
        assert.equal((await login()).data.code, "EMAIL_VERIFICATION_REQUIRED");
        const body = {
          challengeId: registration.data.challengeId,
          code: latestCode("verify_email"),
          purpose: "verify_email",
        };
        assert.equal(
          (await request("/api/auth/codes/confirm", { method: "POST", body }))
            .status,
          200,
        );
        assert.ok(
          (await request("/api/auth/codes/confirm", { method: "POST", body }))
            .status >= 400,
        );
        const authenticated = await login();
        assert.equal(authenticated.status, 200);
        session = authenticated.session;
      },
    );

    await context.test(
      "Recuperar contraseña revoca sesiones y consume el código una sola vez",
      async () => {
        const challenge = await request("/api/auth/codes/request", {
          method: "POST",
          body: { identifier: account.email, purpose: "reset_password" },
        });
        assert.equal(challenge.status, 202);
        const newPassword = "NuevaClaveSegura456!";
        const body = {
          challengeId: challenge.data.challengeId,
          code: latestCode("reset_password"),
          newPassword,
          confirmPassword: newPassword,
        };
        assert.equal(
          (await request("/api/auth/password/reset", { method: "POST", body }))
            .status,
          200,
        );
        assert.ok(
          (await request("/api/auth/password/reset", { method: "POST", body }))
            .status >= 400,
        );
        assert.equal(
          (await request("/api/users/me", { authenticated: true })).status,
          401,
        );
        assert.equal((await login(account.password)).status, 401);
        currentPassword = newPassword;
        const authenticated = await login();
        assert.equal(authenticated.status, 200);
        session = authenticated.session;
      },
    );

    await context.test(
      "Cambiar email exige contraseña actual y confirmación del nuevo correo",
      async () => {
        const email = "correo.nuevo@example.com";
        const wrong = await request("/api/users/me/email/request", {
          method: "POST",
          authenticated: true,
          body: { email, currentPassword: "incorrecta" },
        });
        assert.equal(wrong.status, 400);
        const challenge = await request("/api/users/me/email/request", {
          method: "POST",
          authenticated: true,
          body: { email, currentPassword },
        });
        assert.equal(challenge.status, 202);
        assert.equal(
          (await request("/api/users/me", { authenticated: true })).data.user
            .email,
          account.email,
        );
        const confirmation = await request("/api/users/me/email/confirm", {
          method: "POST",
          authenticated: true,
          body: {
            challengeId: challenge.data.challengeId,
            code: latestCode("change_email"),
          },
        });
        assert.equal(confirmation.status, 200);
        assert.equal(confirmation.data.user.email, email);
        account.email = email;
      },
    );

    await context.test(
      "Tres contraseñas incorrectas bloquean y el código recupera el acceso",
      async () => {
        for (let attempt = 0; attempt < 3; attempt++)
          assert.ok((await login("incorrecta")).status >= 400);
        assert.ok((await login()).status >= 400);
        const challenge = await request("/api/auth/codes/request", {
          method: "POST",
          body: { identifier: account.email, purpose: "unlock" },
        });
        assert.equal(challenge.status, 202);
        const confirmation = await request("/api/auth/codes/confirm", {
          method: "POST",
          body: {
            challengeId: challenge.data.challengeId,
            code: latestCode("unlock"),
            purpose: "unlock",
          },
        });
        assert.equal(confirmation.status, 200);
        session = confirmation.session;
        assert.equal(
          (await request("/api/users/me", { authenticated: true })).status,
          200,
        );
      },
    );
  },
);
