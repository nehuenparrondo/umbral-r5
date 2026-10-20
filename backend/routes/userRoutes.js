/**
 * Define endpoints protegidos del perfil propio y cambio de contrasena.
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

// This file exports: userRoutes router.
// It is used by: backend/app.js under /api/users.
// It imports from: user controllers, auth/validation middlewares, validators, and errors.
