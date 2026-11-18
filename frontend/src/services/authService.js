/**
 * Servicios de autenticacion usados por formularios y contexto.
 *
 * Lectura guiada. Funciones pequeñas para registro, acceso, sesión y proveedores.
 * Mantienen las direcciones HTTP fuera de los formularios y delegan el transporte a
 * apiClient.
 */
import {
  apiRequest,
  clearCsrfToken,
  setCsrfToken,
  refreshSession,
  API_BASE_URL,
} from "./apiClient.js";

/**
 * Envía el alta por POST sin renovar una sesión ante un rechazo. Devuelve el resultado/desafío y
 * sincroniza el CSRF recibido si existe.
 * Registrar una cuenta no implica que su email ya esté verificado ni que pueda ingresar todavía.
 */
export const registerUser = async (formValues) => {
  const payload = await apiRequest("/api/auth/register", {
    method: "POST",
    body: formValues,
    retryOnUnauthorized: false,
  });
  setCsrfToken(payload.csrfToken);
  return payload;
};

/**
 * Envía identifier/password a /api/auth/login y devuelve usuario/CSRF tras éxito.
 * Las cookies HttpOnly las coloca el backend mediante la respuesta; los rechazos del login se
 * propagan al formulario.
 */
export const loginUser = async (credentials) => {
  const payload = await apiRequest("/api/auth/login", {
    method: "POST",
    body: credentials,
    retryOnUnauthorized: false,
  });
  setCsrfToken(payload.csrfToken);
  return payload;
};

/**
 * Consulta /api/auth/session al iniciar la web. Si indica refreshRequired, renueva una vez mediante
 * refreshSession.
 * Actualiza CSRF y devuelve el estado confirmado, incluido user:null para visitantes sin sesión.
 */
export const getCurrentUser = async () => {
  let payload = await apiRequest("/api/auth/session", {
    retryOnUnauthorized: false,
  });
  if (payload.refreshRequired) payload = await refreshSession();
  setCsrfToken(payload.csrfToken);
  return payload;
};

/**
 * Pide revocar la sesión actual por POST y siempre descarta el CSRF local al finalizar.
 * Si la API falla propaga el error: AuthProvider decide mantener el perfil e informar que el cierre
 * no se confirmó.
 */
export const logoutUser = async () => {
  try {
    await apiRequest("/api/auth/logout", {
      method: "POST",
      retryOnUnauthorized: false,
    });
  } finally {
    clearCsrfToken();
  }
};

/**
 * Normaliza email/username y consulta disponibilidad por query. Acepta AbortSignal para cancelar
 * búsquedas anteriores del registro.
 * La respuesta orienta al usuario; no reserva nombres ni reemplaza las restricciones SQL.
 */
export const checkAvailability = ({ email, username }, signal) => {
  const params = new URLSearchParams();

  if (email) params.set("email", email.trim().toLowerCase());
  if (username) params.set("username", username.trim().toLowerCase());

  return apiRequest(`/api/auth/check-availability?${params.toString()}`, {
    retryOnUnauthorized: false,
    signal,
  });
};

/**
 * Consulta el catálogo público de redes y permite cancelar su carga. Nunca solicita los secretos
 * usados por el backend.
 */
export const getOAuthProviders = (signal) =>
  apiRequest("/api/auth/oauth/providers", {
    retryOnUnauthorized: false,
    signal,
  });

/**
 * Construye la URL del endpoint de inicio con el id de red codificado.
 * Devuelve una dirección para navegar, no ejecuta fetch: OAuth necesita salir hacia el proveedor.
 */
export const getOAuthStartUrl = (provider) =>
  `${API_BASE_URL}/api/auth/oauth/${encodeURIComponent(provider)}`;

