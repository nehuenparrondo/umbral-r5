/**
 * Evita una portada redundante y dirige al unico acceso logico del sistema.
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

// This file exports: HomePage redirect component.
// It is used by: App.
// It imports from: React Router and the authentication context.
