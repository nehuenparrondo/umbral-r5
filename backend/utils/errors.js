/**
 * Define AppError y asyncHandler. Resuelve errores operacionales y control
 * asincronico.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Envuelve un controlador asíncrono de Express y envía los rechazos a next(error).
 * Así errorHandler responde de forma uniforme y cada ruta no necesita repetir try/catch.
 */
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

