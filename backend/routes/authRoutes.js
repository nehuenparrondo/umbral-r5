/**
 * Define endpoints de autenticacion y conecta validaciones/rate
 * limiters/controladores.
 */
import { Router } from "express";
import {
  checkAvailability,
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/authController.js";
import {
  confirmCode,
  requestCode,
  resetPassword,
} from "../controllers/codeController.js";
import {
  requireAuth,
  requireCsrfToken,
} from "../middlewares/authMiddleware.js";
import {
  authLimiter,
  availabilityLimiter,
  loginLimiter,
  codeAttemptLimiter,
  codeLimiter,
} from "../middlewares/rateLimiters.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  availabilityValidation,
  loginValidation,
  registerValidation,
} from "../validations/authValidation.js";
import {
  confirmCodeValidation,
  requestCodeValidation,
  resetPasswordValidation,
} from "../validations/codeValidation.js";
import { asyncHandler } from "../utils/errors.js";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "../config/cookies.js";

const router = Router();

router.post(
  "/codes/request",
  codeLimiter,
  requestCodeValidation,
  validateRequest,
  asyncHandler(requestCode),
);
router.post(
  "/codes/confirm",
  codeAttemptLimiter,
  confirmCodeValidation,
  validateRequest,
  asyncHandler(confirmCode),
);
router.post(
  "/password/reset",
  codeAttemptLimiter,
  resetPasswordValidation,
  validateRequest,
  asyncHandler(resetPassword),
);

router.get(
  "/check-availability",
  availabilityLimiter,
  availabilityValidation,
  validateRequest,
  asyncHandler(checkAvailability),
);
router.post(
  "/register",
  authLimiter,
  registerValidation,
  validateRequest,
  asyncHandler(register),
);
router.post(
  "/login",
  loginLimiter,
  loginValidation,
  validateRequest,
  asyncHandler(login),
);
router.post("/refresh", authLimiter, asyncHandler(refresh));
// Consultar sesion al abrir la web es normal: devuelve 200 si es visitante.
// Las rutas privadas mantienen sus 401/403; aqui no se entregan datos sin verificar.
router.get("/session", async (req, res, next) => {
  const anonymous = () =>
    res.json({
      user: null,
      csrfToken: null,
      refreshRequired: Boolean(req.cookies?.[REFRESH_COOKIE_NAME]),
    });
  if (!req.cookies?.[ACCESS_COOKIE_NAME]) return anonymous();
  await requireAuth(req, res, (error) => {
    if (error?.statusCode === 401) return anonymous();
    if (error) return next(error);
    return me(req, res);
  });
});
router.get("/me", asyncHandler(requireAuth), asyncHandler(me));
router.post(
  "/logout",
  asyncHandler(requireAuth),
  requireCsrfToken,
  asyncHandler(logout),
);

export default router;

// This file exports: authRoutes router.
// It is used by: backend/app.js under /api/auth.
// It imports from: auth controllers, auth middlewares, rate limiters, validators, and errors.
