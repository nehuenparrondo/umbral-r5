/**
 * Mantiene tema claro/oscuro persistido. Resuelve requisito de modo claro/oscuro.
 */
import { createContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext(null);

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem("proyectouno-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // El navegador puede bloquear almacenamiento; la presentación sigue disponible.
  }
  return "dark";
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("proyectouno-theme", theme);
    } catch {
      // Sin persistencia se conserva el tema en memoria durante esta sesión.
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === "dark" ? "light" : "dark",
        ),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// This file exports: ThemeContext and ThemeProvider.
// It is used by: src/main.jsx and src/hooks/useTheme.js.
// It imports from: React hooks and browser localStorage.
