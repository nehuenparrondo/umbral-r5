/**
 * Evita una portada redundante y dirige al unico acceso logico del sistema.
 *
 * Lectura guiada. Pantalla HomePage. Coordina presentación y eventos; seguir los
 * servicios, hooks o contexto importados para encontrar dónde se comprueban y guardan los
 * datos.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Presenta la portada y enlaces de entrada del sistema. La sesión compartida permite adaptar el
 * acceso sin implementar aquí el login.
 */
export function HomePage() {
  const { isAuthenticated } = useAuth();
  return (
    <Navigate
      to={isAuthenticated ? "/bienvenida" : "/login"}
      replace
    />
  );
}

