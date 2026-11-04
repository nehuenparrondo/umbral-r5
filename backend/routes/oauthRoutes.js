/**
 * Publica las rutas genericas de inicio, callback y proveedores OAuth.
 *
 * Lectura guiada. Tabla de endpoints: conecta método/ruta con validaciones, permisos y
 * controlador. La ruta recibe solicitudes HTTP; los modelos y servicios contienen el
 * trabajo sobre datos.
 */
import { Router } from "express";
import {
  listProviders,
  oauthCallback,
  startOAuth,
} from "../controllers/oauthController.js";
import { oauthLimiter } from "../middlewares/rateLimiters.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.get("/providers", listProviders);
router.get("/:provider", oauthLimiter, asyncHandler(startOAuth));
router.get("/:provider/callback", oauthLimiter, asyncHandler(oauthCallback));

export default router;

// Exporta: oauthRoutes router.
// Lo utilizan: backend/app.js under /api/auth/oauth.
// Depende de: OAuth controller, rate limiter and async handler.
