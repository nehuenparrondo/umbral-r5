/**
 * Marco de la aplicación: marca, navegación por permisos, tema y cierre de sesión.
 * La ruta solo determina la distribución visual; los permisos reales permanecen
 * en ProtectedRoute y, de forma autoritativa, en los middleware de Express.
 *
 * Lectura guiada. Componente reutilizable AppShell. Sus props conectan contenido y
 * acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y
 * los callbacks recibidos en lugar de suponer que guarda directamente en una base.
 */
import {
  Fingerprint,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Button } from "./Button.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { Alert } from "./Alert.jsx";

export function AppShell({ children }) {
  const { isAuthenticated, isAdmin, logout, user, sessionError } = useAuth();
  const { pathname } = useLocation();
  const isPublicScreen =
    !isAuthenticated && pathname !== "/perfil" && pathname !== "/admin";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Umbral, inicio">
          <span className="brand__mark">
            <Fingerprint aria-hidden="true" />
          </span>
          <span>
            <strong>umbral.</strong>
            <small>Tu espacio personal</small>
          </span>
        </NavLink>

        {isAuthenticated ? (
          <nav className="nav" aria-label="Navegación principal">
            <NavLink to="/perfil" className="nav__link" aria-label="Perfil">
              <User aria-hidden="true" />
              <span>Mi perfil</span>
            </NavLink>
            {isAdmin ? (
              <NavLink to="/admin" className="nav__link" aria-label="Admin">
                <ShieldCheck aria-hidden="true" />
                <span>Administración</span>
              </NavLink>
            ) : null}
          </nav>
        ) : (
          <span className="workspace-label">
            <span className="status-dot" />
            IDENTIDAD DIGITAL · R5
          </span>
        )}

        <div className="topbar__actions">
          {isAuthenticated ? (
            <span className="session-pill">{user.username}</span>
          ) : null}
          <ThemeToggle />
          {isAuthenticated ? (
            <Button
              type="button"
              variant="ghost"
              icon={LogOut}
              onClick={logout}
            >
              Salir
            </Button>
          ) : null}
        </div>
      </header>

      <main
        id="contenido-principal"
        tabIndex="-1"
        className={`main-content${isPublicScreen ? " main-content--auth" : ""}`}
      >
        {sessionError ? <Alert type="error">{sessionError}</Alert> : null}
        {children}
      </main>
      <footer className="app-footer">
        <span>Umbral · Un lugar para tu identidad.</span>
        <span>
          <LockKeyhole aria-hidden="true" />
          Gestión de cuentas · R5
        </span>
      </footer>
    </div>
  );
}
