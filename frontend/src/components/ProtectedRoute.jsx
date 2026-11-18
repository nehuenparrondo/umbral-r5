/**
 * Componente guardia de rutas autenticadas/admin. Resuelve proteccion visual
 * complementaria al backend.
 *
 * Lectura guiada. Guarda visual de navegación mientras se comprueba sesión/rol. No protege
 * la base por sí sola: el backend vuelve a exigir autorización.
 */
import { Navigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Espera a que AuthProvider termine de restaurar la sesión antes de mostrar children.
 * Sin sesión redirige al login; si requireAdmin es true y falta ese rol, redirige al perfil. No
 * reemplaza la autorización del backend.
 */
export function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="center-state" role="status">
        <LoaderCircle className="spin-icon" aria-hidden="true" />
        <span>Cargando sesion...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}

