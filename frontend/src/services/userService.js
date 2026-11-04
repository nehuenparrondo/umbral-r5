/**
 * Servicios del perfil propio y cambio de contrasena.
 *
 * Lectura guiada. Servicio reutilizable de la aplicación. Separa operaciones de datos o
 * comunicación de la presentación; sus funciones importadas indican si la operación es
 * local, HTTP o de servidor.
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

// Exporta: user profile service functions.
// Lo utilizan: src/pages/ProfilePage.jsx.
// Depende de: src/services/apiClient.js.
