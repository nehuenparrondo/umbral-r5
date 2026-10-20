import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

process.env.DATABASE_URL ||= "mysql://unused:unused@127.0.0.1:1/unused";
process.env.JWT_SECRET ||= randomBytes(32).toString("hex");
process.env.NODE_ENV = "test";

const { exchangeCodeForTokens, fetchNormalizedProfile } = await import(
  "../services/oauthService.js"
);
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
    exchangeCodeForTokens(
      { ...provider, tokenUrl: "https://provider.example/html-limit" },
      { code: "private-code" },
    ),
    (error) => {
      assert.equal(error.oauthDiagnostic.status, 429);
      assert.equal(error.oauthDiagnostic.reason, "rate_limited");
      assert.equal(error.oauthDiagnostic.retryAfterSeconds, 60);
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

test("OAuth respeta Retry-After sin repetir la solicitud durante la pausa", async (context) => {
  let now = 1_800_000_000_000;
  const clock = context.mock.method(Date, "now", () => now);
  const mocked = context.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ retry_after: 65.5, code: 20028 }), {
      status: 429,
      headers: { "Retry-After": "70" },
    }),
  );
  context.after(() => {
    clock.mock.restore();
    mocked.mock.restore();
  });
  const limitedProvider = {
    ...provider,
    tokenUrl: "https://provider.example/retry-limit",
  };
  await assert.rejects(
    exchangeCodeForTokens(limitedProvider, { code: "test-code" }),
    (error) => {
      assert.equal(error.oauthDiagnostic.retryAfterSeconds, 70);
      assert.equal(error.oauthDiagnostic.providerCode, 20028);
      return true;
    },
  );
  now += 10_000;
  await assert.rejects(
    exchangeCodeForTokens(limitedProvider, { code: "another-test-code" }),
    (error) => error.oauthDiagnostic.retryAfterSeconds === 60,
  );
  assert.equal(mocked.mock.callCount(), 1);
  now += 61_000;
  await assert.rejects(
    exchangeCodeForTokens(limitedProvider, { code: "new-test-code" }),
  );
  assert.equal(mocked.mock.callCount(), 2);
});

test("Discord identifica la aplicación en token y perfil sin cambiar permisos", async (context) => {
  const requests = [];
  const mocked = context.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options });
    return new Response(
      JSON.stringify(
        options.method === "POST"
          ? { access_token: "test-token" }
          : { id: "test-id", email: "test@example.com", verified: true },
      ),
    );
  });
  context.after(() => mocked.mock.restore());
  const discord = {
    ...provider,
    userInfoUrl: "https://provider.example/me",
    requestHeaders: { "User-Agent": "DiscordBot (https://app.example, 1.0.0)" },
    mapProfile: ({ profile }) => ({
      providerUserId: profile.id,
      email: profile.email,
      emailVerified: profile.verified,
    }),
  };
  const tokens = await exchangeCodeForTokens(discord, { code: "test-code" });
  const profile = await fetchNormalizedProfile(discord, tokens);
  assert.equal(profile.emailVerified, true);
  assert.equal(requests.length, 2);
  for (const request of requests)
    assert.equal(
      request.options.headers["User-Agent"],
      discord.requestHeaders["User-Agent"],
    );
});
