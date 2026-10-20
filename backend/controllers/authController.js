/**
 * Conserva registro/login R3 con Mailtrap y comparte la misma sesion con OAuth.
 */
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  expiredAccessCookieOptions,
  expiredRefreshCookieOptions,
  refreshCookieOptions,
} from "../config/cookies.js";
import { withTransaction } from "../config/db.js";
import { env } from "../config/env.js";
import { writeAuditLog } from "../models/auditLogModel.js";
import {
  createSession,
  findValidSessionByRefreshHash,
  revokeAllUserSessions,
  revokeSession,
  rotateSession,
} from "../models/sessionModel.js";
import {
  createUser,
  findDuplicates,
  findPublicUserById,
  findUserByIdentifierForAuth,
  findUserByIdForPassword,
} from "../models/userModel.js";
import { issueChallenge } from "../services/challengeService.js";
import { ensureMailConfigured } from "../services/mailService.js";
import {
  createCsrfToken,
  createRefreshToken,
  hashToken,
  refreshExpiryDate,
  signAccessToken,
} from "../services/tokenService.js";
import { AppError } from "../utils/errors.js";
import { cleanDisplayName, normalizeIdentifier } from "../utils/normalizers.js";

// Comparar siempre contra bcrypt reduce diferencias de tiempo si el usuario no existe.
const dummyPasswordHash = bcrypt.hashSync(
  randomBytes(32).toString("hex"),
  env.bcryptSaltRounds,
);

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, expiredAccessCookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, expiredRefreshCookieOptions);
};

// Un unico emisor de sesiones sirve al login tradicional, codigos y OAuth.
export const issueNewSession = async ({ user, req, client }) => {
  const refreshToken = createRefreshToken();
  const sessionId = await createSession(
    {
      userId: user.id,
      refreshTokenHash: refreshToken.tokenHash,
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
      expiresAt: refreshExpiryDate(),
    },
    client,
  );
  const csrfToken = createCsrfToken();
  return {
    accessToken: signAccessToken({ user, sessionId, csrfToken }),
    refreshToken: refreshToken.rawToken,
    csrfToken,
  };
};

export async function register(req, res) {
  // R3 no crea una cuenta tradicional si no hay forma de verificar su email.
  ensureMailConfigured();
  const email = normalizeIdentifier(req.body.email);
  const username = normalizeIdentifier(req.body.username);
  const duplicates = await findDuplicates({ email, username });

  if (duplicates.emailTaken || duplicates.usernameTaken) {
    throw new AppError("Revisa los campos indicados.", 409, [
      ...(duplicates.emailTaken
        ? [{ field: "email", message: "Email ya en uso." }]
        : []),
      ...(duplicates.usernameTaken
        ? [{ field: "username", message: "Nombre de usuario ya en uso." }]
        : []),
    ]);
  }

  const passwordHash = await bcrypt.hash(
    req.body.password,
    env.bcryptSaltRounds,
  );
  const user = await withTransaction(async (client) => {
    const created = await createUser(
      {
        email,
        username,
        displayName: cleanDisplayName(req.body.displayName) || username,
        passwordHash,
      },
      client,
    );
    await writeAuditLog(
      {
        actorUserId: created.id,
        targetUserId: created.id,
        action: "USER_REGISTER",
        req,
      },
      client,
    );
    return created;
  });

  // El registro termina en la pantalla de codigo; la sesion nace al verificar.
  try {
    const challenge = await issueChallenge({
      userId: user.id,
      purpose: "verify_email",
      targetEmail: user.email,
    });
    res.status(201).json({
      ...challenge,
      verificationRequired: true,
      identifier: user.email,
      message: "Revisa Mailtrap o tu correo para verificar la cuenta.",
    });
  } catch (_error) {
    res.status(201).json({
      verificationRequired: true,
      challengeId: null,
      identifier: user.email,
      message:
        "Cuenta creada. No se pudo enviar el correo; solicita otro desde Verificar email.",
    });
  }
}

export async function login(req, res) {
  const found = await findUserByIdentifierForAuth(req.body.identifier);

  if (!found) {
    await bcrypt.compare(req.body.password, dummyPasswordHash);
    await writeAuditLog({ action: "LOGIN_FAILURE", req });
    throw new AppError(
      "Usuario o contrasena incorrectos. Si no podes ingresar, usa un codigo de acceso.",
      401,
    );
  }

  const result = await withTransaction(async (client) => {
    // FOR UPDATE evita que dos intentos simultaneos pierdan el contador.
    const user = await findUserByIdForPassword(found.id, client, true);
    const passwordMatches = await bcrypt.compare(
      req.body.password,
      user?.passwordHash || dummyPasswordHash,
    );

    if (!user?.isActive || user.loginLockedAt || !passwordMatches) {
      let justLocked = false;
      if (user?.isActive && !user.loginLockedAt) {
        const attempts = user.failedAttempts + 1;
        await client.query(
          `UPDATE users
           SET failed_login_attempts = ?,
               login_locked_at = CASE WHEN ? >= 3 THEN now() ELSE NULL END
           WHERE id = ?`,
          [attempts, attempts, user.id],
        );
        justLocked = attempts >= 3;
        if (justLocked) {
          await revokeAllUserSessions(user.id, client);
          await writeAuditLog(
            { action: "ACCOUNT_LOCKED", targetUserId: user.id, req },
            client,
          );
        }
      }
      await writeAuditLog(
        { action: "LOGIN_FAILURE", targetUserId: user?.id || null, req },
        client,
      );
      return { failed: true, justLocked, user };
    }

    if (!user.emailVerifiedAt) return { verificationRequired: true };

    await client.query(
      "UPDATE users SET failed_login_attempts = 0 WHERE id = ?",
      [user.id],
    );
    const publicUser = await findPublicUserById(user.id, client);
    const tokens = await issueNewSession({ user: publicUser, req, client });
    await writeAuditLog(
      {
        action: "LOGIN_SUCCESS",
        actorUserId: user.id,
        targetUserId: user.id,
        req,
      },
      client,
    );
    return { user: publicUser, tokens };
  });

  if (result.failed) {
    if (result.justLocked) {
      try {
        await issueChallenge({
          userId: result.user.id,
          purpose: result.user.emailVerifiedAt ? "unlock" : "verify_email",
          targetEmail: result.user.email,
        });
      } catch (_error) {
        // La pantalla de recuperacion permite volver a pedir el codigo.
      }
    }
    throw new AppError(
      "Usuario o contrasena incorrectos. Si no podes ingresar, usa un codigo de acceso.",
      401,
    );
  }

  if (result.verificationRequired) {
    const error = new AppError("Primero verifica tu email.", 403);
    error.publicCode = "EMAIL_VERIFICATION_REQUIRED";
    throw error;
  }

  setAuthCookies(res, result.tokens);
  res.json({ user: result.user, csrfToken: result.tokens.csrfToken });
}

export async function refresh(req, res) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const session =
    rawToken && (await findValidSessionByRefreshHash(hashToken(rawToken)));

  if (
    !session ||
    !session.isActive ||
    !session.emailVerifiedAt ||
    session.loginLockedAt
  ) {
    clearAuthCookies(res);
    throw new AppError("Sesion expirada.", 401);
  }

  const user = await findPublicUserById(session.userId);
  const refreshToken = createRefreshToken();
  const csrfToken = createCsrfToken();
  const rotated = await rotateSession({
    sessionId: session.id,
    refreshTokenHash: refreshToken.tokenHash,
    expiresAt: session.expiresAt,
    previousHash: hashToken(rawToken),
  });
  if (!rotated) throw new AppError("Sesion expirada.", 401);

  setAuthCookies(res, {
    accessToken: signAccessToken({ user, sessionId: session.id, csrfToken }),
    refreshToken: refreshToken.rawToken,
  });
  res.json({ user, csrfToken });
}

export const me = async (req, res) =>
  res.json({ user: req.user, csrfToken: req.auth.csrfToken });

export async function logout(req, res) {
  await revokeSession(req.auth.sessionId);
  await writeAuditLog({
    action: "LOGOUT",
    actorUserId: req.user.id,
    targetUserId: req.user.id,
    req,
  });
  clearAuthCookies(res);
  res.status(204).send();
}

export async function checkAvailability(req, res) {
  const duplicate = await findDuplicates({
    email: req.query.email || "",
    username: req.query.username || "",
  });
  res.json({
    emailAvailable: req.query.email ? !duplicate.emailTaken : null,
    usernameAvailable: req.query.username ? !duplicate.usernameTaken : null,
  });
}

// This file exports: traditional auth handlers and shared session helpers.
// It is used by: authRoutes, oauthController and codeController.
// It imports from: cookies, MySQL models, Mailtrap challenges, bcrypt and JWT helpers.
