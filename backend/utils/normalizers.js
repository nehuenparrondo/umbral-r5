/**
 * Normaliza email, username, identificador y displayName. Resuelve trim/lowercase
 * anti-duplicados.
 */
/**
 * Convierte el email en texto, quita espacios exteriores y pasa a minúsculas para
 * búsquedas/duplicados consistentes. No valida su formato.
 */
export const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

/**
 * Convierte username en texto recortado y en minúsculas. Dos nombres que solo cambian mayúsculas se
 * consideran el mismo identificador.
 */
export const normalizeUsername = (username) =>
  String(username || "")
    .trim()
    .toLowerCase();

/**
 * Prepara el identificador del login, sea email o username, quitando espacios y diferencias de
 * mayúsculas antes de buscar.
 */
export const normalizeIdentifier = (identifier) =>
  String(identifier || "")
    .trim()
    .toLowerCase();

/**
 * Recorta el nombre visible y convierte grupos de espacios en uno solo. Conserva mayúsculas; las
 * reglas de contenido se validan aparte.
 */
export const cleanDisplayName = (displayName) =>
  String(displayName || "")
    .trim()
    .replace(/\s+/g, " ");

