/**
 * Reune el perfil completo de R3 y las identidades OAuth vinculadas.
 */
import { Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { EmailChangeForm } from "../components/profile/EmailChangeForm.jsx";
import { PasswordChangeForm } from "../components/profile/PasswordChangeForm.jsx";
import { ProfileDetailsForm } from "../components/profile/ProfileDetailsForm.jsx";
import { getOAuthAccounts } from "../services/userService.js";

export function ProfilePage() {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [oauthStatus, setOAuthStatus] = useState({
    type: searchParams.get("oauth") ? "success" : "",
    message: searchParams.get("oauth")
      ? `Ingreso con ${searchParams.get("oauth")} completado correctamente.`
      : "",
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
    <section className="profile-grid">
      <div className="section-heading profile-heading">
        <p className="eyebrow">TU ESPACIO PERSONAL</p>
        <h1>Tu cuenta, a tu manera.</h1>
        <p>
          Actualizá tus datos, cuidá tu acceso y gestioná tus conexiones desde
          un solo lugar.
        </p>
      </div>

      <ProfileDetailsForm />
      <EmailChangeForm />
      <PasswordChangeForm />

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
                <span>{account.emailAtProvider || "Email no compartido"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-copy">Todavia no vinculaste cuentas sociales.</p>
        )}
      </section>
    </section>
  );
}

// This file exports: ProfilePage.
// It is used by: App behind ProtectedRoute.
// It imports from: R3 profile forms, OAuth account service and reusable alerts.
