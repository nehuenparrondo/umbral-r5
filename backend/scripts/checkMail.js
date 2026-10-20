/**
 * Comprueba Mailtrap sin imprimir usuario, clave ni mensajes privados.
 */
import { verifyMailConnection } from "../services/mailService.js";

try {
  await verifyMailConnection();
  console.log("SMTP: conexion y autenticacion correctas.");
} catch (_error) {
  console.error(
    "SMTP no disponible. Revisa SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD en .env.",
  );
  process.exitCode = 1;
}

// This file exports: nothing; it is an executable diagnostic.
// It is used by: npm run mail:check.
// It imports from: mailService.
