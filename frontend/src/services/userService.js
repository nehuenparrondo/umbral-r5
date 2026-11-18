/**
 * Servicios del perfil propio y cambio de contrasena.
 */
import { apiRequest } from "./apiClient.js";

/**
 * Envía username/nombre visible al PUT del perfil propio y devuelve {user}. La sesión determina qué
 * cuenta se modifica; no recibe un id de otro usuario.
 */
export const updateProfile = (profile) =>
  apiRequest("/api/users/me", {
    method: "PUT",
    body: profile,
  });

/**
 * Envía contraseñas actual/nueva por PATCH. No calcula hashes en React: la API valida y guarda
 * bcrypt, y devuelve confirmación/perfil.
 */
export const changePassword = (passwords) =>
  apiRequest("/api/users/me/password", {
    method: "PATCH",
    body: passwords,
  });

/**
 * Lee las redes vinculadas a la cuenta autenticada. Devuelve datos de presentación, sin tokens ni
 * claves de las redes.
 */
export const getOAuthAccounts = () =>
  apiRequest("/api/users/me/oauth-accounts");

