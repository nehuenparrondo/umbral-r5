/**
 * Convierte errores de express-validator en respuestas por campo. Resuelve validacion
 * backend clara.
 */
import { validationResult } from "express-validator";
import { AppError } from "../utils/errors.js";

export const validateRequest = (req, _res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  const details = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  next(new AppError("Hay datos invalidos.", 422, details));
};

// This file exports: validateRequest middleware.
// It is used by: backend route validation chains.
// It imports from: express-validator and backend/utils/errors.js.
