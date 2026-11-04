/**
 * Servicios del panel admin.
 *
 * Lectura guiada. Servicio reutilizable de la aplicación. Separa operaciones de datos o
 * comunicación de la presentación; sus funciones importadas indican si la operación es
 * local, HTTP o de servidor.
 */
import { apiRequest } from "./apiClient.js";

export const fetchUsers = (page = 1, pageSize = 20) =>
  apiRequest(`/api/admin/users?page=${page}&pageSize=${pageSize}`);

// Codifica filtros y permite cancelar consultas al salir de Actividad.
export const fetchAuditEvents = ({ page = 1, action = "" }, signal) =>
  apiRequest(`/api/admin/audit?${new URLSearchParams({ page, action })}`, {
    signal,
  });

export const updateUserAdmin = ({ id, role, isActive }) =>
  apiRequest(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: { role, isActive },
  });

// Exporta: admin API service functions.
// Lo utilizan: src/pages/AdminPage.jsx.
// Depende de: src/services/apiClient.js.
