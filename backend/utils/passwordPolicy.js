/**
 * Define politica de contrasenas. Resuelve longitud, mayuscula, minuscula, numero y
 * simbolo.
 */
export const passwordPolicy = {
  minLength: 10,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/,
};

export const passwordRequirements = [
  "Al menos 10 caracteres.",
  "Una letra mayuscula.",
  "Una letra minuscula.",
  "Un numero.",
  "Un caracter especial.",
];

/**
 * Devuelve true solo para una cadena con longitud mínima, mayúscula, minúscula, número y símbolo, y
 * hasta 72 bytes UTF-8.
 * El límite en bytes evita el truncado de bcrypt. No calcula ni guarda el hash; express-validator
 * usa este resultado para rechazar el dato.
 */
export const validatePasswordStrength = (password) =>
  // bcrypt procesa como maximo 72 bytes: rechazar excedentes evita truncamientos.
  typeof password === "string" &&
  Buffer.byteLength(password, "utf8") <= 72 &&
  passwordPolicy.pattern.test(password);

