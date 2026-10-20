/**
 * Verifica Discord directo junto a Google/GitHub en Auth0 sin cuentas ni red externa.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

Object.assign(process.env, {
  DATABASE_URL: "mysql://unused:unused@127.0.0.1:1/unused",
  JWT_SECRET: randomBytes(32).toString("hex"),
  NODE_ENV: "test",
  SERVER_ORIGIN: "http://localhost:4000",
  AUTH0_DOMAIN: "r5-test.us.auth0.com",
  AUTH0_CLIENT_ID: "auth0-test-id",
  AUTH0_CLIENT_SECRET: "auth0-test-secret",
  AUTH0_ENABLED_PROVIDERS: "google,github",
  DISCORD_CLIENT_ID: "discord-test-id",
  DISCORD_CLIENT_SECRET: "discord-test-secret",
  DISCORD_REDIRECT_URI: "http://localhost:4000/api/auth/oauth/discord/callback",
});

const { getOAuthProvider, listPublicOAuthProviders } =
  await import("../config/oauthProviders.js");
const {
  buildAuthorizationUrl,
  createOAuthTransaction,
  decideOAuthAccountAction,
  validateNormalizedProfile,
} = await import("../services/oauthService.js");
const discord = getOAuthProvider("discord");

test("Discord directo convive con Google y GitHub en Auth0 sin activar Microsoft", () => {
  assert.equal(discord.broker, "direct");
  assert.equal(discord.isConfigured, true);
  for (const providerId of ["google", "github"]) {
    assert.equal(getOAuthProvider(providerId).broker, "auth0");
    assert.equal(getOAuthProvider(providerId).isConfigured, true);
  }
  assert.equal(getOAuthProvider("microsoft").isConfigured, false);
});

test("Discord solicita solo identidad/email, callback exacto y estado de un uso", () => {
  const transaction = createOAuthTransaction(discord);
  const url = new URL(buildAuthorizationUrl(discord, transaction));
  assert.equal(url.origin, "https://discord.com");
  assert.equal(url.pathname, "/oauth2/authorize");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "identify email");
  assert.equal(url.searchParams.get("state"), transaction.state);
  assert.equal(url.searchParams.get("redirect_uri"), discord.redirectUri);
  assert.equal(url.searchParams.has("client_secret"), false);
  assert.equal(url.searchParams.has("connection"), false);
  assert.notEqual(createOAuthTransaction(discord).state, transaction.state);
});

test("El perfil de Discord conserva ID, nombre, avatar y email confirmado", () => {
  const profile = validateNormalizedProfile(
    discord.mapProfile({
      profile: {
        id: "12345",
        username: "persona",
        global_name: "Persona",
        email: "Persona@Example.com",
        verified: true,
        avatar: "avatar-id",
      },
    }),
  );
  assert.equal(profile.providerUserId, "12345");
  assert.equal(profile.name, "Persona");
  assert.equal(profile.email, "persona@example.com");
  assert.equal(profile.emailVerified, true);
  assert.equal(
    profile.avatarUrl,
    "https://cdn.discordapp.com/avatars/12345/avatar-id.png",
  );
});

test("Discord no vincula por un email no verificado ni inventa uno ausente", () => {
  for (const verified of [false, undefined, "true"]) {
    const profile = discord.mapProfile({
      profile: {
        id: "12345",
        username: "persona",
        email: "persona@example.com",
        verified,
      },
    });
    assert.equal(profile.emailVerified, false);
    assert.equal(
      decideOAuthAccountAction({ ...profile, existingUser: true }),
      "email_unverified",
    );
    assert.equal(profile.avatarUrl, null);
  }
  assert.equal(
    decideOAuthAccountAction(
      discord.mapProfile({
        profile: { id: "12345", username: "persona" },
      }),
    ),
    "email_missing",
  );
});

test("La API pública de proveedores nunca entrega las credenciales Discord", () => {
  const providers = listPublicOAuthProviders();
  const serialized = JSON.stringify(providers);
  assert.equal(providers.find(({ id }) => id === "discord").configured, true);
  assert.equal(serialized.includes(process.env.DISCORD_CLIENT_SECRET), false);
  assert.equal(serialized.includes(process.env.DISCORD_CLIENT_ID), false);
});
