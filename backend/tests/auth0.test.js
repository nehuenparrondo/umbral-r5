/*
 * Pruebas de configuracion del broker Auth0 sin realizar llamadas a Internet.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

process.env.DATABASE_URL ||= "mysql://unused:unused@127.0.0.1:1/unused";
process.env.JWT_SECRET ||= randomBytes(32).toString("hex");
process.env.NODE_ENV = "test";
process.env.AUTH0_DOMAIN = "r5-test.us.auth0.com";
process.env.AUTH0_CLIENT_ID = "auth0-client-id";
process.env.AUTH0_CLIENT_SECRET = "auth0-client-secret";
process.env.AUTH0_ENABLED_PROVIDERS =
  "google,facebook,github,discord,twitch,x,microsoft";
// La prueba fija el nombre oficial para no depender de valores externos al entorno de test.
process.env.AUTH0_X_CONNECTION = "twitter";
process.env.AUTH0_MICROSOFT_CONNECTION = "windowslive";

const { getOAuthProvider, listPublicOAuthProviders } =
  await import("../config/oauthProviders.js");
const { buildAuthorizationUrl, createOAuthTransaction } =
  await import("../services/oauthService.js");

test("Auth0 centraliza los siete proveedores soportados por el backend", () => {
  const providers = listPublicOAuthProviders();
  assert.equal(providers.length, 7);
  assert.ok(providers.every(({ configured }) => configured));
  assert.ok(providers.every(({ broker }) => broker === "auth0"));
  assert.deepEqual(
    providers.map(({ connection }) => connection),
    [
      "google-oauth2",
      "facebook",
      "github",
      "discord",
      "twitch",
      "twitter",
      "windowslive",
    ],
  );
});

test("Microsoft usa su conexión, callback propio, PKCE, nonce y email verificado", () => {
  const provider = getOAuthProvider("microsoft");
  const transaction = createOAuthTransaction(provider);
  const url = new URL(buildAuthorizationUrl(provider, transaction));
  assert.equal(provider.isConfigured, true);
  assert.equal(provider.broker, "auth0");
  assert.equal(url.searchParams.get("connection"), "windowslive");
  assert.equal(
    new URL(url.searchParams.get("redirect_uri")).pathname,
    "/api/auth/oauth/microsoft/callback",
  );
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("nonce"), transaction.nonce);
  assert.equal(url.searchParams.get("state"), transaction.state);
  assert.equal(url.searchParams.get("scope"), "openid profile email");
  const profile = {
    sub: "windowslive|123",
    email: "persona@outlook.com",
    name: "Persona",
  };
  assert.equal(provider.mapProfile({ profile }).emailVerified, false);
  assert.equal(
    provider.mapProfile({ profile: { ...profile, email_verified: true } })
      .emailVerified,
    true,
  );
  assert.equal(provider.mapProfile({ profile }).providerUserId, "123");
});

test("Cada boton fuerza su conexion Auth0 con Authorization Code, PKCE y nonce", () => {
  const provider = getOAuthProvider("github");
  const transaction = createOAuthTransaction(provider);
  const url = new URL(buildAuthorizationUrl(provider, transaction));

  assert.equal(url.origin, "https://r5-test.us.auth0.com");
  assert.equal(url.pathname, "/authorize");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("connection"), "github");
  assert.equal(url.searchParams.get("prompt"), "select_account");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("nonce"), transaction.nonce);

  const mapped = provider.mapProfile({
    profile: {
      sub: "github|12345",
      email: "persona@example.com",
      email_verified: true,
      name: "Persona",
      nickname: "persona",
      picture: "https://example.com/avatar.png",
    },
  });
  assert.equal(mapped.providerUserId, "12345");
  assert.equal(mapped.emailVerified, true);
});

test("Google y GitHub no reutilizan silenciosamente la sesión del broker", () => {
  for (const providerId of ["google", "github"]) {
    const provider = getOAuthProvider(providerId);
    const url = new URL(
      buildAuthorizationUrl(provider, createOAuthTransaction(provider)),
    );
    assert.equal(
      url.searchParams.get("prompt"),
      providerId === "github" ? "select_account" : "login select_account",
    );
    assert.equal(url.searchParams.has("login_hint"), false);
    assert.equal(url.searchParams.has("id_token_hint"), false);
  }
});

// This file exports: node:test cases for the Auth0 broker.
// It is used by: npm test.
// It imports from: OAuth provider config and service helpers.
