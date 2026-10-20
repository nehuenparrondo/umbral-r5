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

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// This file exports: AppError and asyncHandler.
// It is used by: controllers, middlewares, and routes.
// It imports from: no project files.
