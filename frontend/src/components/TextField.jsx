/**
 * Input accesible reutilizable con errores y mostrar/ocultar contrasena.
 *
 * Lectura guiada. Componente reutilizable TextField. Sus props conectan contenido y
 * acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y
 * los callbacks recibidos en lugar de suponer que guarda directamente en una base.
 */
import {
  AtSign,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useId, useState } from "react";

export function TextField({
  label,
  error,
  help,
  type = "text",
  id,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  const FieldIcon = isPassword
    ? KeyRound
    : type === "email" || props.autoComplete === "username"
      ? AtSign
      : props.inputMode === "numeric"
        ? ShieldCheck
        : UserRound;
  const describedBy = error
    ? `${fieldId}-error`
    : help
      ? `${fieldId}-help`
      : undefined;

  return (
    <div className={`field ${className}`}>
      {/* Un label por input: el boton de mostrar clave no forma parte del label. */}
      <label className="field__label" htmlFor={fieldId}>
        {label}
      </label>
      <span
        className={`field__control field__control--icon${isPassword ? " field__control--password" : ""}`}
      >
        <FieldIcon className="field__icon" aria-hidden="true" />
        <input
          id={fieldId}
          type={inputType}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className="field__reveal"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={
              showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
            }
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </button>
        ) : null}
      </span>
      {error ? (
        <span
          className="field__message field__message--error"
          id={`${fieldId}-error`}
        >
          {error}
        </span>
      ) : null}
      {!error && help ? (
        <span className="field__message" id={`${fieldId}-help`}>
          {help}
        </span>
      ) : null}
    </div>
  );
}

// Exporta: TextField (accessible input component).
// Lo utilizan: LoginPage, RegisterPage, and ProfilePage.
// Depende de: React and lucide-react.
