/**
 * Mantiene sesion frontend y sincroniza usuario/CSRF. Resuelve login, registro,
 * logout y usuario autenticado.
 *
 * Lectura guiada. Comparte solo el perfil público y el estado de sesión entre páginas. Las
 * credenciales reales viven en cookies HttpOnly y el CSRF en memoria; al iniciar consulta
 * /api/auth/session.
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

/**
 * Comparte usuario público, carga y operaciones de autenticación con children. Al montarse consulta
 * /api/auth/session y renueva si corresponde.
 * El perfil y CSRF viven en memoria; las credenciales de sesión están en cookies HttpOnly del
 * navegador.
 * Centraliza el paso a bienvenida tras login y conserva los errores de restauración/cierre para
 * informarlos en la interfaz.
 */
export function AuthProvider({ children }) {
  // navigate permite redirigir después del login o del cierre de sesión.
  const navigate = useNavigate();
  // user guarda solo datos publicos; los tokens quedan en cookies httpOnly.
  const [user, setUser] = useState(null);
  // isLoading evita renderizar rutas protegidas antes de saber si hay sesion.
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  /**
   * Aplica {user, csrfToken} confirmado por el backend y limpia el error anterior.
   * Sincroniza la vista y la cabecera CSRF; no crea por sí sola cookies ni filas de sesión.
   */
  const applySession = useCallback((payload) => {
    // Sincroniza usuario publico en memoria.
    setUser(payload.user);
    setSessionError("");
    // Guarda CSRF en memoria para las requests mutables.
    setCsrfToken(payload.csrfToken);
  }, []);

  /**
   * Descarta el perfil visible y CSRF en memoria. La revocación de la sesión real debe realizarla
   * el servidor.
   */
  const clearSession = useCallback(() => {
    // Limpia el usuario visible cuando logout o la restauración de sesión falla.
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

  /**
   * Recibe identifier/password, espera la confirmación de loginUser y aplica la sesión antes de
   * navegar a bienvenida.
   * Propaga el error al formulario para que pueda mostrarlo o pedir verificación de email.
   */
  const login = useCallback(
    async (credentials) => {
      // loginUser llama a /api/auth/login y recibe usuario + CSRF.
      const payload = await loginUser(credentials);
      applySession(payload);
      navigate("/bienvenida", {
        replace: true,
      });
      return payload;
    },
    [applySession, navigate],
  );

  /**
   * Envía el formulario de alta y devuelve su desafío de verificación. No marca al usuario como
   * autenticado: primero debe confirmar el email e ingresar.
   */
  const register = useCallback(
    // La sesión del alta se abre después de confirmar el código de email.
    (formValues) => registerUser(formValues),
    [],
  );

  /**
   * Solicita al backend revocar la sesión; solo tras éxito limpia el perfil y vuelve al login.
   * Si falla guarda sessionError y mantiene el estado visible para no afirmar un cierre que no se
   * confirmó.
   */
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

