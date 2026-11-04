/**
 * Genera y verifica JWT, CSRF y refresh tokens. Resuelve autenticacion segura y
 * rotacion.
 *
 * Lectura guiada. Crea los distintos tipos de credencial: JWT corto para acceso, refresh
 * aleatorio para renovar y CSRF para autorizar peticiones que cambian datos. No son
 * intercambiables.
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

/**
 * Devuelve dos representaciones del mismo secreto: rawToken para la cookie y tokenHash
 * para SQL. No registrar rawToken en logs ni enviarlo en datos públicos del perfil.
 */
export const createRefreshToken = () => {
  // Token crudo aleatorio: se envia al navegador como cookie httpOnly.
  const rawToken = crypto.randomBytes(64).toString("hex");
  // Hash irreversible: se guarda en SQL, no el token crudo.
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
};

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refreshExpiryDate = () => {
  // Calcula expiracion relativa al momento de emision del refresh token.
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.jwtRefreshTtlDays);
  return expiresAt;
};

/**
 * Firma un JWT con ID, rol, sesión y CSRF; incluye vencimiento, emisor y audiencia. Firmar
 * permite detectar modificaciones, no cifra los datos del token.
 */
export const signAccessToken = ({ user, sessionId, csrfToken }) =>
  // JWT corto: identifica usuario, rol, sesion y CSRF.
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      sessionId,
      csrfToken,
    },
    env.jwtSecret,
    {
      expiresIn: `${env.jwtAccessTtlMinutes}m`,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
      jwtid: crypto.randomUUID(),
    },
  );

/**
 * Comprueba firma, vencimiento, emisor y audiencia del JWT. La vigencia de la sesión en
 * SQL se comprueba además en el middleware.
 */
export const verifyAccessToken = (token) =>
  // Verifica firma, issuer y audience para rechazar tokens de otro origen.
  jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

// Exporta: JWT, refresh-token, and CSRF token helpers.
// Lo utilizan: auth middleware and auth controller.
// Depende de: node:crypto, jsonwebtoken, backend/config/env.js.
