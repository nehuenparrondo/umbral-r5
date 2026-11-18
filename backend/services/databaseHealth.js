/**
 * Comprobación de infraestructura de R5. Consulta columnas de sus ocho tablas y traduce fallos de
 * conexión, esquema o permisos a diagnósticos de arranque.
 */

// Requisito 10: comprobar el servicio SQL real, no solo que Express responda.
import { query } from "../config/db.js";

/**
 * Comprueba conexión y columnas necesarias de las ocho tablas con SELECT LIMIT 0, sin leer cuentas.
 * Resuelve al estar listo el esquema o propaga el error SQL; server espera esta comprobación antes
 * de escuchar.
 */
export async function checkDatabase() {
  // LIMIT 0 verifica conexion, tablas y permisos sin leer datos personales.
  await query("SELECT id FROM users LIMIT 0");
  await query("SELECT id FROM roles LIMIT 0");
  await query("SELECT id FROM user_sessions LIMIT 0");
  await query("SELECT id FROM oauth_accounts LIMIT 0");
  await query("SELECT lock_key FROM oauth_identity_locks LIMIT 0");
  await query("SELECT state_hash FROM oauth_login_states LIMIT 0");
  await query("SELECT id FROM auth_challenges LIMIT 0");
  await query("SELECT id FROM audit_logs LIMIT 0");
}

/**
 * Convierte códigos SQL habituales en instrucciones de diagnóstico local sin imprimir la conexión
 * ni su contraseña.
 * Devuelve texto para el arranque; no repara la base ni reintenta conectarse.
 */
export function databaseHelp(error) {
  // Codigos tecnicos se traducen solo para la terminal del desarrollador.
  if (error.code === "ER_ACCESS_DENIED_ERROR")
    return "Credenciales SQL incorrectas. Revisa DATABASE_URL en .env.";
  if (error.code === "ER_BAD_DB_ERROR" || error.code === "ER_NO_SUCH_TABLE")
    return "Falta crear la base o sus tablas. Ejecuta npm run setup:local.";
  if (error.code === "ER_TABLEACCESS_DENIED_ERROR")
    return "Faltan permisos SQL. Revisa backend/db/least-privilege.sql.";
  return "MySQL no responde. Ejecuta npm run setup:local y luego npm run doctor.";
}

// Exporta: checkDatabase y databaseHelp. Consumido por app, server y scripts.
// Usa: backend/config/db.js. No devuelve credenciales ni filas de usuarios.
