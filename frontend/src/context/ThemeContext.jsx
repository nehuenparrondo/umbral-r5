/**
 * Mantiene tema claro/oscuro persistido. Resuelve requisito de modo claro/oscuro.
 *
 * Lectura guiada. Parte del sistema visual: comparte colores, tamaños o preferencia de
 * tema según su implementación. La preferencia de apariencia es independiente de la
 * autenticación y de los datos de las tareas.
 */
import { createContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext(null);

/**
 * Lee la preferencia visual local si es light/dark; ante ausencia o bloqueo de almacenamiento usa
 * dark.
 * Es una preferencia de apariencia, no información de autenticación.
 */
const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem("proyectouno-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // El navegador puede bloquear almacenamiento; la presentación sigue disponible.
  }
  return "dark";
};

/**
 * Comparte theme/toggleTheme y aplica data-theme al documento para activar las variables CSS.
 * Intenta conservar la elección en localStorage y sigue funcionando si el navegador impide
 * guardarla.
 */
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

