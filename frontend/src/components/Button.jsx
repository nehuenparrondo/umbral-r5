/**
 * Boton reutilizable con icono y loading.
 */
import { LoaderCircle } from "lucide-react";

/**
 * Botón reutilizable: children es la etiqueta, icon el icono y variant la apariencia. Propaga las
 * demás props al botón HTML.
 * loading muestra progreso, informa aria-busy y deshabilita junto con disabled para evitar repetir
 * una acción pendiente.
 */
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

