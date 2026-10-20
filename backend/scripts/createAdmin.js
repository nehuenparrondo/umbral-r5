/**
 * Crea el primer administrador desde variables de entorno. Resuelve alta inicial
 * admin sin endpoint publico.
 */
import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { pool } from "../config/db.js";
import {
  createUser,
  findDuplicates,
  findUserByIdentifierForAuth,
} from "../models/userModel.js";
import { cleanDisplayName } from "../utils/normalizers.js";
import { validatePasswordStrength } from "../utils/passwordPolicy.js";

const requiredAdminEnv = (key) => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Missing ${key} in .env`);
  }
  return value.trim();
};

const main = async () => {
  const email = requiredAdminEnv("ADMIN_EMAIL");
  const username = requiredAdminEnv("ADMIN_USERNAME");
  const password = requiredAdminEnv("ADMIN_PASSWORD");
  const displayName =
    cleanDisplayName(process.env.ADMIN_DISPLAY_NAME) || username;

  if (!validatePasswordStrength(password)) {
    throw new Error("ADMIN_PASSWORD does not satisfy the password policy.");
  }

  const duplicates = await findDuplicates({ email, username });

  if (duplicates.emailTaken || duplicates.usernameTaken) {
    // Repetir setup no cambia contrasenas ni convierte una cuenta normal en admin.
    const existing = await findUserByIdentifierForAuth(username);
    if (
      existing?.role === "admin" &&
      existing.email.toLowerCase() === email.toLowerCase()
    ) {
      console.log("El administrador ya existe; se conserva su cuenta.");
      return;
    }
    throw new Error("Admin email or username already exists.");
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await createUser({
    email,
    username,
    displayName,
    passwordHash,
    role: "admin",
    verified: true,
  });

  console.log(`Admin created: ${user.email} (${user.username})`);
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

// This file exports: no named exports; it seeds the first admin user.
// It is used by: npm run db:create-admin.
// It imports from: bcrypt, env/db config, user model, normalizers, and password policy.
