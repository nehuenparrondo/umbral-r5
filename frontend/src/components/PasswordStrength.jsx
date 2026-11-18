/**
 * Muestra reglas de contrasena en tiempo real.
 */
import { CheckCircle2, Circle } from "lucide-react";
import { evaluatePassword } from "../utils/validators.js";

/**
 * Evalúa la contraseña recibida y presenta las reglas cumplidas y el progreso.
 * Solo ofrece ayuda visual; el servidor vuelve a validar la política antes de guardar un hash.
 */
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

