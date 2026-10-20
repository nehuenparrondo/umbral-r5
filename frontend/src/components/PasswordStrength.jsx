/**
 * Muestra reglas de contrasena en tiempo real.
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

// This file exports: PasswordStrength (password policy feedback component).
// It is used by: RegisterPage and ProfilePage.
// It imports from: lucide-react and src/utils/validators.js.
