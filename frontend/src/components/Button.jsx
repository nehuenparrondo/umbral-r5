/**
 * Boton reutilizable con icono y loading.
 *
 * Lectura guiada. Componente reutilizable Button. Sus props conectan contenido y acciones
 * con el componente que lo usa; para seguir el dato, buscar sus importaciones y los
 * callbacks recibidos en lugar de suponer que guarda directamente en una base.
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

// Exporta: Button (reusable action component).
// Lo utilizan: pages and AppShell controls.
// Depende de: lucide-react.
