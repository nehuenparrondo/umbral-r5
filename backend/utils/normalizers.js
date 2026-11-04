/**
 * Normaliza email, username, identificador y displayName. Resuelve trim/lowercase
 * anti-duplicados.
 *
 * Lectura guiada. Ayudas compartidas para transformar o validar datos. Usarlas desde
 * varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito
 * en la interfaz.
 */
export const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

export const normalizeUsername = (username) =>
  String(username || "")
    .trim()
    .toLowerCase();

export const normalizeIdentifier = (identifier) =>
  String(identifier || "")
    .trim()
    .toLowerCase();

export const cleanDisplayName = (displayName) =>
  String(displayName || "")
    .trim()
    .replace(/\s+/g, " ");

// Exporta: input normalization helpers.
// Lo utilizan: controllers, validations, scripts, and models.
// Depende de: no project files.
