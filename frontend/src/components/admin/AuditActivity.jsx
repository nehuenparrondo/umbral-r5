/**
 * Panel de actividad de R5. Consulta páginas de auditoría, aplica el filtro de acción y presenta
 * los eventos autorizados por el backend.
 */

// Requisito 8.11: historial visible solo para administradores autenticados.
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchAuditEvents } from "../../services/adminService.js";
import { Alert } from "../Alert.jsx";
import { Button } from "../Button.jsx";

const labels = {
  LOGIN_SUCCESS: "Ingreso correcto",
  LOGIN_FAILURE: "Ingreso fallido",
  USER_REGISTER: "Registro",
  LOGOUT: "Cierre de sesion",
  PASSWORD_CHANGE: "Cambio de contrasena",
  PROFILE_UPDATE: "Edicion de perfil",
  ADMIN_LIST_USERS: "Consulta de usuarios",
  ADMIN_UPDATE_USER: "Gestion de cuenta",
  ADMIN_VIEW_AUDIT: "Consulta de actividad",
};

/**
 * Mantiene página/filtro y consulta eventos administrativos. Al cambiar filtro vuelve a la primera
 * página.
 * Cancela la petición anterior al cambiar criterios o desmontarse para no mostrar resultados
 * viejos; las respuestas solo incluyen datos autorizados.
 */
export function AuditActivity() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ events: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Cancela la consulta anterior al cambiar filtro/pagina o abandonar la vista.
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchAuditEvents({ page, action }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, action, revision]);

  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  return (
    <section className="admin-layout" aria-label="Historial de actividad">
      <div className="toolbar">
        <label className="field">
          Tipo de evento
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button
          icon={RefreshCw}
          variant="secondary"
          loading={loading}
          onClick={() => setRevision((value) => value + 1)}
        >
          Actualizar actividad
        </Button>
      </div>
      {error ? <Alert type="error">{error}</Alert> : null}
      <div
        className="table-wrap"
        tabIndex="0"
        aria-label="Eventos registrados"
        aria-busy={loading}
      >
        <table className="user-table">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Evento</th>
              <th>Cuenta asociada</th>
              <th>Realizado por</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {result.events.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.createdAt).toLocaleString("es-AR")}</td>
                <td>
                  <span
                    className={
                      event.action === "LOGIN_FAILURE" ? "event-failure" : ""
                    }
                  >
                    {labels[event.action] || event.action}
                  </span>
                </td>
                <td>{event.targetUsername || "Cuenta no identificada"}</td>
                <td>{event.actorUsername || "Sin autenticar"}</td>
                <td>{event.ipAddress || "No disponible"}</td>
              </tr>
            ))}
            {!result.events.length ? (
              <tr>
                <td colSpan="5">
                  {loading
                    ? "Cargando actividad..."
                    : "No hay eventos para este filtro."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <Button
          variant="secondary"
          disabled={loading || page <= 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Anterior
        </Button>
        <span role="status">
          Pagina {page} de {pages}
        </span>
        <Button
          variant="secondary"
          disabled={loading || page >= pages}
          onClick={() => setPage((value) => value + 1)}
        >
          Siguiente
        </Button>
      </div>
    </section>
  );
}
// Exporta: AuditActivity. Consumido por AdminPage.
// Usa: adminService, Alert, Button y React; nunca lee PostgreSQL directamente.
