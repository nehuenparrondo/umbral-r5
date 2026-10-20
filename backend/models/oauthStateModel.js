/**
 * Persiste y consume una sola vez los estados OAuth y verificadores PKCE de corta
 * duracion.
 */
import { query, withTransaction } from "../config/db.js";

export const createOAuthState = async (
  { stateHash, provider, codeVerifier, nonce, expiresAt },
  client = { query },
) => {
  // Limpia transacciones vencidas para que la tabla permanezca pequena.
  await client.query(
    "DELETE FROM oauth_login_states WHERE expires_at <= now() OR consumed_at IS NOT NULL",
  );
  await client.query(
    `INSERT INTO oauth_login_states (state_hash, provider, code_verifier, nonce, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [stateHash, provider, codeVerifier, nonce, expiresAt],
  );
};

export const consumeOAuthState = async ({ stateHash, provider }, client) => {
  const consume = async (transaction) => {
    const { rows } = await transaction.query(
      `SELECT code_verifier AS "codeVerifier", nonce FROM oauth_login_states
       WHERE state_hash = ? AND provider = ? AND consumed_at IS NULL
       AND expires_at > now() FOR UPDATE`,
      [stateHash, provider],
    );
    if (!rows[0]) return null;
    await transaction.query(
      "UPDATE oauth_login_states SET consumed_at = now() WHERE state_hash = ? AND consumed_at IS NULL",
      [stateHash],
    );
    return rows[0];
  };
  return client ? consume(client) : withTransaction(consume);
};

// This file exports: createOAuthState and consumeOAuthState.
// It is used by: backend/controllers/oauthController.js.
// It imports from: backend/config/db.js.
