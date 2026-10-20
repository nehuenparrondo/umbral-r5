/**
 * Servicios del panel admin.
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

// This file exports: admin API service functions.
// It is used by: src/pages/AdminPage.jsx.
// It imports from: src/services/apiClient.js.
