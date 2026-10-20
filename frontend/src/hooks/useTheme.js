/**
 * Hook seguro para consumir ThemeContext. Resuelve acceso atomizado al tema.
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

// This file exports: useTheme hook.
// It is used by: theme toggle components.
// It imports from: React and src/context/ThemeContext.jsx.
