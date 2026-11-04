/**
 * Contiene consultas parametrizadas de sesiones. Resuelve refresh tokens hasheados,
 * rotacion y revocacion.
 *
 * Lectura guiada. Persistencia y revocación de sesiones. Guarda el hash del refresh token
 * y permite rotarlo sin aceptar dos usos simultáneos del mismo valor anterior.
 */
import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";

export const createSession = async (
  { userId, refreshTokenHash, userAgent, ipAddress, expiresAt },
  client = { query },
) => {
  const id = randomUUID();
  await client.query(
    `INSERT INTO user_sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      refreshTokenHash,
      userAgent || null,
      ipAddress || null,
      expiresAt,
    ],
  );
  return id;
};

export const findValidSessionByRefreshHash = async (refreshTokenHash) => {
  const { rows } = await query(
    `SELECT
       user_sessions.id,
       user_sessions.user_id AS "userId",
       user_sessions.expires_at AS "expiresAt",
       users.is_active AS "isActive",
       users.email_verified_at AS "emailVerifiedAt",
       users.login_locked_at AS "loginLockedAt"
     FROM user_sessions
     INNER JOIN users ON users.id = user_sessions.user_id
     WHERE user_sessions.refresh_token_hash = ?
       AND user_sessions.revoked_at IS NULL
       AND user_sessions.expires_at > now()
     LIMIT 1`,
    [refreshTokenHash],
  );
  return rows[0] || null;
};

export const findActiveSessionById = async (sessionId) => {
  const { rows } = await query(
    `SELECT id, user_id AS "userId"
     FROM user_sessions
     WHERE id = ?
       AND revoked_at IS NULL
       AND expires_at > now()
     LIMIT 1`,
    [sessionId],
  );
  return rows[0] || null;
};

export const rotateSession = async ({
  sessionId,
  refreshTokenHash,
  expiresAt,
  previousHash,
}) => {
  // Comparar el hash anterior en el UPDATE evita aceptar dos refresh concurrentes.
  const result = await query(
    `UPDATE user_sessions
     SET refresh_token_hash = ?,
         expires_at = ?
     WHERE id = ?
       AND revoked_at IS NULL AND refresh_token_hash = ? AND expires_at > now()
       AND EXISTS (SELECT 1 FROM users WHERE users.id = user_sessions.user_id AND users.is_active)`,
    [refreshTokenHash, expiresAt, sessionId, previousHash],
  );
  return result.rowCount === 1;
};

export const revokeSession = async (sessionId) => {
  await query(
    `UPDATE user_sessions
     SET revoked_at = now()
     WHERE id = ?
       AND revoked_at IS NULL`,
    [sessionId],
  );
};

export const revokeUserSessionsExcept = async (
  { userId, sessionId },
  client = { query },
) => {
  await client.query(
    `UPDATE user_sessions
     SET revoked_at = now()
     WHERE user_id = ?
       AND id <> ?
       AND revoked_at IS NULL`,
    [userId, sessionId],
  );
};

// Desactivar una cuenta revoca sus sesiones para que no revivan al reactivarla.
export const revokeAllUserSessions = async (userId, client = { query }) => {
  await client.query(
    "UPDATE user_sessions SET revoked_at = now() WHERE user_id = ? AND revoked_at IS NULL",
    [userId],
  );
};

// Exporta: session persistence functions.
// Lo utilizan: auth middleware and auth/user controllers.
// Depende de: backend/config/db.js and node:crypto.
