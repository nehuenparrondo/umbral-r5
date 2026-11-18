/**
 * Configuración de R5: tarjeta editable y secciones desplegables de seguridad y conexiones.
 *
 * Lectura guiada. Pantalla ProfilePage. Coordina presentación y eventos; seguir los
 * servicios, hooks o contexto importados para encontrar dónde se comprueban y guardan los
 * datos.
 */
import { Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { EmailChangeForm } from "../components/profile/EmailChangeForm.jsx";
import { PasswordChangeForm } from "../components/profile/PasswordChangeForm.jsx";
import { ProfileDetailsForm } from "../components/profile/ProfileDetailsForm.jsx";
import { getOAuthAccounts } from "../services/userService.js";

/**
 * Compone tarjeta editable, email/contraseña y listado de redes vinculadas. Consulta las redes al
 * montar.
 * La marca active evita aplicar una respuesta después de abandonar la pantalla; cada formulario
 * administra su guardado independiente.
 */
export function ProfilePage() {
  const [accounts, setAccounts] = useState([]);
  const [oauthStatus, setOAuthStatus] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    let active = true;
    getOAuthAccounts()
      .then((result) => {
        if (active) setAccounts(result.accounts);
      })
      .catch((error) => {
        if (active) {
          setOAuthStatus({
            type: "error",
            message:
              error.message || "No se pudieron cargar las cuentas sociales.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="simple-profile">
      <div className="section-heading profile-heading">
        <p className="eyebrow">TU ESPACIO PERSONAL</p>
        <h1>Configurá tu perfil.</h1>
        <p>Editá tu tarjeta y guardá tus cambios.</p>
        <Link to="/bienvenida">Volver a bienvenida</Link>
      </div>

      <ProfileDetailsForm />
      <details className="profile-options">
        <summary>Email y contraseña</summary>
        <div className="profile-grid">
          <EmailChangeForm />
          <PasswordChangeForm />
        </div>
      </details>

      <details className="profile-options">
        <summary>Cuentas vinculadas</summary>
        <section className="profile-section stack-form oauth-accounts-panel">
          <div className="panel-title">
            <Link2 aria-hidden="true" />
            <div>
              <h2>Cuentas vinculadas</h2>
              <p>Identidades externas asociadas a este usuario local.</p>
            </div>
          </div>
          {oauthStatus.message ? (
            <Alert type={oauthStatus.type}>{oauthStatus.message}</Alert>
          ) : null}
          {accounts.length ? (
            <ul className="oauth-account-list">
              {accounts.map((account) => (
                <li key={account.provider}>
                  <strong>{account.provider}</strong>
                  <span>
                    {account.emailAtProvider || "Email no compartido"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">
              Todavia no vinculaste cuentas sociales.
            </p>
          )}
        </section>
      </details>
    </section>
  );
}

