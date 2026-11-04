/**
 * Panel admin para listar usuarios y cambiar rol/estado sin exponer hashes.
 *
 * Lectura guiada. Componente reutilizable UserManagement. Sus props conectan contenido y
 * acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y
 * los callbacks recibidos en lugar de suponer que guarda directamente en una base.
 */
import { RefreshCw, Save, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "../Alert.jsx";
import { Button } from "../Button.jsx";
import { fetchUsers, updateUserAdmin } from "../../services/adminService.js";

export function UserManagement() {
  // users contiene usuarios publicos; la API no devuelve password_hash.
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [drafts, setDrafts] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  const loadUsers = useCallback(
    async (page = 1) => {
      // Carga usuarios paginados; el backend verifica rol admin en cada request.
      setIsLoading(true);
      setStatus({ type: "", message: "" });
      try {
        const result = await fetchUsers(page, pagination.pageSize);
        setUsers(result.users);
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        });
        setDrafts(
          // Crea un borrador por fila para editar rol/estado antes de guardar.
          result.users.reduce((acc, user) => {
            acc[user.id] = { role: user.role, isActive: user.isActive };
            return acc;
          }, {}),
        );
      } catch (error) {
        setStatus({
          type: "error",
          message: error.message || "No se pudo cargar el listado.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize],
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const updateDraft = (id, field, value) => {
    // Actualiza solo el borrador local de una fila.
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  };

  const saveUser = async (userId) => {
    // Guarda cambio admin; backend impide que admin se quite su propio acceso.
    setSavingId(userId);
    setStatus({ type: "", message: "" });
    try {
      const payload = await updateUserAdmin({ id: userId, ...drafts[userId] });
      setUsers((current) =>
        current.map((user) => (user.id === userId ? payload.user : user)),
      );
      setStatus({
        type: "success",
        message: "Usuario actualizado y accion auditada.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "No se pudo actualizar el usuario.",
      });
    } finally {
      setSavingId("");
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / pagination.pageSize),
  );

  return (
    <section className="admin-layout">
      <div className="toolbar">
        <Button
          type="button"
          variant="secondary"
          icon={RefreshCw}
          loading={isLoading}
          onClick={() => loadUsers(pagination.page)}
        >
          Actualizar
        </Button>
        <span className="toolbar__count">
          <Users aria-hidden="true" />
          {pagination.total} {pagination.total === 1 ? "usuario" : "usuarios"}
        </span>
      </div>

      {status.message ? (
        <Alert type={status.type}>{status.message}</Alert>
      ) : null}

      <div
        className="table-wrap"
        aria-live="polite"
        tabIndex="0"
        aria-label="Usuarios registrados"
      >
        <table className="user-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Creado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.username}</strong>
                  <span>{user.displayName}</span>
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={drafts[user.id]?.role || user.role}
                    onChange={(event) =>
                      updateDraft(user.id, "role", event.target.value)
                    }
                    aria-label={`Rol de ${user.username}`}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <label className="switch">
                    <input
                      type="checkbox"
                      aria-label={`Cuenta activa de ${user.username}`}
                      checked={Boolean(drafts[user.id]?.isActive)}
                      onChange={(event) =>
                        updateDraft(user.id, "isActive", event.target.checked)
                      }
                    />
                    <span>{drafts[user.id]?.isActive ? "Si" : "No"}</span>
                  </label>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString("es-AR")}</td>
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    icon={Save}
                    loading={savingId === user.id}
                    onClick={() => saveUser(user.id)}
                  >
                    Guardar
                  </Button>
                </td>
              </tr>
            ))}
            {!users.length && !isLoading ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <Button
          type="button"
          variant="secondary"
          disabled={pagination.page <= 1}
          onClick={() => loadUsers(pagination.page - 1)}
        >
          Anterior
        </Button>
        <span>
          Pagina {pagination.page} de {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={pagination.page >= totalPages}
          onClick={() => loadUsers(pagination.page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </section>
  );
}

// Exporta: UserManagement. Consumido por src/pages/AdminPage.jsx.
// Usa: componentes Alert/Button y services/adminService; administra solo usuarios.
