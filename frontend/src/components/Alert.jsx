/**
 * Mensajes accesibles de exito/error/info.
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

// This file exports: Alert (feedback component).
// It is used by: LoginPage, RegisterPage, ProfilePage, and AdminPage.
// It imports from: lucide-react.
