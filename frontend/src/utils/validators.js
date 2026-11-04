/**
 * Validadores frontend compartidos. Resuelve feedback inmediato de formularios.
 *
 * Lectura guiada. Ayudas compartidas para transformar o validar datos. Usarlas desde
 * varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito
 * en la interfaz.
 */
export const usernamePattern = /^[A-Za-z0-9_.]{3,30}$/;
// Email simple para UX; el backend usa express-validator como autoridad final.
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordRules = [
  // Las reglas reflejan la politica minima pedida: longitud, casos, numero y simbolo.
  {
    id: "length",
    label: "10+ caracteres",
    test: (value) => value.length >= 10,
  },
  { id: "uppercase", label: "Mayuscula", test: (value) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "Minuscula", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "Numero", test: (value) => /\d/.test(value) },
  {
    id: "special",
    label: "Simbolo",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export const evaluatePassword = (password) => {
  // Convierte reglas en estado visual para el medidor de fortaleza.
  const checks = passwordRules.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));

  return {
    checks,
    score: checks.filter((check) => check.passed).length,
    isStrong: checks.every((check) => check.passed),
  };
};

export const validateEmail = (email) => {
  // trim evita errores por espacios al inicio/final.
  const trimmedEmail = email.trim();

  if (!trimmedEmail) return "El email es obligatorio.";
  if (!emailPattern.test(trimmedEmail)) return "Ingresa un email valido.";
  if (trimmedEmail.length > 254)
    return "El email no puede superar 254 caracteres.";
  return "";
};

export const validateUsername = (username) => {
  // Solo permite letras, numeros, punto y guion bajo.
  const trimmedUsername = username.trim();

  if (!trimmedUsername) return "El username es obligatorio.";
  if (!usernamePattern.test(trimmedUsername)) {
    return "Usa 3 a 30 caracteres: letras, numeros, _ o punto.";
  }
  return "";
};

export const validateDisplayName = (displayName) => {
  const trimmedName = displayName.trim();

  if (trimmedName.length > 80)
    return "El nombre visible no puede superar 80 caracteres.";
  if (/[<>]/.test(trimmedName))
    return "No uses etiquetas HTML en el nombre visible.";
  return "";
};

export const validatePassword = (password) => {
  // bcrypt limita bytes UTF-8, no caracteres: evita truncar contrasenas largas.
  if (new TextEncoder().encode(password).length > 72)
    return "La contrasena no puede superar 72 bytes.";
  const result = evaluatePassword(password);
  return result.isStrong ? "" : "La contrasena debe cumplir todas las reglas.";
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Confirma la contrasena.";
  if (password !== confirmPassword) return "Las contrasenas no coinciden.";
  return "";
};

export const fieldErrorsToObject = (details = []) =>
  // Convierte [{field,message}] del backend en {field: message} para formularios.
  (details || []).reduce((acc, item) => {
    acc[item.field] = item.message;
    return acc;
  }, {});

// Exporta: form validation helpers and password scoring.
// Lo utilizan: RegisterPage, LoginPage, ProfilePage, and PasswordStrength.
// Depende de: no project files.
