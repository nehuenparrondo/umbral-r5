/**
 * Hook seguro para consumir ThemeContext. Resuelve acceso atomizado al tema.
 *
 * Lectura guiada. Parte del sistema visual: comparte colores, tamaños o preferencia de
 * tema según su implementación. La preferencia de apariencia es independiente de la
 * autenticación y de los datos de las tareas.
 */
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
};

// Exporta: useTheme hook.
// Lo utilizan: theme toggle components.
// Depende de: React and src/context/ThemeContext.jsx.
