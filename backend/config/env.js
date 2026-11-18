/**
 * Lee y valida variables de entorno. Resuelve no hardcodear secretos, puertos, CORS,
 * JWT y bcrypt configurables.
 *
 * Lectura guiada. Lee y valida la configuración privada del backend. Un nombre de variable
 * no es su valor secreto; las claves se cargan desde entorno/.env y nunca deben copiarse a
 * la interfaz.
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// La API carga exclusivamente backend/.env, sin depender de la terminal actual.
// No se usan prefijos VITE_ para credenciales: nunca deben llegar al navegador.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

/**
 * Interpreta una variable de entorno como entero decimal; devuelve fallback si no puede
 * interpretarla.
 * No impone por sí misma un rango: los límites específicos corresponden a cada configuración.
 */
const toInteger = (value, fallback) => {
  // Convierte variables de entorno numericas y usa fallback si faltan.
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Usa fallback si la variable no existe; reconoce true, 1 y yes como verdadero sin distinguir
 * mayúsculas.
 * Los demás valores presentes se interpretan como falso.
 */
const toBoolean = (value, fallback = false) => {
  // Convierte strings comunes de .env en booleanos reales.
  if (value === undefined) return fallback;
  return ["true", "1", "yes"].includes(String(value).toLowerCase());
};

/**
 * Lee y recorta una variable obligatoria. Interrumpe el arranque si falta o está vacía para evitar
 * configuración incompleta.
 */
const required = (key) => {
  // Falla al arrancar si falta una credencial/secret obligatorio.
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
};

/**
 * Lee una variable opcional y quita espacios exteriores; devuelve una cadena vacía cuando no está
 * configurada.
 */
const optional = (key) => {
  // Los proveedores OAuth son opcionales: la app sigue funcionando sin credenciales sociales.
  const value = process.env[key];
  return value?.trim() || "";
};

const normalizedAuth0Domain = optional("AUTH0_DOMAIN")
  .replace(/^https?:\/\//i, "")
  .replace(/\/+$/, "");

const auth0EnabledProviders = new Set(
  (
    optional("AUTH0_ENABLED_PROVIDERS") ||
    "google,facebook,github,discord,twitch,x"
  )
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean),
);

const nodeEnv = process.env.NODE_ENV || "development";
const renderOrigin =
  nodeEnv === "production"
    ? optional("RENDER_EXTERNAL_URL").replace(/\/+$/, "")
    : "";
// JWT_SECRET nunca se hardcodea: sale de .env.
const jwtSecret = required("JWT_SECRET");

if (nodeEnv === "production" && jwtSecret.length < 32) {
  // En produccion exige un secreto suficientemente largo.
  throw new Error("JWT_SECRET must have at least 32 characters in production.");
}

export const env = {
  // Objeto unico de configuracion para que el resto del backend no lea process.env directo.
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: toInteger(process.env.PORT, 4000),
  serverOrigin: optional("SERVER_ORIGIN") || renderOrigin || "http://localhost:4000",
  clientOrigins: (process.env.CLIENT_ORIGIN || renderOrigin || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: required("DATABASE_URL"),
  databaseSsl: toBoolean(process.env.DATABASE_SSL, nodeEnv === "production"),
  databaseSslCa: optional("DATABASE_SSL_CA").replace(/\\n/g, "\n"),
  // El backend utiliza SMTP de Mailtrap para entregar los códigos al buzón configurado.
  mailTransport: optional("EMAIL_TRANSPORT") || "smtp",
  smtpHost: optional("SMTP_HOST") || "sandbox.smtp.mailtrap.io",
  smtpPort: toInteger(process.env.SMTP_PORT, 2525),
  smtpUser: optional("SMTP_USER"),
  smtpPassword: optional("SMTP_PASSWORD"),
  mailFrom: optional("MAIL_FROM") || "cuentas@proyectouno.test",
  jwtSecret,
  jwtIssuer: "proyectouno-api",
  jwtAudience: "proyectouno-web",
  jwtAccessTtlMinutes: toInteger(process.env.JWT_ACCESS_TTL_MINUTES, 15),
  jwtRefreshTtlDays: toInteger(process.env.JWT_REFRESH_TTL_DAYS, 7),
  bcryptSaltRounds: toInteger(process.env.BCRYPT_SALT_ROUNDS, 12),
  cookieSecure:
    nodeEnv === "production" || toBoolean(process.env.COOKIE_SECURE, false),
  // Auth0 actua como broker OIDC: una sola aplicacion centraliza las redes sociales.
  auth0: {
    domain: normalizedAuth0Domain,
    issuerBaseUrl: normalizedAuth0Domain
      ? `https://${normalizedAuth0Domain}`
      : "",
    clientId: optional("AUTH0_CLIENT_ID"),
    clientSecret: optional("AUTH0_CLIENT_SECRET"),
    enabledProviders: auth0EnabledProviders,
    connections: {
      google: optional("AUTH0_GOOGLE_CONNECTION") || "google-oauth2",
      microsoft: optional("AUTH0_MICROSOFT_CONNECTION") || "windowslive",
      facebook: optional("AUTH0_FACEBOOK_CONNECTION") || "facebook",
      github: optional("AUTH0_GITHUB_CONNECTION") || "github",
      discord: optional("AUTH0_DISCORD_CONNECTION") || "discord",
      twitch: optional("AUTH0_TWITCH_CONNECTION") || "twitch",
      x: optional("AUTH0_X_CONNECTION") || "twitter",
    },
  },
  oauth: {
    google: {
      clientId: optional("GOOGLE_CLIENT_ID"),
      clientSecret: optional("GOOGLE_CLIENT_SECRET"),
      redirectUri: optional("GOOGLE_REDIRECT_URI"),
    },
    facebook: {
      clientId: optional("FACEBOOK_CLIENT_ID"),
      clientSecret: optional("FACEBOOK_CLIENT_SECRET"),
      redirectUri: optional("FACEBOOK_REDIRECT_URI"),
      graphVersion: optional("FACEBOOK_GRAPH_VERSION") || "v24.0",
    },
    github: {
      clientId: optional("GITHUB_CLIENT_ID"),
      clientSecret: optional("GITHUB_CLIENT_SECRET"),
      redirectUri: optional("GITHUB_REDIRECT_URI"),
    },
    discord: {
      clientId: optional("DISCORD_CLIENT_ID"),
      clientSecret: optional("DISCORD_CLIENT_SECRET"),
      redirectUri: optional("DISCORD_REDIRECT_URI"),
    },
    twitch: {
      clientId: optional("TWITCH_CLIENT_ID"),
      clientSecret: optional("TWITCH_CLIENT_SECRET"),
      redirectUri: optional("TWITCH_REDIRECT_URI"),
    },
    x: {
      clientId: optional("X_CLIENT_ID"),
      clientSecret: optional("X_CLIENT_SECRET"),
      redirectUri: optional("X_REDIRECT_URI"),
    },
  },
};

