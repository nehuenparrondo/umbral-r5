/**
 * Verifica errores sociales sin contactar proveedores. Los callbacks se ejercen
 * con estados auténticos de una base temporal y nunca crean sesiones externas.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { classifyOAuthError } from "../utils/oauthErrors.js";
import { createTestDatabase, mysqlReady } from "./testDatabase.js";

test("OAuth distingue configuración, rechazo, cancelación y errores desconocidos", () => {
  assert.equal(classifyOAuthError("invalid_client", ""), "configuration");
  assert.equal(
    classifyOAuthError("access_denied", "the connection is not enabled"),
    "configuration",
  );
  assert.equal(
    classifyOAuthError("access_denied", "User cancelled the login"),
    "cancelled",
  );
  assert.equal(classifyOAuthError("access_denied", ""), "denied");
  assert.equal(
    classifyOAuthError("server_error", "<script>private</script>"),
    "provider",
  );
  assert.equal(classifyOAuthError(["access_denied"], {}), "provider");
});

test(
  "Los callbacks validan estado, clasifican el error y rechazan su reutilización",
  {
    skip: mysqlReady ? false : "Preparar MySQL con npm run setup:local.",
  },
  async (context) => {
    const database = await createTestDatabase();
    Object.assign(process.env, {
      DATABASE_URL: database.url,
      JWT_SECRET: randomBytes(32).toString("hex"),
      NODE_ENV: "test",
      EMAIL_TRANSPORT: "test",
      COOKIE_SECURE: "false",
      CLIENT_ORIGIN: "http://localhost:5173",
      AUTH0_DOMAIN: "",
      AUTH0_CLIENT_ID: "",
      AUTH0_CLIENT_SECRET: "",
      GOOGLE_CLIENT_ID: "local-test-client",
      GOOGLE_CLIENT_SECRET: "local-test-secret",
      GOOGLE_REDIRECT_URI:
        "http://localhost:4000/api/auth/oauth/google/callback",
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
    for (const [description, expected] of [
      ["the connection is not enabled", "configuration"],
      ["User cancelled the login", "cancelled"],
      ["an access policy denied this request", "denied"],
    ]) {
      const start = await fetch(base + "/api/auth/oauth/google", {
        redirect: "manual",
      });
      assert.equal(start.status, 302);
      const state = new URL(start.headers.get("location")).searchParams.get(
        "state",
      );
      const cookie = start.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const query = new URLSearchParams({
        state,
        error: "access_denied",
        error_description: description,
      });
      const route = base + "/api/auth/oauth/google/callback?" + query;
      const missingCookie = await fetch(route, { redirect: "manual" });
      assert.equal(
        new URL(missingCookie.headers.get("location")).searchParams.get(
          "error",
        ),
        "oauth_invalid_state",
      );
      const response = await fetch(route, {
        headers: { Cookie: cookie },
        redirect: "manual",
      });
      assert.equal(response.status, 303);
      assert.equal(
        response.headers.get("location"),
        `http://localhost:5173/login?error=oauth_${expected}`,
      );
      assert.equal(
        response.headers.get("location").includes(description),
        false,
      );
      assert.equal(
        response.headers
          .getSetCookie()
          .some((value) => /^(access_token|refresh_token)=/.test(value)),
        false,
      );
      const replay = await fetch(route, {
        headers: { Cookie: cookie },
        redirect: "manual",
      });
      assert.equal(
        new URL(replay.headers.get("location")).searchParams.get("error"),
        "oauth_invalid_state",
      );
    }
  },
);
