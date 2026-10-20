/**
 * Centraliza nombres y opciones de cookies httpOnly. Resuelve JWT seguro, SameSite,
 * Secure y expiracion.
 */
import { env } from "./env.js";

export const ACCESS_COOKIE_NAME = "proyectouno_access";
export const REFRESH_COOKIE_NAME = "proyectouno_refresh";

export const accessCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.cookieSecure,
  path: "/",
  maxAge: env.jwtAccessTtlMinutes * 60 * 1000,
};

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.cookieSecure,
  // /session comprueba si existe refresh sin exponerlo a JavaScript.
  path: "/api/auth",
  maxAge: env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000,
};

export const expiredRefreshCookieOptions = {
  ...refreshCookieOptions,
  maxAge: 0,
};

export const expiredAccessCookieOptions = {
  ...accessCookieOptions,
  maxAge: 0,
};

// This file exports: cookie names and secure cookie options.
// It is used by: auth controllers and token/session flows.
// It imports from: backend/config/env.js.
