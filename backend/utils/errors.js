/**
 * Define AppError y asyncHandler. Resuelve errores operacionales y control
 * asincronico.
 *
 * Lectura guiada. Ayudas compartidas para transformar o validar datos. Usarlas desde
 * varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito
 * en la interfaz.
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

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// Exporta: AppError and asyncHandler.
// Lo utilizan: controllers, middlewares, and routes.
// Depende de: no project files.
