/**
 * Mensajes accesibles de exito/error/info.
 */
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

/**
 * Presenta children y título opcional con icono según type (info/success/error).
 * Los errores usan role=alert y los demás role=status para lectores de pantalla. Es un mensaje
 * integrado, no window.alert.
 */
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

