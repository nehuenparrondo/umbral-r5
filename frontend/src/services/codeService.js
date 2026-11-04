/**
 * Transporta codigos Mailtrap sin guardarlos en el navegador.
 *
 * Lectura guiada. Servicio reutilizable de la aplicación. Separa operaciones de datos o
 * comunicación de la presentación; sus funciones importadas indican si la operación es
 * local, HTTP o de servidor.
 */
import { apiRequest } from "./apiClient.js";

const post = (path, body) =>
  apiRequest(path, { method: "POST", body, retryOnUnauthorized: false });

export const requestCode = (body) => post("/api/auth/codes/request", body);
export const confirmCode = (body) => post("/api/auth/codes/confirm", body);
export const resetPassword = (body) => post("/api/auth/password/reset", body);
export const requestEmailChange = (body) =>
  apiRequest("/api/users/me/email/request", { method: "POST", body });
export const confirmEmailChange = (body) =>
  apiRequest("/api/users/me/email/confirm", { method: "POST", body });

// Exporta: five email-code operations.
// Lo utilizan: CodePage and EmailChangeForm.
// Depende de: apiClient.
