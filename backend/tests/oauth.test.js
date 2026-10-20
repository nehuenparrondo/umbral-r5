/**
 * Prueba state, PKCE, URL y normalizacion OAuth sin depender de redes externas.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

process.env.DATABASE_URL ||= "mysql://unused:unused@127.0.0.1:1/unused";
process.env.JWT_SECRET ||= randomBytes(32).toString("hex");
process.env.NODE_ENV = "test";

const {
  buildAuthorizationUrl,
  createOAuthTransaction,
  createPkcePair,
  decideOAuthAccountAction,
  safeUsernameBase,
  validateNormalizedProfile,
} = await import("../services/oauthService.js");

test("PKCE usa S256 y no repite verificadores", () => {
  const first = createPkcePair();
  const second = createPkcePair();
  assert.notEqual(first.codeVerifier, second.codeVerifier);
  assert.match(first.codeVerifier, /^[A-Za-z0-9_-]{43,128}$/);
  assert.match(first.codeChallenge, /^[A-Za-z0-9_-]{43}$/);
});

test("La URL generica incluye state, PKCE, nonce y callback exacto", () => {
  const provider = {
    id: "demo",
    authorizationUrl: "https://accounts.example/authorize",
    clientId: "client-id",
    redirectUri: "https://app.example/api/auth/oauth/demo/callback",
    scope: "openid email",
    usePkce: true,
    authorizationParams: { connection: "github" },
    oidc: { issuer: "https://accounts.example" },
  };
  const transaction = createOAuthTransaction(provider);
  const url = new URL(buildAuthorizationUrl(provider, transaction));
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("state"), transaction.state);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("nonce"), transaction.nonce);
  assert.equal(url.searchParams.get("redirect_uri"), provider.redirectUri);
  assert.equal(url.searchParams.get("connection"), "github");
});

test("El perfil externo se normaliza y valida estrictamente", () => {
  assert.deepEqual(
    validateNormalizedProfile({
      providerUserId: 123,
      email: " Persona@Example.COM ",
      emailVerified: true,
      name: "Persona",
      username: "persona",
    }),
    {
      providerUserId: "123",
      email: "persona@example.com",
      emailVerified: true,
      name: "Persona",
      username: "persona",
      avatarUrl: null,
    },
  );
  assert.throws(() =>
    validateNormalizedProfile({ providerUserId: "", email: "x@example.com" }),
  );
  assert.throws(() =>
    validateNormalizedProfile({ providerUserId: "1", email: "invalido" }),
  );
});

test("El username social conserva el formato del registro", () => {
  assert.equal(
    safeUsernameBase({ name: "María <Admin>", provider: "google" }),
    "Maria_Admin",
  );
  assert.equal(
    safeUsernameBase({ username: "x", provider: "github" }),
    "usuario_github",
  );
});

test("La decision crea, vincula o rechaza sin confiar en email no verificado", () => {
  assert.equal(decideOAuthAccountAction({ existingAccount: true }), "login");
  assert.equal(
    decideOAuthAccountAction({ existingAccount: false, email: null }),
    "email_missing",
  );
  assert.equal(
    decideOAuthAccountAction({
      existingAccount: false,
      email: "persona@example.com",
      existingUser: true,
      emailVerified: false,
    }),
    "email_unverified",
  );
  assert.equal(
    decideOAuthAccountAction({
      existingAccount: false,
      email: "persona@example.com",
      existingUser: true,
      emailVerified: true,
    }),
    "link",
  );
  assert.equal(
    decideOAuthAccountAction({
      existingAccount: false,
      email: "nueva@example.com",
      existingUser: false,
      emailVerified: false,
    }),
    "register",
  );
});

// This file exports: node:test cases.
// It is used by: npm test.
// It imports from: OAuth service and Node test/assert modules.
