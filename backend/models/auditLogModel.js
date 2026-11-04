/**
 * Inserta logs de auditoria sin datos sensibles. Resuelve trazabilidad de login,
 * perfil y admin.
 *
 * Lectura guiada. Registro y consulta de eventos relevantes. La auditoría permite explicar
 * quién realizó una acción sin guardar contraseñas ni convertirla en una lista editable
 * desde el perfil.
 */
import { query } from "../config/db.js";

export const writeAuditLog = async (
  { actorUserId = null, action, targetUserId = null, req, metadata = {} },
  client = { query },
) => {
  await client.query(
    `INSERT INTO audit_logs (actor_user_id, action, target_user_id, ip_address, user_agent, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      actorUserId,
      action,
      targetUserId,
      req?.ip || null,
      req?.get("user-agent") || null,
      JSON.stringify(metadata),
    ],
  );
};

export async function listAuditLogs({ page, pageSize, action }) {
  // Solo columnas utiles: nunca hashes de contrasena, tokens o metadata interna.
  const { rows } = await query(
    `SELECT a.id, a.action, a.created_at AS "createdAt", a.ip_address AS "ipAddress",
            actor.username AS "actorUsername", target.username AS "targetUsername"
     FROM audit_logs a
     LEFT JOIN users actor ON actor.id = a.actor_user_id
     LEFT JOIN users target ON target.id = a.target_user_id
     WHERE (? IS NULL OR a.action = ?)
     ORDER BY a.created_at DESC, a.id DESC LIMIT ? OFFSET ?`,
    [action, action, pageSize, (page - 1) * pageSize],
  );
  const count = await query(
    "SELECT count(*) AS total FROM audit_logs WHERE (? IS NULL OR action = ?)",
    [action, action],
  );
  return { events: rows, total: count.rows[0].total, page, pageSize };
}

// Exporta: writeAuditLog.
// Lo utilizan: auth, profile, and admin controllers.
// Depende de: backend/config/db.js.
