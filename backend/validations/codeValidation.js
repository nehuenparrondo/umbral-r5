/**
 * Valida solicitudes y confirmaciones de codigos antes del controlador.
 *
 * Lectura guiada. Reglas autoritativas de entrada para la API. Se ejecutan antes del
 * controlador y convierten campos inválidos en errores HTTP; no dependen de que el
 * formulario del navegador sea honesto.
 */
import { body } from "express-validator";
import { validatePasswordStrength } from "../utils/passwordPolicy.js";

const purposes = ["verify_email", "unlock", "reset_password"];

export const requestCodeValidation = [
  body("identifier")
    .trim()
    .isLength({ min: 1, max: 254 })
    .withMessage("Ingresa tu email o usuario."),
  body("purpose").isIn(purposes).withMessage("Proposito invalido."),
];

export const confirmCodeValidation = [
  body("challengeId").isUUID().withMessage("Solicitud invalida."),
  body("purpose")
    .isIn(["verify_email", "unlock"])
    .withMessage("Proposito invalido."),
  body("code")
    .matches(/^\d{6}$/)
    .withMessage("El codigo debe tener 6 numeros."),
];

export const resetPasswordValidation = [
  body("challengeId").isUUID().withMessage("Solicitud invalida."),
  body("code")
    .matches(/^\d{6}$/)
    .withMessage("El codigo debe tener 6 numeros."),
  body("newPassword")
    .custom(validatePasswordStrength)
    .withMessage(
      "La nueva contrasena debe tener 10 caracteres, mayuscula, minuscula, numero y simbolo.",
    ),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Las contrasenas no coinciden.");
    }
    return true;
  }),
];

