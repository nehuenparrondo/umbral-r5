/**
 * Implementa gestion admin de usuarios. Resuelve rol admin, listado sin hashes y
 * auditoria de acciones.
 *
 * Lectura guiada. Listado/edición administrativa y consulta de auditoría. Los permisos se
 * exigen en las rutas; los cambios de rol y estado no son simples preferencias visuales.
 */
import { writeAuditLog } from "../models/auditLogModel.js";
import { listUsers, updateUserAdminFields } from "../models/userModel.js";
import { AppError } from "../utils/errors.js";
import { withTransaction } from "../config/db.js";
import { revokeAllUserSessions } from "../models/sessionModel.js";
import { listAuditLogs } from "../models/auditLogModel.js";

const toPageNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getUsers = async (req, res) => {
  const page = toPageNumber(req.query.page, 1);
  const pageSize = Math.min(toPageNumber(req.query.pageSize, 20), 50);
  const result = await listUsers({ page, pageSize });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: "ADMIN_LIST_USERS",
    req,
    metadata: { page, pageSize },
  });

  res.json(result);
};

export const updateUserAsAdmin = async (req, res) => {
  // Normalizar UUID también antes de comparar identidades administrativas.
  const targetUserId = req.params.id.toLowerCase();
  const role = req.body.role;
  const isActive = Boolean(req.body.isActive);

  if (targetUserId === req.user.id && (role !== "admin" || !isActive)) {
    throw new AppError(
      "No podes quitarte tu propio acceso admin ni desactivar tu usuario.",
      400,
    );
  }

  // El cambio y su auditoria son atomicos: ambos se confirman o ambos se deshacen.
  const updatedUser = await withTransaction(async (client) => {
    const updated = await updateUserAdminFields(
      {
        id: targetUserId,
        role,
        isActive,
      },
      client,
    );

    if (!updated) {
      throw new AppError("Usuario no encontrado.", 404);
    }

    if (!isActive) await revokeAllUserSessions(targetUserId, client);
    await writeAuditLog(
      {
        actorUserId: req.user.id,
        action: "ADMIN_UPDATE_USER",
        targetUserId,
        req,
        metadata: { role, isActive },
      },
      client,
    );
    return updated;
  });

  res.json({ user: updatedUser });
};

export const getAuditLogs = async (req, res) => {
  const page = toPageNumber(req.query.page, 1);
  const pageSize = 20;
  // La ruta valida el filtro; se vuelve a pasar como parametro, nunca como SQL.
  const action = req.query.action || null;
  const result = await listAuditLogs({ page, pageSize, action });
  // Leer datos administrativos tambien es una accion auditable.
  await writeAuditLog({
    actorUserId: req.user.id,
    action: "ADMIN_VIEW_AUDIT",
    req,
    metadata: { page, action },
  });
  res.json(result);
};

// Exporta: admin controller handlers.
// Lo utilizan: backend/routes/adminRoutes.js.
// Depende de: audit/user models and AppError.
