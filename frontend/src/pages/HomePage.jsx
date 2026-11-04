/**
 * Evita una portada redundante y dirige al unico acceso logico del sistema.
 *
 * Lectura guiada. Pantalla HomePage. Coordina presentación y eventos; seguir los
 * servicios, hooks o contexto importados para encontrar dónde se comprueban y guardan los
 * datos.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function HomePage() {
  const { isAuthenticated, isAdmin } = useAuth();
  return (
    <Navigate
      to={isAuthenticated ? (isAdmin ? "/admin" : "/perfil") : "/login"}
      replace
    />
  );
}

// Exporta: HomePage redirect component.
// Lo utilizan: App.
// Depende de: React Router and the authentication context.
