/**
 * Define limites de intentos para auth. Resuelve defensa contra fuerza bruta y spam.
 *
 * Lectura guiada. Límites de solicitudes para reducir abuso en operaciones sensibles. La
 * espera se aplica en el servidor, no solo deshabilitando un botón del navegador.
 */
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * Respuesta compartida HTTP 429 cuando se agotó el límite de solicitudes.
 * La ventana y cantidad permitida dependen del limitador de cada ruta, no del botón del frontend.
 */
const jsonRateLimitHandler = (_req, res) => {
  res.status(429).json({
    message: "Demasiados intentos. Proba nuevamente mas tarde.",
  });
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: jsonRateLimitHandler,
});

export const availabilityLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.redirect(
      303,
      new URL(
        "/login?error=oauth_rate_limited",
        env.clientOrigins[0],
      ).toString(),
    ),
});

export const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

export const codeAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

