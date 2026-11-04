/**
 * Muestra reglas de contrasena en tiempo real.
 *
 * Lectura guiada. Componente reutilizable PasswordStrength. Sus props conectan contenido y
 * acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y
 * los callbacks recibidos en lugar de suponer que guarda directamente en una base.
 */
import { CheckCircle2, Circle } from "lucide-react";
import { evaluatePassword } from "../utils/validators.js";

export function PasswordStrength({ password }) {
  const result = evaluatePassword(password);

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength__meter" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            className={
              index < result.score
                ? "password-strength__bar password-strength__bar--active"
                : "password-strength__bar"
            }
            key={index}
          />
        ))}
      </div>
      <ul className="password-strength__rules">
        {result.checks.map((check) => (
          <li className={check.passed ? "is-valid" : ""} key={check.id}>
            {check.passed ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <Circle aria-hidden="true" />
            )}
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Exporta: PasswordStrength (password policy feedback component).
// Lo utilizan: RegisterPage and ProfilePage.
// Depende de: lucide-react and src/utils/validators.js.
