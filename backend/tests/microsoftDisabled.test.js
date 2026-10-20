/**
 * Microsoft no tiene un fallback ficticio: sin Auth0 debe quedar desactivado.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

Object.assign(process.env, {
  DATABASE_URL: "mysql://unused:unused@127.0.0.1:1/unused",
  JWT_SECRET: randomBytes(32).toString("hex"),
  NODE_ENV: "test",
  AUTH0_DOMAIN: "",
  AUTH0_CLIENT_ID: "",
  AUTH0_CLIENT_SECRET: "",
  AUTH0_ENABLED_PROVIDERS: "google,github,microsoft",
});
const { getOAuthProvider, listPublicOAuthProviders } =
  await import("../config/oauthProviders.js");

test("Sin Auth0 Microsoft queda desactivado y la lista pública no expone claves", () => {
  assert.equal(getOAuthProvider("microsoft").isConfigured, false);
  const providers = listPublicOAuthProviders();
  assert.equal(
    providers.find(({ id }) => id === "microsoft").configured,
    false,
  );
  assert.ok(
    providers.every(
      (provider) => !("clientSecret" in provider) && !("clientId" in provider),
    ),
  );
});
