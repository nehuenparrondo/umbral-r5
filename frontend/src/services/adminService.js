/**
 * Servicios del panel admin.
 */
import { apiRequest } from "./apiClient.js";

/**
 * Solicita una página de usuarios a la API administrativa y devuelve su JSON paginado. El backend
 * exige sesión y rol admin.
 */
export const fetchUsers = (page = 1, pageSize = 20) =>
  apiRequest(`/api/admin/users?page=${page}&pageSize=${pageSize}`);

// Codifica filtros y permite cancelar consultas al salir de Actividad.
/**
 * Codifica página/acción en la URL y permite cancelar la lectura con AbortSignal. Devuelve eventos
 * y total desde la API protegida.
 */
export const fetchAuditEvents = ({ page = 1, action = "" }, signal) =>
  apiRequest(`/api/admin/audit?${new URLSearchParams({ page, action })}`, {
    signal,
  });

/**
 * Envía por PATCH únicamente role/isActive de la fila id y devuelve el usuario confirmado.
 * Cambiar el selector en React no guarda nada hasta que esta petición tenga éxito.
 */
export const updateUserAdmin = ({ id, role, isActive }) =>
  apiRequest(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: { role, isActive },
  });

