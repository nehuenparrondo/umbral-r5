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

// Exporta: validateRequest middleware.
// Lo utilizan: backend route validation chains.
// Depende de: express-validator and backend/utils/errors.js.
