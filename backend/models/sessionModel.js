/**
 * Contiene consultas parametrizadas de sesiones. Resuelve refresh tokens hasheados,
 * rotacion y revocacion.
 *
 * Lectura guiada. Persistencia y revocación de sesiones. Guarda el hash del refresh token
 * y permite rotarlo sin aceptar dos usos simultáneos del mismo valor anterior.
 */
import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";

/**
 * Crea un UUID y guarda userId, hash del refresh, vencimiento y contexto de conexión. Devuelve el
 * id.
 * El token legible no se persiste; el client opcional permite emitir la sesión dentro de otra
 * transacción.
 */
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

/**
 * Busca una sesión no revocada ni vencida a partir del hash del refresh y devuelve también el
 * estado de su usuario.
 * No rechaza por sí sola usuarios inactivos/bloqueados: refresh comprueba esas banderas antes de
 * renovar.
 */
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

/**
 * Devuelve id/userId de una sesión vigente o null. requireAuth la usa junto con el JWT para
 * detectar revocaciones inmediatamente.
 */
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

/**
 * Sustituye el hash solo si aún coincide con previousHash y la sesión y cuenta siguen habilitadas.
 * Devuelve true cuando se actualizó una fila. Esta comparación hace que un refresh viejo no pueda
 * renovarse dos veces.
 */
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

/**
 * Marca una sesión como revocada si aún estaba activa. Conserva la fila para trazabilidad; no
 * elimina la cuenta.
 */
export const revokeSession = async (sessionId) => {
  await query(
    `UPDATE user_sessions
     SET revoked_at = now()
     WHERE id = ?
       AND revoked_at IS NULL`,
    [sessionId],
  );
};

/**
 * Revoca las sesiones de un usuario salvo sessionId. Se usa en cambios sensibles para conservar el
 * dispositivo actual.
 * Con client, la revocación se confirma junto con el cambio de contraseña o email.
 */
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
/**
 * Marca revocadas todas las sesiones pendientes de un usuario. Con client participa en la
 * transacción del bloqueo o cambio de acceso.
 */
export const revokeAllUserSessions = async (userId, client = { query }) => {
  await client.query(
    "UPDATE user_sessions SET revoked_at = now() WHERE user_id = ? AND revoked_at IS NULL",
    [userId],
  );
};

