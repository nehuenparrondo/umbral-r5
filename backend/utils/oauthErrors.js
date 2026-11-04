/**
 * Guía de lectura. Ayudas compartidas para transformar o validar datos. Usarlas desde
 * varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito
 * en la interfaz.
 */

/**
 * Traduce errores externos a motivos internos seguros. No refleja descripciones
 * del proveedor ni confunde cualquier denegación con una cancelación del usuario.
 */
export function classifyOAuthError(error, description) {
  const code =
    typeof error === "string" ? error.slice(0, 128).toLowerCase() : "";
  const detail =
    typeof description === "string"
      ? description.slice(0, 2048).toLowerCase()
      : "";
  if (
    [
      "invalid_client",
      "unauthorized_client",
      "invalid_request",
      "invalid_redirect_uri",
      "invalid_scope",
      "unsupported_response_type",
    ].includes(code) ||
    /connection.*(not enabled|disabled|not found|does not exist)|callback.*(mismatch|not allowed)|redirect_uri.*(mismatch|not allowed)/.test(
      detail,
    )
  ) {
    return "configuration";
  }
  if (
    code === "user_cancelled" ||
    (code === "access_denied" &&
      /user (cancelled|canceled)|user denied (the )?(request|consent)|consent denied by (the )?user/.test(
        detail,
      ))
  ) {
    return "cancelled";
  }
  return code === "access_denied" ? "denied" : "provider";
}
