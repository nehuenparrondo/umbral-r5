/**
 * Validadores frontend compartidos. Resuelve feedback inmediato de formularios.
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

/**
 * Evalúa cada regla visual y devuelve checks, cantidad cumplida e isStrong.
 * El puntaje orienta al usuario; validatePassword agrega además el máximo de bytes y la API repite
 * la política.
 */
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

/**
 * Devuelve un mensaje si el email está vacío, tiene formato inválido o supera 254 caracteres;
 * devuelve cadena vacía si pasa.
 * No consulta existencia ni disponibilidad en MySQL.
 */
export const validateEmail = (email) => {
  // trim evita errores por espacios al inicio/final.
  const trimmedEmail = email.trim();

  if (!trimmedEmail) return "El email es obligatorio.";
  if (!emailPattern.test(trimmedEmail)) return "Ingresa un email valido.";
  if (trimmedEmail.length > 254)
    return "El email no puede superar 254 caracteres.";
  return "";
};

/**
 * Devuelve error o cadena vacía para el username recortado: de 3 a 30 letras/números/punto/guion
 * bajo. La unicidad se consulta aparte.
 */
export const validateUsername = (username) => {
  // Solo permite letras, numeros, punto y guion bajo.
  const trimmedUsername = username.trim();

  if (!trimmedUsername) return "El username es obligatorio.";
  if (!usernamePattern.test(trimmedUsername)) {
    return "Usa 3 a 30 caracteres: letras, numeros, _ o punto.";
  }
  return "";
};

/**
 * Valida el nombre visible opcional: hasta 80 caracteres y sin signos de etiquetas HTML. Devuelve
 * mensaje o cadena vacía.
 */
export const validateDisplayName = (displayName) => {
  const trimmedName = displayName.trim();

  if (trimmedName.length > 80)
    return "El nombre visible no puede superar 80 caracteres.";
  if (/[<>]/.test(trimmedName))
    return "No uses etiquetas HTML en el nombre visible.";
  return "";
};

/**
 * Combina todas las reglas de fortaleza con un máximo de 72 bytes UTF-8 para coincidir con bcrypt.
 * Devuelve mensaje o cadena vacía; contar bytes evita aceptar una contraseña que el hash truncaría.
 */
export const validatePassword = (password) => {
  // bcrypt limita bytes UTF-8, no caracteres: evita truncar contrasenas largas.
  if (new TextEncoder().encode(password).length > 72)
    return "La contrasena no puede superar 72 bytes.";
  const result = evaluatePassword(password);
  return result.isStrong ? "" : "La contrasena debe cumplir todas las reglas.";
};

/**
 * Exige confirmación y coincidencia exacta con la contraseña propuesta. Devuelve mensaje de error o
 * cadena vacía.
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Confirma la contrasena.";
  if (password !== confirmPassword) return "Las contrasenas no coinciden.";
  return "";
};

/**
 * Transforma details [{field, message}] de la API en un objeto por campo para los formularios.
 * Si llegan varias entradas para el mismo campo, la última sobrescribe las anteriores.
 */
export const fieldErrorsToObject = (details = []) =>
  // Convierte [{field,message}] del backend en {field: message} para formularios.
  (details || []).reduce((acc, item) => {
    acc[item.field] = item.message;
    return acc;
  }, {});

