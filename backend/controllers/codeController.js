/**
 * Verifica email, desbloquea cuentas y recupera contrasenas con Mailtrap.
 */
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { writeAuditLog } from "../models/auditLogModel.js";
import { revokeAllUserSessions } from "../models/sessionModel.js";
import {
  findPublicUserById,
  findUserByIdentifierForAuth,
  updatePasswordHash,
} from "../models/userModel.js";
import {
  clearAuthCookies,
  issueNewSession,
  setAuthCookies,
} from "./authController.js";
import {
  consumeChallenge,
  invalidateChallenges,
  issueChallenge,
} from "../services/challengeService.js";
import { ensureMailConfigured } from "../services/mailService.js";
import { AppError } from "../utils/errors.js";

export async function requestCode(req, res) {
  ensureMailConfigured();
  const user = await findUserByIdentifierForAuth(req.body.identifier);
  const purpose = req.body.purpose;
  let challengeId = randomUUID();

  // Mismo formato para cuentas inexistentes: no permite enumerar usuarios.
  if (
    user?.isActive &&
    (purpose === "verify_email"
      ? !user.emailVerifiedAt
      : Boolean(user.emailVerifiedAt))
  ) {
    ({ challengeId } = await issueChallenge({
      userId: user.id,
      purpose,
      targetEmail: user.email,
    }));
    await writeAuditLog({
      action: "EMAIL_CODE_REQUESTED",
      targetUserId: user.id,
      req,
      metadata: { purpose },
    });
  }

  res.status(202).json({
    challengeId,
    message:
      "Si la cuenta corresponde, recibiras un codigo en Mailtrap/correo.",
  });
}

export async function confirmCode(req, res) {
  const { challengeId, code, purpose } = req.body;
  const result = await consumeChallenge(
    { challengeId, code, purpose },
    async ({ client, user }) => {
      if (purpose === "unlock" && !user.emailVerifiedAt) {
        throw new AppError("Primero verifica tu email.", 403);
      }

      await client.query(
        `UPDATE users
         SET email_verified_at = COALESCE(email_verified_at, now()),
             failed_login_attempts = 0,
             login_locked_at = NULL
         WHERE id = ?`,
        [user.id],
      );
      await revokeAllUserSessions(user.id, client);
      await invalidateChallenges(user.id, client);
      await writeAuditLog(
        {
          action:
            purpose === "verify_email" ? "EMAIL_VERIFIED" : "ACCESS_RECOVERED",
          actorUserId: user.id,
          targetUserId: user.id,
          req,
        },
        client,
      );

      // Verificar email vuelve al login; desbloquear inicia una sesion segura.
      if (purpose === "verify_email") return null;
      const publicUser = await findPublicUserById(user.id, client);
      return {
        user: publicUser,
        tokens: await issueNewSession({ user: publicUser, req, client }),
      };
    },
  );

  if (!result) {
    return res.json({ message: "Email verificado. Ya podes iniciar sesion." });
  }
  setAuthCookies(res, result.tokens);
  return res.json({ user: result.user, csrfToken: result.tokens.csrfToken });
}

export async function resetPassword(req, res) {
  const passwordHash = await bcrypt.hash(
    req.body.newPassword,
    env.bcryptSaltRounds,
  );
  await consumeChallenge(
    { ...req.body, purpose: "reset_password" },
    async ({ client, user }) => {
      await updatePasswordHash({ id: user.id, passwordHash }, client);
      await revokeAllUserSessions(user.id, client);
      await invalidateChallenges(user.id, client);
      await writeAuditLog(
        {
          action: "PASSWORD_RESET",
          actorUserId: user.id,
          targetUserId: user.id,
          req,
        },
        client,
      );
    },
  );
  clearAuthCookies(res);
  res.json({ message: "Contrasena actualizada. Inicia sesion nuevamente." });
}

// This file exports: requestCode, confirmCode and resetPassword.
// It is used by: authRoutes.
// It imports from: challenges, auth sessions, MySQL models and bcrypt.
