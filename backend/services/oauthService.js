/**
 * Ejecuta Authorization Code, PKCE, validacion OIDC y normaliza perfiles externos sin
 * guardar tokens.
 */
import crypto from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { AppError } from "../utils/errors.js";
import { normalizeEmail } from "../utils/normalizers.js";
import { hashToken } from "./tokenService.js";

const jwksCache = new Map();
const PROFILE_TIMEOUT_MS = 10_000;

const base64Url = (value) => Buffer.from(value).toString("base64url");

export const createPkcePair = () => {
  // RFC 7636: verifier aleatorio y challenge SHA-256 codificado base64url.
  const codeVerifier = base64Url(crypto.randomBytes(48));
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
};

export const createOAuthTransaction = (provider) => {
  const state = base64Url(crypto.randomBytes(32));
  const nonce = provider.oidc ? base64Url(crypto.randomBytes(32)) : null;
  const pkce = provider.usePkce
    ? createPkcePair()
    : { codeVerifier: null, codeChallenge: null };
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  return {
    state,
    stateHash: hashToken(state),
    nonce,
    expiresAt,
    ...pkce,
  };
};

export const oauthStateCookieName = (providerId, state) =>
  `r5_oauth_${providerId}_${hashToken(state).slice(0, 12)}`;

export const oauthStateCookieOptions = (provider, secure) => ({
  httpOnly: true,
  sameSite: "lax",
  secure,
  path: `/api/auth/oauth/${provider}/callback`,
  maxAge: 10 * 60 * 1000,
});

export const buildAuthorizationUrl = (provider, transaction) => {
  const url = new URL(provider.authorizationUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", provider.clientId);
  url.searchParams.set("redirect_uri", provider.redirectUri);
  url.searchParams.set("scope", provider.scope);
  url.searchParams.set("state", transaction.state);
  if (transaction.codeChallenge) {
    url.searchParams.set("code_challenge", transaction.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  if (transaction.nonce) url.searchParams.set("nonce", transaction.nonce);
  // Auth0 usa connection para enviar cada boton directamente a su red social.
  for (const [key, value] of Object.entries(
    provider.authorizationParams || {},
  )) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

const oauthRequestFailure = (message, url, status, reason) => {
  const error = new AppError(message, 502);
  const endpoint = new URL(url);
  error.oauthDiagnostic = {
    endpoint: endpoint.hostname + endpoint.pathname,
    status,
    reason,
  };
  return error;
};

const fetchJson = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(PROFILE_TIMEOUT_MS),
    });
  } catch (_error) {
    throw oauthRequestFailure(
      "El proveedor OAuth no respondio a tiempo.",
      url,
      null,
      "network",
    );
  }

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_error) {
    throw oauthRequestFailure(
      "El proveedor OAuth devolvio una respuesta invalida.",
      url,
      response.status,
      "invalid_json",
    );
  }
  if (!response.ok || payload.error) {
    const knownErrors = new Set([
      "invalid_client",
      "invalid_grant",
      "invalid_request",
      "access_denied",
      "unauthorized_client",
      "invalid_token",
      "server_error",
      "temporarily_unavailable",
    ]);
    throw oauthRequestFailure(
      "El proveedor OAuth rechazo la solicitud.",
      url,
      response.status,
      knownErrors.has(payload.error) ? payload.error : "provider_rejected",
    );
  }
  return payload;
};

export const exchangeCodeForTokens = async (
  provider,
  { code, codeVerifier },
) => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: provider.clientId,
    code,
    redirect_uri: provider.redirectUri,
  });
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (provider.tokenAuth === "basic") {
    headers.Authorization = `Basic ${Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString("base64")}`;
  } else {
    body.set("client_secret", provider.clientSecret);
  }
  if (codeVerifier) body.set("code_verifier", codeVerifier);

  const tokens = await fetchJson(provider.tokenUrl, {
    method: "POST",
    headers,
    body,
  });
  if (!tokens.access_token) {
    throw new AppError("El proveedor no entrego un token de acceso.", 502);
  }
  return tokens;
};

const verifyOidcToken = async (provider, idToken, nonce) => {
  if (!idToken) throw new AppError("Falta el token de identidad OIDC.", 502);
  let jwks = jwksCache.get(provider.oidc.jwksUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(provider.oidc.jwksUrl), {
      timeoutDuration: PROFILE_TIMEOUT_MS,
    });
    jwksCache.set(provider.oidc.jwksUrl, jwks);
  }
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: provider.oidc.issuer,
    audience: provider.clientId,
  });
  if (!nonce || payload.nonce !== nonce) {
    throw new AppError("Nonce OIDC invalido.", 400);
  }
  return payload;
};

export const fetchNormalizedProfile = async (
  provider,
  tokens,
  { nonce } = {},
) => {
  const idClaims = provider.oidc
    ? await verifyOidcToken(provider, tokens.id_token, nonce)
    : null;
  const headers = {
    Authorization: `Bearer ${tokens.access_token}`,
    Accept: "application/json",
    ...provider.profileHeaders,
  };
  const raw = {
    profile: await fetchJson(provider.userInfoUrl, { headers }),
  };
  for (const [key, url] of Object.entries(provider.extraProfileUrls || {})) {
    raw[key] = await fetchJson(url, { headers });
  }

  // Se compara el subject original de UserInfo antes de normalizar el ID local.
  // Auth0 incluye un prefijo de conexión que el mapeo elimina por compatibilidad.
  if (
    idClaims &&
    (typeof raw.profile.sub !== "string" || idClaims.sub !== raw.profile.sub)
  ) {
    throw new AppError("La identidad OIDC no coincide con el perfil.", 400);
  }
  const mapped = provider.mapProfile(raw);
  return validateNormalizedProfile(mapped);
};

export const validateNormalizedProfile = (profile) => {
  const providerUserId = String(profile?.providerUserId || "").trim();
  const email = profile?.email ? normalizeEmail(profile.email) : null;
  if (!providerUserId || providerUserId.length > 255) {
    throw new AppError("El proveedor no entrego una identidad valida.", 502);
  }
  if (
    email &&
    (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    throw new AppError("El proveedor no entrego un email valido.", 502);
  }
  return {
    providerUserId,
    email,
    emailVerified: profile.emailVerified === true,
    name: String(profile.name || "Usuario")
      .trim()
      .slice(0, 80),
    username: String(profile.username || "").trim(),
    avatarUrl: profile.avatarUrl
      ? String(profile.avatarUrl).slice(0, 2048)
      : null,
  };
};

export const safeUsernameBase = ({ username, name, provider }) => {
  // Mantiene solo caracteres admitidos por el registro tradicional.
  const source = username || name || `usuario_${provider}`;
  const cleaned = String(source)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_.]+/g, "_")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 30);
  return cleaned.length >= 3 ? cleaned : `usuario_${provider}`.slice(0, 30);
};

export const decideOAuthAccountAction = ({
  existingAccount,
  email,
  existingUser,
  emailVerified,
}) => {
  // Decision pura y testeable: nunca vincula por un email no confirmado.
  if (existingAccount) return "login";
  if (!email) return "email_missing";
  if (existingUser && !emailVerified) return "email_unverified";
  return existingUser ? "link" : "register";
};

// This file exports: OAuth transaction, URL, token, profile and normalization helpers.
// It is used by: backend/controllers/oauthController.js and tests.
// It imports from: node:crypto, jose, token service, normalizers and errors.
