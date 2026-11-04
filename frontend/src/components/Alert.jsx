/**
 * Mensajes accesibles de exito/error/info.
 *
 * Lectura guiada. Componente reutilizable Alert. Sus props conectan contenido y acciones
 * con el componente que lo usa; para seguir el dato, buscar sus importaciones y los
 * callbacks recibidos en lugar de suponer que guarda directamente en una base.
 */
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function Alert({ type = "info", title, children }) {
  const Icon = icons[type] || Info;

  return (
    <div
      className={`alert alert--${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      <Icon className="alert__icon" aria-hidden="true" />
      <div>
        {title ? <strong>{title}</strong> : null}
        <p>{children}</p>
      </div>
    </div>
  );
}

// Exporta: Alert (feedback component).
// Lo utilizan: LoginPage, RegisterPage, ProfilePage, and AdminPage.
// Depende de: lucide-react.
