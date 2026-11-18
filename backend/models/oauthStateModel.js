/**
 * Persiste y consume una sola vez los estados OAuth y verificadores PKCE de corta
 * duracion.
 *
 * Lectura guiada. Transacciones temporales de redirección OAuth. El estado se consume una
 * sola vez para relacionar el retorno con el navegador que comenzó el acceso.
 */
import { query, withTransaction } from "../config/db.js";

/**
 * Limpia estados vencidos o consumidos y guarda el hash de state, proveedor, verificador PKCE,
 * nonce y vencimiento.
 * Estos datos temporales permiten validar el retorno OAuth; el state legible viaja en URL/cookie,
 * no en esta columna hash.
 */
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

/**
 * Busca y consume una sola vez un state vigente para el proveedor indicado.
 * Bloquea la fila para que dos retornos no lo reutilicen. Devuelve verificador PKCE/nonce o null.
 * Usa la transacción recibida o abre una propia si no se pasó client.
 */
export const consumeOAuthState = async ({ stateHash, provider }, client) => {
  /**
   * Operación interna ejecutada con una conexión transaccional: toma FOR UPDATE, comprueba vigencia
   * y marca el state consumido antes de devolverlo.
   */
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

