/**
 * Servicios de autenticacion usados por formularios y contexto.
 */
import {
  apiRequest,
  clearCsrfToken,
  setCsrfToken,
  refreshSession,
  API_BASE_URL,
} from "./apiClient.js";

export const registerUser = async (formValues) => {
  const payload = await apiRequest("/api/auth/register", {
    method: "POST",
    body: formValues,
    retryOnUnauthorized: false,
  });
  setCsrfToken(payload.csrfToken);
  return payload;
};

export const loginUser = async (credentials) => {
  const payload = await apiRequest("/api/auth/login", {
    method: "POST",
    body: credentials,
    retryOnUnauthorized: false,
  });
  setCsrfToken(payload.csrfToken);
  return payload;
};

export const getCurrentUser = async () => {
  let payload = await apiRequest("/api/auth/session", {
    retryOnUnauthorized: false,
  });
  if (payload.refreshRequired) payload = await refreshSession();
  setCsrfToken(payload.csrfToken);
  return payload;
};

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

export const checkAvailability = ({ email, username }, signal) => {
  const params = new URLSearchParams();

  if (email) params.set("email", email.trim().toLowerCase());
  if (username) params.set("username", username.trim().toLowerCase());

  return apiRequest(`/api/auth/check-availability?${params.toString()}`, {
    retryOnUnauthorized: false,
    signal,
  });
};

export const getOAuthProviders = (signal) =>
  apiRequest("/api/auth/oauth/providers", {
    retryOnUnauthorized: false,
    signal,
  });

export const getOAuthStartUrl = (provider) =>
  `${API_BASE_URL}/api/auth/oauth/${encodeURIComponent(provider)}`;

// This file exports: auth service functions.
// It is used by: AuthContext, LoginPage, and RegisterPage.
// It imports from: src/services/apiClient.js.
