/**
 * Convierte errores de express-validator en respuestas por campo. Resuelve validacion
 * backend clara.
 */
import { validationResult } from "express-validator";
import { AppError } from "../utils/errors.js";

/**
 * Recoge los resultados de express-validator ejecutado antes en la ruta.
 * Si no hay errores continúa; si los hay envía AppError 422 con un mensaje por campo para que el
 * formulario pueda mostrarlos.
 */
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

