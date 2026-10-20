/**
 * Hook seguro para consumir AuthContext. Resuelve acceso atomizado a sesion.
 */
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};

// This file exports: useAuth hook.
// It is used by: pages and protected UI components.
// It imports from: React and src/context/AuthContext.jsx.
