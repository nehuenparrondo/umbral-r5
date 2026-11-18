/**
 * Contiene consultas parametrizadas de usuarios. Resuelve usuarios, roles, duplicados
 * case-insensitive y respuestas sin password_hash.
 *
 * Lectura guiada. Consultas parametrizadas de users. Separa lecturas públicas de lecturas
 * que requieren el hash de contraseña y traduce columnas SQL al formato de objetos de la
 * aplicación.
 */
import { randomUUID } from "node:crypto";
import { query } from "../config/db.js";
import {
  normalizeEmail,
  normalizeIdentifier,
  normalizeUsername,
} from "../utils/normalizers.js";

const publicUserSelect = `
  -- Seleccion publica: nunca incluye password_hash.
  SELECT
    users.id,
    users.email,
    users.username,
    users.display_name AS "displayName",
    (users.password_hash IS NOT NULL) AS "hasPassword",
    roles.name AS role,
    users.is_active AS "isActive",
    users.email_verified_at AS "emailVerifiedAt",
    users.login_locked_at AS "loginLockedAt",
    users.created_at AS "createdAt",
    users.updated_at AS "updatedAt"
  FROM users
  INNER JOIN roles ON roles.id = users.role_id
`;

const authUserSelect = `
  -- Seleccion interna: solo se usa cuando hace falta comparar password_hash.
  SELECT
    users.id,
    users.email,
    users.username,
    users.display_name AS "displayName",
    users.password_hash AS "passwordHash",
    roles.name AS role,
    users.is_active AS "isActive",
    users.email_verified_at AS "emailVerifiedAt",
    users.failed_login_attempts AS "failedAttempts",
    users.login_locked_at AS "loginLockedAt"
  FROM users
  INNER JOIN roles ON roles.id = users.role_id
`;

/**
 * Busca por email o username normalizado y devuelve datos internos de autenticación, incluido
 * passwordHash, o null.
 * Este resultado solo se usa en el backend; para responder al navegador se consulta el perfil
 * público.
 */
export const findUserByIdentifierForAuth = async (
  identifier,
  client = { query },
) => {
  // Normaliza email/username para comparar sin mayusculas ni espacios.
  const normalizedIdentifier = normalizeIdentifier(identifier);
  // Consulta parametrizada: ? evita SQL Injection.
  const { rows } = await client.query(
    `${authUserSelect}
     WHERE users.email_normalized = ? OR users.username_normalized = ?
     LIMIT 1`,
    [normalizedIdentifier, normalizedIdentifier],
  );
  return rows[0] || null;
};

/**
 * Lee un usuario por UUID y devuelve el perfil público o null. Incluye hasPassword como booleano,
 * nunca el hash de la contraseña.
 */
export const findPublicUserById = async (id, client = { query }) => {
  // Devuelve una vista segura del usuario para respuestas API.
  const { rows } = await client.query(
    `${publicUserSelect} WHERE users.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

/**
 * Busca por email normalizado y devuelve únicamente campos públicos o null. Se usa al resolver una
 * identidad social.
 */
export const findPublicUserByEmail = async (email, client = { query }) => {
  const { rows } = await client.query(
    `${publicUserSelect} WHERE users.email_normalized = ? LIMIT 1`,
    [normalizeEmail(email)],
  );
  return rows[0] || null;
};

/**
 * Prueba una base de hasta 30 caracteres y sufijos numéricos hasta encontrar un username libre;
 * falla si agota los intentos.
 * Es una propuesta para altas sociales, no una reserva: el índice único decide finalmente al
 * insertar.
 */
export const findUniqueUsername = async (base, client = { query }) => {
  // Genera una alternativa determinista y corta sin relajar el UNIQUE existente.
  const normalizedBase = normalizeUsername(base).slice(0, 30);
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const ending = suffix ? `_${suffix}` : "";
    const candidate = `${normalizedBase.slice(0, 30 - ending.length)}${ending}`;
    const { rowCount } = await client.query(
      "SELECT 1 FROM users WHERE username_normalized = ? LIMIT 1",
      [normalizeUsername(candidate)],
    );
    if (!rowCount) return candidate;
  }
  throw new Error("No se pudo generar un username disponible.");
};

/**
 * Devuelve la fila interna necesaria para comparar/cambiar contraseña. Si lock es true bloquea
 * antes la fila con FOR UPDATE.
 * Para que el bloqueo proteja varias operaciones, el llamador debe pasar un client transaccional.
 */
export const findUserByIdForPassword = async (
  id,
  client = { query },
  lock = false,
) => {
  // Busca el hash solo para validar o cambiar contrasena.
  if (lock) {
    await client.query("SELECT id FROM users WHERE id = ? FOR UPDATE", [id]);
  }
  const { rows } = await client.query(`${authUserSelect} WHERE users.id = ?`, [
    id,
  ]);
  return rows[0] || null;
};

/**
 * Compara email/username normalizados, con exclusión opcional de una cuenta durante edición.
 * Devuelve {emailTaken, usernameTaken}; no modifica filas ni reemplaza las restricciones únicas de
 * MySQL.
 */
export const findDuplicates = async (
  { email, username, excludeUserId = null },
  client = { query },
) => {
  // Repite normalizacion en backend para no confiar en el frontend.
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  // Los parametros se pasan separados del SQL para mantener prepared statements.
  const params = [normalizedEmail, normalizedUsername];
  let excludeClause = "";

  if (excludeUserId) {
    // En edicion de perfil permite conservar el email/username propio.
    params.push(excludeUserId);
    excludeClause = "AND users.id <> ?";
  }

  const { rows } = await client.query(
    `SELECT email_normalized AS "emailNormalized", username_normalized AS "usernameNormalized"
     FROM users
     WHERE (email_normalized = ? OR username_normalized = ?) ${excludeClause}`,
    params,
  );

  return {
    emailTaken: rows.some((row) => row.emailNormalized === normalizedEmail),
    usernameTaken: rows.some(
      (row) => row.usernameNormalized === normalizedUsername,
    ),
  };
};

/**
 * Inserta un usuario con UUID, campos normalizados y rol resuelto desde roles; devuelve su perfil
 * público.
 * passwordHash debe llegar ya calculado con bcrypt, o null en un alta social. verified decide la
 * fecha inicial de verificación.
 * El client permite confirmar usuario, vinculación y auditoría como una sola operación.
 */
export const createUser = async (
  {
    email,
    username,
    displayName,
    passwordHash,
    role = "user",
    verified = false,
  },
  client = { query },
) => {
  // UUID evita IDs secuenciales expuestos y sirve como PK.
  const id = randomUUID();
  // TRIM limpia bordes; las columnas generadas normalizadas aplican UNIQUE.
  await client.query(
    `INSERT INTO users
     (id, email, username, display_name, password_hash, role_id, email_verified_at)
     VALUES (?, TRIM(?), TRIM(?), ?, ?,
       (SELECT id FROM roles WHERE name = ?),
       CASE WHEN ? THEN now() ELSE NULL END)`,
    [id, email, username, displayName, passwordHash, role, verified],
  );
  return findPublicUserById(id, client);
};

/**
 * Actualiza username y nombre visible por id y devuelve el perfil público, o null si no se
 * actualizó ninguna fila.
 * La comprobación previa de disponibilidad pertenece al controlador; el índice único sigue
 * protegiendo la escritura.
 */
export const updateUserProfile = async (
  { id, username, displayName },
  client = { query },
) => {
  // El id viene del usuario autenticado, no de un campo editable del formulario.
  const result = await client.query(
    `UPDATE users
     SET username = TRIM(?),
         display_name = ?
     WHERE id = ?`,
    [username, displayName, id],
  );

  if (!result.rowCount) return null;
  return findPublicUserById(id, client);
};

/**
 * Guarda un hash ya calculado y reinicia contador de fallos/bloqueo.
 * No calcula bcrypt ni revoca sesiones aquí: el controlador coordina esas operaciones con el mismo
 * client.
 */
export const updatePasswordHash = async (
  { id, passwordHash },
  client = { query },
) => {
  // Recibe bcrypt ya calculado. El mismo método se usa para cambio desde perfil y recuperación.
  await client.query(
    `UPDATE users
     SET password_hash = ?, failed_login_attempts = 0, login_locked_at = NULL
     WHERE id = ?`,
    [passwordHash, id],
  );
};

/**
 * Consulta una página de perfiles públicos y su total y devuelve {users, total, page, pageSize}.
 * El controlador valida/limita la paginación; esta consulta no entrega hashes ni comprueba el rol
 * del solicitante.
 */
export const listUsers = async ({ page = 1, pageSize = 20 }) => {
  // Paginacion para que el panel admin no descargue toda la tabla sin limite.
  const offset = (page - 1) * pageSize;
  const usersQuery = query(
    `${publicUserSelect}
     ORDER BY users.created_at DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset],
  );
  const countQuery = query("SELECT COUNT(*) AS total FROM users");
  const [usersResult, countResult] = await Promise.all([
    usersQuery,
    countQuery,
  ]);

  return {
    users: usersResult.rows,
    total: countResult.rows[0].total,
    page,
    pageSize,
  };
};

/**
 * Actualiza rol mediante la tabla roles y estado activo, y devuelve perfil público o null.
 * La ruta exige administrador y el controlador impide quitarse el acceso; este modelo solo ejecuta
 * la escritura.
 */
export const updateUserAdminFields = async (
  { id, role, isActive },
  client = { query },
) => {
  // El rol se resuelve por FK desde roles para mantener integridad relacional.
  const result = await client.query(
    `UPDATE users
     SET role_id = (SELECT roles.id FROM roles WHERE roles.name = ?),
         is_active = ?
     WHERE id = ?`,
    [role, isActive, id],
  );

  if (!result.rowCount) return null;
  return findPublicUserById(id, client);
};

