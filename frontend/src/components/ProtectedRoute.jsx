/**
 * Componente guardia de rutas autenticadas/admin. Resuelve proteccion visual
 * complementaria al backend.
 */
import { Navigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";

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

// This file exports: ProtectedRoute (auth/admin route guard).
// It is used by: src/App.jsx.
// It imports from: react-router-dom, lucide-react, and src/hooks/useAuth.js.
