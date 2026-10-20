/**
 * Normaliza email, username, identificador y displayName. Resuelve trim/lowercase
 * anti-duplicados.
 */
export const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

export const normalizeUsername = (username) =>
  String(username || "")
    .trim()
    .toLowerCase();

export const normalizeIdentifier = (identifier) =>
  String(identifier || "")
    .trim()
    .toLowerCase();

export const cleanDisplayName = (displayName) =>
  String(displayName || "")
    .trim()
    .replace(/\s+/g, " ");

// This file exports: input normalization helpers.
// It is used by: controllers, validations, scripts, and models.
// It imports from: no project files.
