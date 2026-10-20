import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

process.env.DATABASE_URL ||= "mysql://unused:unused@127.0.0.1:1/unused";
process.env.JWT_SECRET ||= randomBytes(32).toString("hex");
process.env.NODE_ENV = "test";

const { exchangeCodeForTokens } = await import("../services/oauthService.js");
const provider = {
  tokenUrl: "https://provider.example/token?private=never-log-this",
  clientId: "test-client",
  clientSecret: "test-sensitive-secret",
  redirectUri: "https://app.example/callback",
};

test("OAuth diagnostica HTTP 401 sin reflejar claves, códigos ni descripciones", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify({
        error: "invalid_client",
        error_description: provider.clientSecret,
      }),
      { status: 401 },
    ),
  );
  context.after(() => mocked.mock.restore());
  await assert.rejects(
    exchangeCodeForTokens(provider, { code: "private-code" }),
    (error) => {
      assert.equal(error.statusCode, 502);
      assert.deepEqual(error.oauthDiagnostic, {
        endpoint: "provider.example/token",
        status: 401,
        reason: "invalid_client",
      });
      const serialized = JSON.stringify(error);
      for (const secret of [provider.clientSecret, "private-code", "never-log-this"])
        assert.equal(serialized.includes(secret), false);
      return true;
    },
  );
});

test("OAuth identifica HTML o bloqueos externos sin registrar el cuerpo", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", async () =>
    new Response("<html>private-provider-response</html>", { status: 429 }),
  );
  context.after(() => mocked.mock.restore());
  await assert.rejects(
    exchangeCodeForTokens(provider, { code: "private-code" }),
    (error) => {
      assert.equal(error.oauthDiagnostic.status, 429);
      assert.equal(error.oauthDiagnostic.reason, "invalid_json");
      assert.equal(JSON.stringify(error).includes("private-provider-response"), false);
      return true;
    },
  );
});

test("OAuth oculta los detalles de errores de red", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", async () => {
    throw new Error("private-network-details");
  });
  context.after(() => mocked.mock.restore());
  await assert.rejects(
    exchangeCodeForTokens(provider, { code: "private-code" }),
    (error) => {
      assert.equal(error.oauthDiagnostic.reason, "network");
      assert.equal(error.oauthDiagnostic.status, null);
      assert.equal(JSON.stringify(error).includes("private-network-details"), false);
      return true;
    },
  );
});

test("OAuth conserva un intercambio de tokens correcto", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ access_token: "test-access-token" }), {
      status: 200,
    }),
  );
  context.after(() => mocked.mock.restore());
  assert.deepEqual(
    await exchangeCodeForTokens(provider, { code: "private-code" }),
    { access_token: "test-access-token" },
  );
});
