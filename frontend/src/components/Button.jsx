/**
 * Boton reutilizable con icono y loading.
 */
import { LoaderCircle } from "lucide-react";

export function Button({
  children,
  icon: Icon,
  loading = false,
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`button button--${variant} ${className}`}
      {...props}
      disabled={loading || disabled}
      aria-busy={loading}
      aria-label={
        props["aria-label"] ||
        (typeof children === "string" ? children : undefined)
      }
    >
      {loading ? (
        <LoaderCircle
          className="button__icon button__icon--spin"
          aria-hidden="true"
        />
      ) : null}
      {!loading && Icon ? (
        <Icon className="button__icon" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

// This file exports: Button (reusable action component).
// It is used by: pages and AppShell controls.
// It imports from: lucide-react.
