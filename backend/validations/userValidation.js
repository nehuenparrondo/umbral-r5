/**
 * Valida perfil, cambio de contrasena y acciones admin en backend.
 */
import { body, param } from "express-validator";
import { validatePasswordStrength } from "../utils/passwordPolicy.js";

const usernamePattern = /^[A-Za-z0-9_.]{3,30}$/;

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

export const emailChangeConfirmValidation = [
  body("challengeId").isUUID().withMessage("Solicitud invalida."),
  body("code")
    .matches(/^\d{6}$/)
    .withMessage("El codigo debe tener 6 numeros."),
];

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

export const adminUserIdValidation = [
  param("id").isUUID().withMessage("ID de usuario invalido."),
];

export const adminUpdateUserValidation = [
  ...adminUserIdValidation,
  body("role").isIn(["user", "admin"]).withMessage("Rol invalido."),
  // Exige booleano JSON real: Boolean("false") seria true en JavaScript.
  body("isActive")
    .custom((value) => typeof value === "boolean")
    .withMessage("Estado invalido."),
];

// This file exports: profile, password, and admin validation chains.
// It is used by: user and admin routes.
// It imports from: express-validator and backend/utils/passwordPolicy.js.
