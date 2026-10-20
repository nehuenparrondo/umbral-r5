/**
 * Boton que alterna claro/oscuro.
 */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme.js";

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

// This file exports: ThemeToggle (light/dark mode control).
// It is used by: AppShell.
// It imports from: lucide-react and src/hooks/useTheme.js.
