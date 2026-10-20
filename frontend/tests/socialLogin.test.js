import assert from "node:assert/strict";
import test from "node:test";
import { isSocialProviderReady } from "../src/utils/socialLogin.js";

test("El acceso social espera una configuración confirmada, incluso al reintentar", () => {
  const providers = [{ id: "google", configured: true }];
  for (const status of ["loading", "error", undefined]) {
    assert.equal(isSocialProviderReady(providers, "google", status), false);
  }
  assert.equal(isSocialProviderReady(providers, "google", "ready"), true);
});

test("Un proveedor ausente, desactivado o mal formado no permite navegar", () => {
  for (const providers of [
    [],
    null,
    {},
    [null],
    [{ id: "facebook", configured: true }],
    [{ id: "google", configured: false }],
    [{ id: "google", configured: "true" }],
  ]) {
    assert.equal(isSocialProviderReady(providers, "google", "ready"), false);
  }
});

test("Discord solo se habilita cuando la API lo confirma explícitamente", () => {
  assert.equal(
    isSocialProviderReady(
      [{ id: "discord", configured: true }],
      "discord",
      "ready",
    ),
    true,
  );
  assert.equal(
    isSocialProviderReady(
      [{ id: "google", configured: true }],
      "discord",
      "ready",
    ),
    false,
  );
});
