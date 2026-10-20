/**
 * Verifica firmas y la coincidencia del subject OIDC antes del mapeo local.
 * El emisor y las claves de prueba son locales; no se contacta Auth0 real.
 */
import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { fetchNormalizedProfile } from "../services/oauthService.js";

test("Auth0 admite el subject con prefijo sin omitir la validación de UserInfo", async (context) => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const key = {
    ...(await exportJWK(publicKey)),
    kid: "local-key",
    alg: "RS256",
    use: "sig",
  };
  const subject = "google-oauth2|123456";
  let profileSubject = subject;
  const server = http.createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify(
        request.url === "/jwks"
          ? { keys: [key] }
          : {
              sub: profileSubject,
              email: "oidc@example.com",
              email_verified: true,
              name: "Cuenta de prueba",
            },
      ),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const issuer = `http://127.0.0.1:${server.address().port}`;
  const provider = {
    clientId: "local-client",
    userInfoUrl: issuer + "/userinfo",
    oidc: { issuer, jwksUrl: issuer + "/jwks" },
    mapProfile: ({ profile }) => ({
      providerUserId: profile.sub.split("|")[1],
      email: profile.email,
      emailVerified: profile.email_verified,
      name: profile.name,
    }),
  };
  const token = await new SignJWT({ nonce: "local-nonce" })
    .setProtectedHeader({ alg: "RS256", kid: key.kid })
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(provider.clientId)
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(privateKey);
  const tokens = { id_token: token, access_token: "local-test-token" };
  const result = await fetchNormalizedProfile(provider, tokens, {
    nonce: "local-nonce",
  });
  assert.equal(result.providerUserId, "123456");
  assert.equal(result.emailVerified, true);
  profileSubject = "github|123456";
  await assert.rejects(
    fetchNormalizedProfile(provider, tokens, { nonce: "local-nonce" }),
    /La identidad OIDC no coincide/,
  );
  profileSubject = undefined;
  await assert.rejects(
    fetchNormalizedProfile(provider, tokens, { nonce: "local-nonce" }),
    /La identidad OIDC no coincide/,
  );
  profileSubject = subject;
  await assert.rejects(
    fetchNormalizedProfile(provider, tokens, { nonce: "otro-nonce" }),
    /Nonce OIDC invalido/,
  );
});
