/**
 * Define politica de contrasenas. Resuelve longitud, mayuscula, minuscula, numero y
 * simbolo.
 *
 * Lectura guiada. Ayudas compartidas para transformar o validar datos. Usarlas desde
 * varios puntos mantiene las mismas reglas; comprobar sus retornos antes de informar éxito
 * en la interfaz.
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

export const validatePasswordStrength = (password) =>
  // bcrypt procesa como maximo 72 bytes: rechazar excedentes evita truncamientos.
  typeof password === "string" &&
  Buffer.byteLength(password, "utf8") <= 72 &&
  passwordPolicy.pattern.test(password);

// Exporta: password policy constants and validators.
// Lo utilizan: backend validations and admin seed scripts.
// Depende de: no project files.
