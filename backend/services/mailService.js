/**
 * Mantiene el envio SMTP de R3 mediante Mailtrap sin exponer credenciales.
 *
 * Lectura guiada. Transporte de códigos mediante SMTP. Lee configuración privada del
 * servidor; tener un mensaje construido no demuestra que el proveedor haya aceptado
 * enviarlo.
 */
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

// La bandeja en memoria existe solo durante tests y evita depender de Internet.
export const testOutbox = [];
const testing = env.nodeEnv === "test" && env.mailTransport === "test";
let transport;

// Falla antes de crear estados parciales si faltan las credenciales SMTP.
export function ensureMailConfigured() {
  if (!testing && (!env.smtpUser || !env.smtpPassword)) {
    throw new AppError("El envio de correos no esta configurado.", 503);
  }
}

// Crea una sola conexion reutilizable con TLS y accesos a archivos deshabilitados.
function getTransport() {
  ensureMailConfigured();
  transport ||= nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    requireTLS: true,
    auth: { user: env.smtpUser, pass: env.smtpPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return transport;
}

// Envia un codigo con proposito explicito y vencimiento corto.
export async function sendCode({ to, code, purpose }) {
  ensureMailConfigured();
  const titles = {
    verify_email: "Verifica tu email",
    unlock: "Recupera el acceso",
    reset_password: "Restablece tu contrasena",
    change_email: "Confirma tu nuevo email",
  };
  const message = {
    from: env.mailFrom,
    to,
    subject: `R5 - ${titles[purpose]}`,
    text: `${titles[purpose]}\n\nTu codigo es: ${code}\n\nVence en 10 minutos y se puede usar una sola vez. Si no lo solicitaste, no lo compartas.`,
  };

  if (testing) {
    testOutbox.push({ ...message, code, purpose });
    return;
  }

  try {
    const result = await getTransport().sendMail(message);
    if (!result.accepted?.length) throw new Error("Correo rechazado");
  } catch (_error) {
    throw new AppError(
      "No pudimos enviar el correo. Intenta reenviarlo mas tarde.",
      503,
    );
  }
}

// Usado por npm run mail:check para probar conexion y autenticacion sin enviar correo.
export const verifyMailConnection = () => getTransport().verify();

// Exporta: Mailtrap helpers and a test-only outbox.
// Lo utilizan: challengeService and checkMail.
// Depende de: nodemailer, env and AppError.
