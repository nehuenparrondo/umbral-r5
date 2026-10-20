/*
 * Diagnóstico sin secretos: presencia de credenciales y descubrimiento OIDC.
 * No certifica permisos remotos ni un ingreso interactivo real.
 */
import { env } from "../config/env.js";
import { listPublicOAuthProviders } from "../config/oauthProviders.js";

const providers = listPublicOAuthProviders();

console.table(
  providers.map(({ id, label, configured, broker, connection }) => ({
    proveedor: label || id,
    credenciales: configured ? "presentes" : "faltantes",
    modo: broker === "auth0" ? "Auth0" : "directo",
    conexion: connection || "-",
  })),
);
console.log(
  "Las credenciales presentes no garantizan que la conexión esté habilitada. Probar cada proveedor con una cuenta propia.",
);

if (env.auth0.issuerBaseUrl) {
  try {
    const response = await fetch(
      `${env.auth0.issuerBaseUrl}/.well-known/openid-configuration`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const discovery = await response.json();
    if (!discovery.authorization_endpoint || !discovery.token_endpoint) {
      throw new Error("discovery OIDC incompleto");
    }
    console.log(`Auth0 OIDC: disponible en ${env.auth0.issuerBaseUrl}`);
  } catch (error) {
    console.error(`Auth0 OIDC: no disponible (${error.message}).`);
    process.exitCode = 1;
  }
} else {
  console.log(
    "Auth0 todavia no esta configurado. Completar AUTH0_DOMAIN, AUTH0_CLIENT_ID y AUTH0_CLIENT_SECRET en .env.",
  );
}

// This file is executed by: npm run oauth:check.
// It imports from: validated env and the public OAuth provider registry.
