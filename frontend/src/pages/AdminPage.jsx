/**
 * Página administrativa de R5. Alterna la gestión de usuarios y el listado de auditoría dentro de
 * una ruta reservada a administradores.
 */

// Requisito 4.4: separa gestion de usuarios e historial en componentes propios.
import { useState } from "react";
import { Users, History } from "lucide-react";
import { UserManagement } from "../components/admin/UserManagement.jsx";
import { AuditActivity } from "../components/admin/AuditActivity.jsx";

/**
 * Alterna las pestañas Usuarios y Actividad y monta su panel correspondiente.
 * La ruta exige administrador; cada petición de esos paneles vuelve a comprobar el rol en el
 * servidor.
 */
export function AdminPage() {
  const [view, setView] = useState("users");
  return (
    <section className="admin-layout">
      <div className="section-heading">
        <p className="eyebrow">CENTRO DE CONTROL</p>
        <h1>Todo, en perspectiva.</h1>
        <p>Gestioná los accesos y consultá la actividad de tu comunidad.</p>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Administracion">
        <button
          id="users-tab"
          type="button"
          role="tab"
          aria-selected={view === "users"}
          aria-controls="admin-panel"
          onClick={() => setView("users")}
        >
          <Users aria-hidden="true" /> Usuarios
        </button>
        <button
          id="activity-tab"
          type="button"
          role="tab"
          aria-selected={view === "activity"}
          aria-controls="admin-panel"
          onClick={() => setView("activity")}
        >
          <History aria-hidden="true" /> Actividad
        </button>
      </div>
      <div
        id="admin-panel"
        role="tabpanel"
        aria-labelledby={view === "users" ? "users-tab" : "activity-tab"}
      >
        {view === "users" ? <UserManagement /> : <AuditActivity />}
      </div>
    </section>
  );
}
// Exporta: AdminPage. Consumido por App con ProtectedRoute requireAdmin.
// Usa: UserManagement y AuditActivity. La autorizacion real esta en Express.
