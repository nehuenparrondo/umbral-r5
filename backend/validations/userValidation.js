/**
 * Valida perfil, cambio de contrasena y acciones admin en backend.
 *
 * Lectura guiada. Reglas autoritativas de entrada para la API. Se ejecutan antes del
 * controlador y convierten campos inválidos en errores HTTP; no dependen de que el
 * formulario del navegador sea honesto.
 */
import { body, param } from "express-validator";
import { validatePasswordStrength } from "../utils/passwordPolicy.js";

const usernamePattern = /^[A-Za-z0-9_.]{3,30}$/;

/** Valida solo los campos editables de la tarjeta; no admite cambiar rol desde el perfil propio. */
export const profileValidation = [
  body("username")
    .trim()
    .matches(usernamePattern)
    .withMessage(
      "El username solo puede usar letras, numeros, guion bajo o punto (3 a 30 caracteres).",
    ),
  body("displayName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 80 })
    .withMessage("El nombre visible no puede superar 80 caracteres.")
    .not()
    .matches(/[<>]/)
    .withMessage("El nombre visible no puede contener etiquetas HTML."),
];

/** Comprueba formato del email nuevo y presencia de contraseña actual; la comparación bcrypt ocurre en el controlador. */
export const emailChangeRequestValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Ingresa un email valido.")
    .isLength({ max: 254 })
    .withMessage("El email no puede superar 254 caracteres."),
  body("currentPassword")
    .isString()
    .notEmpty()
    .withMessage("Ingresa tu contrasena actual."),
];

/** Exige id de desafío UUID y seis dígitos; vigencia, destinatario y uso único se comprueban en challengeService. */
export const emailChangeConfirmValidation = [
  body("challengeId").isUUID().withMessage("Solicitud invalida."),
  body("code")
    .matches(/^\d{6}$/)
    .withMessage("El codigo debe tener 6 numeros."),
];

/** Permite omitir la actual en cuentas sociales sin hash; el controlador decide si es obligatoria según la cuenta real. */
export const passwordChangeValidation = [
  body("currentPassword")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("La contrasena actual debe ser texto."),
  body("newPassword")
    .custom(validatePasswordStrength)
    .withMessage(
      "La nueva contrasena debe tener 10 caracteres, mayuscula, minuscula, numero y simbolo.",
    ),
  body("confirmPassword").custom((confirmPassword, { req }) => {
    if (confirmPassword !== req.body.newPassword) {
      throw new Error("Las contrasenas no coinciden.");
    }
    return true;
  }),
];

/** Exige UUID en la ruta administrativa antes de consultar o editar el usuario. */
export const adminUserIdValidation = [
  param("id").isUUID().withMessage("ID de usuario invalido."),
];

/** Restringe el rol a user/admin y exige booleano JSON real para isActive. Los permisos se comprueban en la ruta. */
export const adminUpdateUserValidation = [
  ...adminUserIdValidation,
  body("role").isIn(["user", "admin"]).withMessage("Rol invalido."),
  // Exige booleano JSON real: Boolean("false") seria true en JavaScript.
  body("isActive")
    .custom((value) => typeof value === "boolean")
    .withMessage("Estado invalido."),
];

