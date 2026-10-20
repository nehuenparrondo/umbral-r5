/**
 * Cliente HTTP con cookies, CSRF, parseo de errores y refresh automatico. Resuelve
 * comunicacion segura front-back.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// CSRF se guarda solo en memoria para no persistirlo en localStorage.
let csrfToken = "";
// Evita varios refresh simultaneos cuando vencen varias requests juntas.
let refreshPromise = null;

export class ApiError extends Error {
  constructor(message, status, details = null, code = null) {
    // Mantiene message de Error y agrega status/details para los formularios.
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export const setCsrfToken = (token) => {
  // Actualiza el CSRF que el backend devuelve al iniciar/refrescar sesion.
  csrfToken = token || "";
};

export const clearCsrfToken = () => {
  csrfToken = "";
};

const isUnsafeMethod = (method) =>
  // Metodos que cambian datos deben enviar X-CSRF-Token.
  !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

const parseResponse = async (response) => {
  // 204 no tiene cuerpo y no debe parsearse como JSON.
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    throw new ApiError(
      "El servidor no esta disponible. Revisa que npm run dev siga abierto.",
      response.status,
    );
  }
};

export const refreshSession = async () => {
  // Serializa la rotacion del refresh token para evitar carreras.
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        const payload = await parseResponse(response);

        if (!response.ok) {
          throw new ApiError(
            payload?.message || "Sesion expirada.",
            response.status,
            payload?.details || null,
            payload?.code || null,
          );
        }

        setCsrfToken(payload.csrfToken);
        return payload;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiRequest = async (path, options = {}) => {
  // GET por defecto para lecturas.
  const method = options.method || "GET";
  // Headers permite agregar Content-Type/CSRF sin pisar headers recibidos.
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isUnsafeMethod(method) && csrfToken) {
    // El backend compara este header contra el CSRF firmado en el JWT.
    headers.set("X-CSRF-Token", csrfToken);
  }

  // credentials include envia cookies httpOnly al backend.
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      credentials: "include",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "No se pudo conectar con el servidor. Revisa que la aplicacion siga iniciada.",
      0,
    );
  }
  const payload = await parseResponse(response);

  if (
    response.status === 401 &&
    options.retryOnUnauthorized !== false &&
    path !== "/api/auth/refresh"
  ) {
    // Si vencio el access token, refresca una vez y reintenta la request original.
    await refreshSession();
    return apiRequest(path, { ...options, retryOnUnauthorized: false });
  }

  if (!response.ok) {
    // Convierte cualquier error HTTP en ApiError con detalles por campo.
    throw new ApiError(
      payload?.message || "No se pudo completar la accion.",
      response.status,
      payload?.details || null,
      payload?.code || null,
    );
  }

  return payload;
};

// This file exports: ApiError, csrf helpers, and apiRequest.
// It is used by: auth, user, and admin services.
// It imports from: Vite environment variables and browser fetch.
