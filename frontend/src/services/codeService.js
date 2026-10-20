/**
 * Transporta codigos Mailtrap sin guardarlos en el navegador.
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

// This file exports: five email-code operations.
// It is used by: CodePage and EmailChangeForm.
// It imports from: apiClient.
