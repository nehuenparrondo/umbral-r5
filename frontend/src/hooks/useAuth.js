/**
 * Hook seguro para consumir AuthContext. Resuelve acceso atomizado a sesion.
 *
 * Lectura guiada. Hook reutilizable que agrupa estado o comportamiento de React. El nombre
 * use permite reconocer que se consume desde componentes u otros hooks, no como un
 * endpoint del servidor.
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

// Exporta: useAuth hook.
// Lo utilizan: pages and protected UI components.
// Depende de: React and src/context/AuthContext.jsx.
