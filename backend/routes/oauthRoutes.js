/**
 * Publica las rutas genericas de inicio, callback y proveedores OAuth.
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

// This file exports: oauthRoutes router.
// It is used by: backend/app.js under /api/auth/oauth.
// It imports from: OAuth controller, rate limiter and async handler.
