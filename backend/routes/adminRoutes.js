/**
 * Define endpoints protegidos de administracion con verificacion de rol admin.
 *
 * Lectura guiada. Tabla de endpoints: conecta método/ruta con validaciones, permisos y
 * controlador. La ruta recibe solicitudes HTTP; los modelos y servicios contienen el
 * trabajo sobre datos.
 */
import { Router } from "express";
import {
  getUsers,
  updateUserAsAdmin,
  getAuditLogs,
} from "../controllers/adminController.js";
import { query } from "express-validator";
import {
  requireAuth,
  requireCsrfToken,
  requireRole,
} from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/errors.js";
import { adminUpdateUserValidation } from "../validations/userValidation.js";

const router = Router();

router.use(asyncHandler(requireAuth));
router.use(requireRole("admin"));

router.get("/users", asyncHandler(getUsers));
// La auditoria comparte requireAuth + requireRole: un usuario normal recibe 403.
router.get(
  "/audit",
  query("action")
    .optional({ values: "falsy" })
    .isIn([
      "LOGIN_SUCCESS",
      "LOGIN_FAILURE",
      "USER_REGISTER",
      "LOGOUT",
      "PASSWORD_CHANGE",
      "PROFILE_UPDATE",
      "ADMIN_LIST_USERS",
      "ADMIN_UPDATE_USER",
      "ADMIN_VIEW_AUDIT",
    ]),
  validateRequest,
  asyncHandler(getAuditLogs),
);
router.patch(
  "/users/:id",
  requireCsrfToken,
  adminUpdateUserValidation,
  validateRequest,
  asyncHandler(updateUserAsAdmin),
);

export default router;

// Exporta: adminRoutes router.
// Lo utilizan: backend/app.js under /api/admin.
// Depende de: admin controllers, auth/validation middlewares, validators, and errors.
