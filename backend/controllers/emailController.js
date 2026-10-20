/**
 * Cambia el email solamente despues de validar clave local y codigo Mailtrap.
 */
import bcrypt from "bcrypt";
import { writeAuditLog } from "../models/auditLogModel.js";
import { revokeUserSessionsExcept } from "../models/sessionModel.js";
import {
  findDuplicates,
  findPublicUserById,
  findUserByIdForPassword,
} from "../models/userModel.js";
import {
  consumeChallenge,
  invalidateChallenges,
  issueChallenge,
} from "../services/challengeService.js";
import { AppError } from "../utils/errors.js";
import { normalizeIdentifier } from "../utils/normalizers.js";

export async function requestEmailChange(req, res) {
  const user = await findUserByIdForPassword(req.user.id);
  if (
    !user.passwordHash ||
    !(await bcrypt.compare(req.body.currentPassword, user.passwordHash))
  ) {
    throw new AppError("La contrasena actual no es correcta.", 400, [
      {
        field: "currentPassword",
        message: user.passwordHash
          ? "Revisa la contrasena actual."
          : "Primero crea una contrasena local en tu perfil.",
      },
    ]);
  }

  const email = normalizeIdentifier(req.body.email);
  if (email === user.email) {
    throw new AppError("Ingresa un email diferente al actual.", 400);
  }
  if ((await findDuplicates({ email, username: "" })).emailTaken) {
    throw new AppError("Email ya en uso.", 409, [
      { field: "email", message: "Email ya en uso." },
    ]);
  }

  res.status(202).json(
    await issueChallenge({
      userId: user.id,
      purpose: "change_email",
      targetEmail: email,
    }),
  );
}

export async function confirmEmailChange(req, res) {
  const user = await consumeChallenge(
    { ...req.body, purpose: "change_email", expectedUserId: req.user.id },
    async ({ client, user: account, targetEmail }) => {
      await client.query(
        `UPDATE users
         SET email = ?, email_verified_at = now()
         WHERE id = ?`,
        [targetEmail, account.id],
      );
      await invalidateChallenges(account.id, client);
      await revokeUserSessionsExcept(
        { userId: account.id, sessionId: req.auth.sessionId },
        client,
      );
      await writeAuditLog(
        {
          action: "EMAIL_CHANGE",
          actorUserId: account.id,
          targetUserId: account.id,
          req,
        },
        client,
      );
      return findPublicUserById(account.id, client);
    },
  );

  res.json({ user, message: "Email actualizado." });
}

// This file exports: requestEmailChange and confirmEmailChange.
// It is used by: userRoutes.
// It imports from: challenges, user/session/audit models and bcrypt.
