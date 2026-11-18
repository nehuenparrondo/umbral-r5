/**
 * Hook seguro para consumir AuthContext. Resuelve acceso atomizado a sesion.
 */
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

/**
 * Devuelve las operaciones y el estado de AuthContext. Lanza un error de programación si se usa
 * fuera de AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};

