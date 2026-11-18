/**
 * Transporta codigos Mailtrap sin guardarlos en el navegador.
 */
import { apiRequest } from "./apiClient.js";

/**
 * Auxiliar para POST de códigos públicos. Desactiva la renovación automática en estos flujos que
 * también usan visitantes sin sesión.
 */
const post = (path, body) =>
  apiRequest(path, { method: "POST", body, retryOnUnauthorized: false });

/**
 * Solicita un código con identifier/purpose. Devuelve challengeId y mensaje; los dígitos se envían
 * por correo y no llegan en esta respuesta.
 */
export const requestCode = (body) => post("/api/auth/codes/request", body);
/**
 * Envía challengeId/code/purpose para verificar email o desbloquear. El resultado puede ser un
 * mensaje o una sesión según el propósito.
 */
export const confirmCode = (body) => post("/api/auth/codes/confirm", body);
/**
 * Envía desafío, código y contraseña nueva al endpoint de recuperación. El backend valida, guarda
 * bcrypt y exige ingresar nuevamente.
 */
export const resetPassword = (body) => post("/api/auth/password/reset", body);
/**
 * Solicita el cambio desde una sesión autenticada con email nuevo y contraseña actual. La escritura
 * definitiva espera el código del nuevo destino.
 */
export const requestEmailChange = (body) =>
  apiRequest("/api/users/me/email/request", { method: "POST", body });
/**
 * Envía el desafío y código de cambio de email con cookies/CSRF de la sesión actual. Devuelve el
 * perfil confirmado para actualizar el contexto.
 */
export const confirmEmailChange = (body) =>
  apiRequest("/api/users/me/email/confirm", { method: "POST", body });

