/**
 * Valida registro, login y disponibilidad en backend. Resuelve no confiar solo en el
 * frontend.
 */
import { body, query } from "express-validator";
import { validatePasswordStrength } from "../utils/passwordPolicy.js";

const usernamePattern = /^[A-Za-z0-9_.]{3,30}$/;

export const registerValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Ingresa un email valido.")
    .isLength({ max: 254 })
    .withMessage("El email no puede superar 254 caracteres."),
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
  body("password")
    .custom(validatePasswordStrength)
    .withMessage(
      "La contrasena debe tener 10 caracteres, mayuscula, minuscula, numero y simbolo.",
    ),
  body("confirmPassword").custom((confirmPassword, { req }) => {
    if (confirmPassword !== req.body.password) {
      throw new Error("Las contrasenas no coinciden.");
    }
    return true;
  }),
];

export const loginValidation = [
  body("identifier")
    .isString()
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Ingresa tu email o username.")
    .isLength({ max: 254 }),
  body("password")
    .isString()
    .bail()
    .notEmpty()
    .withMessage("Ingresa tu contrasena."),
];

export const availabilityValidation = [
  query("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Email invalido."),
  query("username")
    .optional({ values: "falsy" })
    .trim()
    .matches(usernamePattern)
    .withMessage("Username invalido."),
];

// This file exports: auth route validation chains.
// It is used by: backend/routes/authRoutes.js.
// It imports from: express-validator and backend/utils/passwordPolicy.js.
