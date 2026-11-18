/**
 * Implementa perfil propio y cambio de contrasena. Resuelve privacidad por usuario,
 * validacion de contrasena actual y revocacion de sesiones.
 *
 * Lectura guiada. Operaciones de perfil y contraseña de la cuenta autenticada. La
 * identidad viene del middleware de sesión; no se permite escoger otro usuario cambiando
 * un campo del formulario.
 */
import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { writeAuditLog } from "../models/auditLogModel.js";
import { listOAuthAccountsByUserId } from "../models/oauthAccountModel.js";
import { revokeUserSessionsExcept } from "../models/sessionModel.js";
import {
  findDuplicates,
  findUserByIdForPassword,
  updatePasswordHash,
  updateUserProfile,
} from "../models/userModel.js";
import { AppError } from "../utils/errors.js";
import { cleanDisplayName, normalizeIdentifier } from "../utils/normalizers.js";
import { withTransaction } from "../config/db.js";
import { invalidateChallenges } from "../services/challengeService.js";

/**
 * Responde con el perfil público que requireAuth obtuvo desde SQL para la sesión actual.
 */
export const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * Lista las redes vinculadas al usuario autenticado. Solo devuelve proveedor, email de la red y
 * fecha, sin tokens de proveedores.
 */
export const getOAuthAccounts = async (req, res) => {
  const accounts = await listOAuthAccountsByUserId(req.user.id);
  res.json({ accounts });
};

/**
 * Normaliza username/nombre visible y comprueba duplicados excluyendo a la propia cuenta.
 * Actualiza perfil y auditoría en una transacción y devuelve {user}. Esta operación no cambia
 * email, contraseña ni rol.
 */
export const updateProfile = async (req, res) => {
  // El email usa un flujo separado: solo cambia despues del codigo Mailtrap.
  const username = normalizeIdentifier(req.body.username);
  const displayName = cleanDisplayName(req.body.displayName) || username;
  const duplicates = await findDuplicates({
    email: "",
    username,
    excludeUserId: req.user.id,
  });

  if (duplicates.usernameTaken) {
    throw new AppError(
      "No se pudo actualizar el perfil.",
      409,
      [
        duplicates.usernameTaken
          ? { field: "username", message: "Ese username ya esta en uso." }
          : null,
      ].filter(Boolean),
    );
  }

  const updatedUser = await withTransaction(async (client) => {
    const updated = await updateUserProfile(
      {
        id: req.user.id,
        username,
        displayName,
      },
      client,
    );

    await writeAuditLog(
      {
        actorUserId: req.user.id,
        action: "PROFILE_UPDATE",
        targetUserId: req.user.id,
        req,
        metadata: { username: updated.username },
      },
      client,
    );
    return updated;
  });

  res.json({ user: updatedUser });
};

/**
 * Si ya hay contraseña local, compara la actual con bcrypt; una cuenta social sin hash puede crear
 * la primera.
 * Genera el hash de la nueva, lo guarda, revoca las otras sesiones, invalida desafíos y audita en
 * una transacción.
 * Conserva la sesión actual y devuelve el perfil con hasPassword; nunca devuelve la contraseña ni
 * su hash.
 */
export const changePassword = async (req, res) => {
  const userForPassword = await findUserByIdForPassword(req.user.id);
  const passwordMatches = userForPassword.passwordHash
    ? await bcrypt.compare(
        req.body.currentPassword || "",
        userForPassword.passwordHash,
      )
    : true;

  if (userForPassword.passwordHash && !passwordMatches) {
    throw new AppError("La contrasena actual no es correcta.", 400, [
      { field: "currentPassword", message: "Revisa la contrasena actual." },
    ]);
  }

  const newPasswordHash = await bcrypt.hash(
    req.body.newPassword,
    env.bcryptSaltRounds,
  );

  // Si no puede registrarse la auditoria, tampoco se cambia la contrasena.
  await withTransaction(async (client) => {
    await updatePasswordHash(
      { id: req.user.id, passwordHash: newPasswordHash },
      client,
    );
    await revokeUserSessionsExcept(
      {
        userId: req.user.id,
        sessionId: req.auth.sessionId,
      },
      client,
    );
    await invalidateChallenges(req.user.id, client);
    await writeAuditLog(
      {
        actorUserId: req.user.id,
        action: userForPassword.passwordHash
          ? "PASSWORD_CHANGE"
          : "PASSWORD_SET",
        targetUserId: req.user.id,
        req,
      },
      client,
    );
  });

  res.json({
    message: "Contrasena actualizada correctamente.",
    user: { ...req.user, hasPassword: true },
  });
};

