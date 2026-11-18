/** Primera pantalla después de cualquier ingreso. El perfil se abre por decisión del usuario. */
import { Link } from "react-router-dom";
import { ArrowRight, UserRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Lee el usuario público desde AuthContext y muestra nombre/email después del acceso.
 * El enlace a /perfil permite abrir la configuración; esta pantalla está dentro de ProtectedRoute y
 * no vuelve a pedir la contraseña.
 */
export function WelcomePage() {
  const { user } = useAuth();
  return (
    <section
      className="welcome-panel profile-section"
      aria-labelledby="welcome-title"
    >
      <span className="profile-avatar">
        <UserRound aria-hidden="true" />
      </span>
      <p className="eyebrow">TU ESPACIO PERSONAL</p>
      <h1 id="welcome-title">
        ¡Bienvenido, {user.displayName || user.username}!
      </h1>
      <p>Ingresaste correctamente a Umbral.</p>
      <p className="muted-copy">{user.email}</p>
      <Link className="button button--primary" to="/perfil">
        Configurar mi perfil <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}
