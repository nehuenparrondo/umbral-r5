/**
 * Boton que alterna claro/oscuro.
 *
 * Lectura guiada. Parte del sistema visual: comparte colores, tamaños o preferencia de
 * tema según su implementación. La preferencia de apariencia es independiente de la
 * autenticación y de los datos de las tareas.
 */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme.js";

/**
 * Consume el tema actual y llama a toggleTheme al pulsar. La preferencia se aplica y conserva en
 * ThemeProvider, no en cada pantalla.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className="icon-button"
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      aria-pressed={isDark}
      title="Cambiar tema"
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}

