/**
 * Contratos de validación del navegador, sin instalar un framework adicional.
 * El backend vuelve a validar las mismas entradas como autoridad final.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluatePassword,
  fieldErrorsToObject,
  validateConfirmPassword,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../src/utils/validators.js";

test("Email: obligatorio, formato y normalización de espacios", () => {
  assert.ok(validateEmail(""));
  assert.ok(validateEmail("sin-arroba"));
  assert.equal(validateEmail(" usuario@example.com "), "");
  assert.ok(validateEmail("a".repeat(250) + "@example.com"));
});

test("Usuario: respeta caracteres permitidos y límites", () => {
  for (const value of [
    "ab",
    "a".repeat(31),
    "nombre con espacios",
    "<usuario>",
  ]) {
    assert.ok(validateUsername(value));
  }
  assert.equal(validateUsername(" usuario.valido_1 "), "");
});

test("Nombre visible: opcional, largo acotado y sin etiquetas HTML", () => {
  assert.equal(validateDisplayName(""), "");
  assert.equal(validateDisplayName("María López"), "");
  assert.ok(validateDisplayName("a".repeat(81)));
  assert.ok(validateDisplayName("<script>"));
});

test("Contraseña: cinco reglas visibles y política compartida", () => {
  const strong = evaluatePassword("PruebaSegura123!");
  assert.equal(strong.score, 5);
  assert.equal(strong.isStrong, true);
  assert.equal(validatePassword("PruebaSegura123!"), "");
  assert.ok(validatePassword("corta"));
  assert.equal(evaluatePassword("").score, 0);
});

test("Contraseña: límite de bcrypt medido en bytes UTF-8", () => {
  assert.equal(validatePassword("Aa1!" + "a".repeat(68)), "");
  assert.ok(validatePassword("Aa1!" + "a".repeat(69)));
  assert.ok(validatePassword("Aa1!" + "ñ".repeat(35)));
});

test("Confirmación: requerida y coincidencia exacta", () => {
  assert.ok(validateConfirmPassword("Clave123!", ""));
  assert.ok(validateConfirmPassword("Clave123!", "otra"));
  assert.equal(validateConfirmPassword("Clave123!", "Clave123!"), "");
});

test("Errores de la API: conversión para formularios y valor vacío seguro", () => {
  assert.deepEqual(fieldErrorsToObject(null), {});
  assert.deepEqual(
    fieldErrorsToObject([{ field: "email", message: "Duplicado" }]),
    {
      email: "Duplicado",
    },
  );
});
