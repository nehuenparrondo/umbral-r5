/**
 * Consulta y crea vinculos normalizados entre usuarios locales y proveedores OAuth.
 */
import { query } from "../config/db.js";

export const findOAuthAccount = async (
  { provider, providerUserId },
  client = { query },
) => {
  const { rows } = await client.query(
    `SELECT id, user_id AS "userId", provider,
            provider_user_id AS "providerUserId",
            email_at_provider AS "emailAtProvider",
            created_at AS "createdAt"
     FROM oauth_accounts
     WHERE provider = ? AND provider_user_id = ?
     LIMIT 1`,
    [provider, providerUserId],
  );
  return rows[0] || null;
};

export const createOAuthAccount = async (
  { userId, provider, providerUserId, emailAtProvider },
  client = { query },
) => {
  await client.query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email_at_provider)
     VALUES (?, ?, ?, ?)`,
    [userId, provider, providerUserId, emailAtProvider || null],
  );
  return findOAuthAccount({ provider, providerUserId }, client);
};

export const listOAuthAccountsByUserId = async (userId, client = { query }) => {
  const { rows } = await client.query(
    `SELECT provider, email_at_provider AS "emailAtProvider",
            created_at AS "createdAt"
     FROM oauth_accounts
     WHERE user_id = ?
     ORDER BY created_at ASC`,
    [userId],
  );
  return rows;
};

// This file exports: OAuth account persistence functions.
// It is used by: OAuth and user controllers.
// It imports from: backend/config/db.js.
