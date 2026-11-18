/**
 * Centraliza nombres y opciones de cookies httpOnly. Resuelve JWT seguro, SameSite,
 * Secure y expiracion.
 *
 * Lectura guiada. Política común de cookies de acceso y renovación. La configuración debe
 * coincidir al crearlas y borrarlas; las cookies de sesión no son datos de perfil
 * editables.
 */
import { env } from "./env.js";

export const ACCESS_COOKIE_NAME = "proyectouno_access";
export const REFRESH_COOKIE_NAME = "proyectouno_refresh";

// HttpOnly impide leer el JWT desde JavaScript; Secure exige HTTPS cuando corresponde.
// maxAge es duración de cookie, y el JWT/SQL comprueban también sus propios vencimientos.
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

