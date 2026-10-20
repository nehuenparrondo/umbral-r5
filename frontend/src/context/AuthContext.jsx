/**
 * Mantiene sesion frontend y sincroniza usuario/CSRF. Resuelve login, registro,
 * logout y usuario autenticado.
 */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { clearCsrfToken, setCsrfToken } from "../services/apiClient.js";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // navigate permite redirigir despues de login, registro o logout.
  const navigate = useNavigate();
  // user guarda solo datos publicos; los tokens quedan en cookies httpOnly.
  const [user, setUser] = useState(null);
  // isLoading evita renderizar rutas protegidas antes de saber si hay sesion.
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const applySession = useCallback((payload) => {
    // Sincroniza usuario publico en memoria.
    setUser(payload.user);
    setSessionError("");
    // Guarda CSRF en memoria para las requests mutables.
    setCsrfToken(payload.csrfToken);
  }, []);

  const clearSession = useCallback(() => {
    // Limpia el usuario visible cuando logout o /me falla.
    setUser(null);
    // Limpia CSRF para que no se use con sesiones vencidas.
    clearCsrfToken();
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Al cargar la app pregunta al backend si las cookies actuales son validas.
    getCurrentUser()
      .then((payload) => {
        if (isMounted) applySession(payload);
      })
      .catch((error) => {
        if (isMounted) {
          clearSession();
          if (error.status !== 401) setSessionError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (credentials) => {
      // loginUser llama a /api/auth/login y recibe usuario + CSRF.
      const payload = await loginUser(credentials);
      applySession(payload);
      navigate(payload.user.role === "admin" ? "/admin" : "/perfil", {
        replace: true,
      });
      return payload;
    },
    [applySession, navigate],
  );

  const register = useCallback(
    // R3 exige verificar el codigo de email antes de crear una sesion.
    (formValues) => registerUser(formValues),
    [],
  );

  const logout = useCallback(async () => {
    try {
      // El backend revoca la sesion actual y borra cookies.
      await logoutUser();
      // Solo indicar cierre exitoso cuando la API revoco la sesion.
      clearSession();
      navigate("/login", { replace: true });
    } catch (error) {
      setSessionError(error.message);
    }
  }, [clearSession, navigate]);

  const value = useMemo(
    () => ({
      // API publica del contexto: componentes no tocan servicios directamente.
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isLoading,
      sessionError,
      login,
      register,
      logout,
      updateAuthenticatedUser: setUser,
      applySession,
    }),
    [applySession, isLoading, login, logout, register, user, sessionError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This file exports: AuthContext and AuthProvider.
// It is used by: src/main.jsx, src/hooks/useAuth.js, and auth-aware components.
// It imports from: React hooks, React Router, and auth/api services.
