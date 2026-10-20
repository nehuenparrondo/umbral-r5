/**
 * Servicios del perfil propio y cambio de contrasena.
 */
import { apiRequest } from "./apiClient.js";

export const updateProfile = (profile) =>
  apiRequest("/api/users/me", {
    method: "PUT",
    body: profile,
  });

export const changePassword = (passwords) =>
  apiRequest("/api/users/me/password", {
    method: "PATCH",
    body: passwords,
  });

export const getOAuthAccounts = () =>
  apiRequest("/api/users/me/oauth-accounts");

// This file exports: user profile service functions.
// It is used by: src/pages/ProfilePage.jsx.
// It imports from: src/services/apiClient.js.
