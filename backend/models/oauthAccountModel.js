/**
 * Consulta y crea vinculos normalizados entre usuarios locales y proveedores OAuth.
 *
 * Lectura guiada. Vínculos entre usuario local e identidad externa: proveedor +
 * identificador del proveedor. No almacena la contraseña de Google/GitHub/Discord ni sus
 * mensajes.
 */
import { query } from "../config/db.js";

/**
 * Busca la vinculación por pareja proveedor/identificador externo. Devuelve la fila o null usando
 * el ejecutor recibido.
 */
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

/**
 * Inserta la relación entre un usuario local y una identidad social y vuelve a leerla.
 * No guarda la contraseña de la red; el client permite unir esta escritura a la transacción de alta
 * o vinculación.
 */
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

/**
 * Devuelve proveedor, email y fecha de las identidades vinculadas a una cuenta. Es el listado
 * público mostrado en su perfil.
 */
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

