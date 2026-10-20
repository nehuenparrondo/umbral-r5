/**
 * Genera y verifica JWT, CSRF y refresh tokens. Resuelve autenticacion segura y
 * rotacion.
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

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

export const verifyAccessToken = (token) =>
  // Verifica firma, issuer y audience para rechazar tokens de otro origen.
  jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

// This file exports: JWT, refresh-token, and CSRF token helpers.
// It is used by: auth middleware and auth controller.
// It imports from: node:crypto, jsonwebtoken, backend/config/env.js.
