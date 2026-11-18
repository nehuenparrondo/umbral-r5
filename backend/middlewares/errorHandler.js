/**
 * Centraliza errores sin exponer stack traces. Resuelve manejo seguro de errores.
 *
 * Lectura guiada. Última traducción de errores a respuestas HTTP legibles. Evita devolver
 * detalles internos innecesarios y centraliza cómo una excepción llega al formulario.
 */
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

/**
 * Convierte una ruta HTTP sin coincidencias en AppError 404 y la envía al manejador central
 * mediante next.
 */
export const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404));
};

/**
 * Último middleware de errores de Express. Traduce fallos de conexión SQL a 503 y conflictos únicos
 * a 409.
 * Devuelve message/details/code según el error y oculta detalles internos en respuestas 500; en
 * desarrollo registra solo datos técnicos acotados.
 */
export const errorHandler = (error, _req, res, _next) => {
  // Una interrupcion SQL es un servicio no disponible, no una contrasena mala.
  const unavailable = [
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "PROTOCOL_CONNECTION_LOST",
    "ER_CON_COUNT_ERROR",
    "ER_ACCESS_DENIED_ERROR",
    "ER_BAD_DB_ERROR",
    "ER_NO_SUCH_TABLE",
    "ER_SERVER_SHUTDOWN",
  ].includes(error?.code);
  if (unavailable) {
    return res.status(503).json({
      message:
        "La base de datos no esta disponible. Intenta nuevamente mas tarde.",
      details: null,
      code: null,
    });
  }
  const isUniqueViolation = error?.code === "ER_DUP_ENTRY";
  // UNIQUE resuelve tambien dos altas simultaneas; devuelve el campo que colisiono.
  if (isUniqueViolation) {
    const field = error.sqlMessage?.includes("users_email_normalized_uq")
      ? "email"
      : error.sqlMessage?.includes("users_username_normalized_uq")
        ? "username"
        : null;
    return res.status(409).json({
      message: "Ya existe un registro con esos datos.",
      details: field
        ? [
            {
              field,
              message:
                field === "email"
                  ? "Ese email ya esta registrado."
                  : "Ese username ya esta en uso.",
            },
          ]
        : null,
      code: null,
    });
  }
  const statusCode = isUniqueViolation ? 409 : error.statusCode || 500;
  const message = isUniqueViolation
    ? "Ya existe un registro con esos datos."
    : error.message;

  if (!error.isOperational && !env.isProduction) {
    // No volcar la consulta SQL, parametros, cookies ni stack por cada intento.
    console.error(
      `Error interno (${error.code || error.name || "desconocido"}).`,
    );
  }

  res.status(statusCode).json({
    message: statusCode >= 500 ? "Ocurrio un error interno." : message,
    details: statusCode >= 500 ? null : error.details || null,
    code: statusCode >= 500 ? null : error.publicCode || null,
  });
};

