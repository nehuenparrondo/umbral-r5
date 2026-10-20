/**
 * Declara los proveedores sociales y permite centralizarlos en Auth0 sin duplicar el
 * flujo OAuth.
 */
import { env } from "./env.js";

const redirectUri = (provider, configuredUri) =>
  configuredUri || `${env.serverOrigin}/api/auth/oauth/${provider}/callback`;

const configured = (settings) =>
  Boolean(settings.clientId && settings.clientSecret && settings.redirectUri);

const provider = (id, definition) => {
  const finalRedirectUri = redirectUri(id, definition.redirectUri);
  return {
    id,
    broker: "direct",
    ...definition,
    redirectUri: finalRedirectUri,
    isConfigured: configured({ ...definition, redirectUri: finalRedirectUri }),
  };
};

const auth0IsConfigured = Boolean(
  env.auth0.issuerBaseUrl && env.auth0.clientId && env.auth0.clientSecret,
);

const auth0SubjectId = (subject) => {
  // Auth0 usa valores como "github|123"; conservamos el ID original para poder migrar desde OAuth directo.
  const value = String(subject || "");
  const separator = value.indexOf("|");
  return separator >= 0 ? value.slice(separator + 1) : value;
};

const auth0Provider = (id, label) => {
  const issuer = `${env.auth0.issuerBaseUrl}/`;
  const connection = env.auth0.connections[id];
  const finalRedirectUri = redirectUri(id, "");
  return {
    id,
    label,
    broker: "auth0",
    connection,
    authorizationUrl: `${env.auth0.issuerBaseUrl}/authorize`,
    tokenUrl: `${env.auth0.issuerBaseUrl}/oauth/token`,
    userInfoUrl: `${env.auth0.issuerBaseUrl}/userinfo`,
    scope: "openid profile email",
    clientId: env.auth0.clientId,
    clientSecret: env.auth0.clientSecret,
    redirectUri: finalRedirectUri,
    usePkce: true,
    authorizationParams: { connection },
    oidc: {
      issuer,
      jwksUrl: `${env.auth0.issuerBaseUrl}/.well-known/jwks.json`,
    },
    isConfigured:
      auth0IsConfigured &&
      env.auth0.enabledProviders.has(id) &&
      Boolean(connection),
    mapProfile: ({ profile }) => ({
      providerUserId: auth0SubjectId(profile.sub),
      email: profile.email,
      emailVerified: profile.email_verified === true,
      name: profile.name || profile.nickname,
      username: profile.nickname || profile.email?.split("@")[0],
      avatarUrl: profile.picture,
    }),
  };
};

// Estas definiciones quedan como fallback y permiten demostrar cada proveedor sin Auth0.
const directProviders = {
  google: provider("google", {
    label: "Google",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientId: env.oauth.google.clientId,
    clientSecret: env.oauth.google.clientSecret,
    redirectUri: env.oauth.google.redirectUri,
    usePkce: true,
    oidc: {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
    },
    mapProfile: ({ profile }) => ({
      providerUserId: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified === true,
      name: profile.name,
      username: profile.email?.split("@")[0],
      avatarUrl: profile.picture,
    }),
  }),
  facebook: provider("facebook", {
    label: "Facebook / Meta",
    authorizationUrl: `https://www.facebook.com/${env.oauth.facebook.graphVersion}/dialog/oauth`,
    tokenUrl: `https://graph.facebook.com/${env.oauth.facebook.graphVersion}/oauth/access_token`,
    userInfoUrl: `https://graph.facebook.com/${env.oauth.facebook.graphVersion}/me?fields=id,name,email,picture.type(large)`,
    scope: "email public_profile",
    clientId: env.oauth.facebook.clientId,
    clientSecret: env.oauth.facebook.clientSecret,
    redirectUri: env.oauth.facebook.redirectUri,
    usePkce: false,
    mapProfile: ({ profile }) => ({
      providerUserId: profile.id,
      email: profile.email,
      // Meta no expone una afirmacion email_verified en /me.
      emailVerified: false,
      name: profile.name,
      username: profile.name,
      avatarUrl: profile.picture?.data?.url,
    }),
  }),
  github: provider("github", {
    label: "GitHub",
    authorizationUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    extraProfileUrls: { emails: "https://api.github.com/user/emails" },
    profileHeaders: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    scope: "read:user user:email",
    clientId: env.oauth.github.clientId,
    clientSecret: env.oauth.github.clientSecret,
    redirectUri: env.oauth.github.redirectUri,
    usePkce: true,
    mapProfile: ({ profile, emails = [] }) => {
      const selectedEmail =
        emails.find((email) => email.primary && email.verified) ||
        emails.find((email) => email.verified) ||
        null;
      return {
        providerUserId: profile.id,
        email: selectedEmail?.email || profile.email,
        emailVerified: Boolean(selectedEmail?.verified),
        name: profile.name || profile.login,
        username: profile.login,
        avatarUrl: profile.avatar_url,
      };
    },
  }),
  discord: provider("discord", {
    label: "Discord",
    authorizationUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/v10/oauth2/token",
    userInfoUrl: "https://discord.com/api/v10/users/@me",
    scope: "identify email",
    clientId: env.oauth.discord.clientId,
    clientSecret: env.oauth.discord.clientSecret,
    redirectUri: env.oauth.discord.redirectUri,
    usePkce: false,
    mapProfile: ({ profile }) => ({
      providerUserId: profile.id,
      email: profile.email,
      emailVerified: profile.verified === true,
      name: profile.global_name || profile.username,
      username: profile.username,
      avatarUrl: profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : null,
    }),
  }),
  twitch: provider("twitch", {
    label: "Twitch",
    authorizationUrl: "https://id.twitch.tv/oauth2/authorize",
    tokenUrl: "https://id.twitch.tv/oauth2/token",
    userInfoUrl: "https://id.twitch.tv/oauth2/userinfo",
    scope: "openid user:read:email",
    clientId: env.oauth.twitch.clientId,
    clientSecret: env.oauth.twitch.clientSecret,
    redirectUri: env.oauth.twitch.redirectUri,
    usePkce: false,
    oidc: {
      issuer: "https://id.twitch.tv/oauth2",
      jwksUrl: "https://id.twitch.tv/oauth2/keys",
    },
    mapProfile: ({ profile }) => ({
      providerUserId: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified === true,
      name: profile.preferred_username || profile.email?.split("@")[0],
      username: profile.preferred_username,
      avatarUrl: profile.picture,
    }),
  }),
  x: provider("x", {
    label: "X",
    authorizationUrl: "https://x.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    userInfoUrl:
      "https://api.x.com/2/users/me?user.fields=id,name,username,profile_image_url,verified",
    scope: "users.read tweet.read",
    clientId: env.oauth.x.clientId,
    clientSecret: env.oauth.x.clientSecret,
    redirectUri: env.oauth.x.redirectUri,
    usePkce: true,
    tokenAuth: "basic",
    mapProfile: ({ profile }) => ({
      providerUserId: profile.data?.id,
      email: null,
      emailVerified: false,
      name: profile.data?.name,
      username: profile.data?.username,
      avatarUrl: profile.data?.profile_image_url,
    }),
  }),
};

const labels = {
  google: "Google",
  facebook: "Facebook / Meta",
  github: "GitHub",
  discord: "Discord",
  twitch: "Twitch",
  x: "X",
  microsoft: "Microsoft",
};

// Microsoft se integra exclusivamente por Auth0; los otros proveedores conservan
// el fallback directo. Sin credenciales o sin habilitación, Microsoft no permite iniciar sesión.
export const oauthProviders = Object.fromEntries(
  Object.keys(labels).map((id) => [
    id,
    id === "microsoft" ||
    (auth0IsConfigured && env.auth0.enabledProviders.has(id))
      ? auth0Provider(id, labels[id])
      : directProviders[id],
  ]),
);

export const getOAuthProvider = (providerId) =>
  oauthProviders[String(providerId || "").toLowerCase()] || null;

export const listPublicOAuthProviders = () =>
  Object.values(oauthProviders).map(
    ({ id, label, isConfigured, broker, connection }) => ({
      id,
      label,
      configured: isConfigured,
      broker,
      connection: broker === "auth0" ? connection : null,
    }),
  );

// This file exports: oauthProviders, getOAuthProvider and listPublicOAuthProviders.
// It is used by: OAuth service and controller.
// It imports from: backend/config/env.js.
