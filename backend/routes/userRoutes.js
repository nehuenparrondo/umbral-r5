/**
 * Define endpoints protegidos del perfil propio y cambio de contrasena.
 *
 * Lectura guiada. Tabla de endpoints: conecta método/ruta con validaciones, permisos y
 * controlador. La ruta recibe solicitudes HTTP; los modelos y servicios contienen el
 * trabajo sobre datos.
 */
import { Router } from "express";
import {
  changePassword,
  getOAuthAccounts,
  getProfile,
  updateProfile,
} from "../controllers/userController.js";
import {
  confirmEmailChange,
  requestEmailChange,
} from "../controllers/emailController.js";
import {
  requireAuth,
  requireCsrfToken,
} from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/errors.js";
import {
  passwordChangeValidation,
  profileValidation,
  emailChangeConfirmValidation,
  emailChangeRequestValidation,
} from "../validations/userValidation.js";

const router = Router();

router.use(asyncHandler(requireAuth));

router.get("/me", asyncHandler(getProfile));
router.get("/me/oauth-accounts", asyncHandler(getOAuthAccounts));
router.put(
  "/me",
  requireCsrfToken,
  profileValidation,
  validateRequest,
  asyncHandler(updateProfile),
);
router.patch(
  "/me/password",
  requireCsrfToken,
  passwordChangeValidation,
  validateRequest,
  asyncHandler(changePassword),
);
router.post(
  "/me/email/request",
  requireCsrfToken,
  emailChangeRequestValidation,
  validateRequest,
  asyncHandler(requestEmailChange),
);
router.post(
  "/me/email/confirm",
  requireCsrfToken,
  emailChangeConfirmValidation,
  validateRequest,
  asyncHandler(confirmEmailChange),
);

export default router;

// Exporta: userRoutes router.
// Lo utilizan: backend/app.js under /api/users.
// Depende de: user controllers, auth/validation middlewares, validators, and errors.
