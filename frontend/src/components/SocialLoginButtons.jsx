/**
 * Muestra botones sociales responsive y navega al inicio OAuth real del backend.
 *
 * Lectura guiada. Botones de redirección, no formularios de contraseña de la red social.
 * Consulta disponibilidad, evita dobles activaciones y delega la autenticación al
 * proveedor externo.
 */
import { useEffect, useState } from "react";
import { FaDiscord, FaGithub, FaGoogle } from "react-icons/fa6";
import {
  getOAuthProviders,
  getOAuthStartUrl,
} from "../services/authService.js";
import { isSocialProviderReady } from "../utils/socialLogin.js";

const defaults = [
  { id: "google", label: "Google", Icon: FaGoogle },
  { id: "github", label: "GitHub", Icon: FaGithub },
  { id: "discord", label: "Discord", Icon: FaDiscord },
];

export function SocialLoginButtons() {
  const [providers, setProviders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [pendingProvider, setPendingProvider] = useState("");

  useEffect(() => {
    const resetNavigation = () => setPendingProvider("");
    window.addEventListener("pageshow", resetNavigation);
    return () => window.removeEventListener("pageshow", resetNavigation);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getOAuthProviders(controller.signal)
      .then(({ providers }) => {
        if (!Array.isArray(providers)) {
          throw new Error("Respuesta de proveedores inválida.");
        }
        if (active) {
          setProviders(providers);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  const begin = (providerId) => {
    if (pendingProvider || !isSocialProviderReady(providers, providerId, status))
      return;
    setPendingProvider(providerId);
    // OAuth necesita una navegacion completa, no una llamada fetch/AJAX.
    window.location.assign(getOAuthStartUrl(providerId));
  };

  return (
    <div className="social-login" aria-label="Acceso con redes sociales">
      <div className="auth-divider" role="separator">
        <span>o continuar con</span>
      </div>
      <div className="social-login__grid">
        {defaults.map(({ id, label, Icon }) => {
          const disabled =
            Boolean(pendingProvider) ||
            !isSocialProviderReady(providers, id, status);
          return (
            <button
              className={`social-button social-button--${id}`}
              type="button"
              key={id}
              onClick={() => begin(id)}
              disabled={disabled}
              aria-busy={pendingProvider === id}
              title={
                pendingProvider
                  ? "Abriendo el acceso seguro del proveedor…"
                  : disabled
                  ? `${label} no está disponible en este momento.`
                  : `Continuar con ${label}`
              }
            >
              <Icon aria-hidden="true" />
              <span>
                {pendingProvider === id
                  ? `Abriendo ${label}…`
                  : `Continuar con ${label}`}
              </span>
            </button>
          );
        })}
      </div>
      <p className="social-login__hint" role="status">
        {pendingProvider
          ? "Abriendo la página oficial del proveedor. Al terminar volverás a Umbral."
          : status === "loading"
          ? "Comprobando opciones de acceso social…"
          : status === "error"
            ? "No pudimos comprobar el acceso social. Tu acceso con contraseña sigue disponible."
            : defaults.some(
                  ({ id }) => !isSocialProviderReady(providers, id, status),
                )
              ? "Algunas redes todavía no están configuradas. Podés ingresar con tu email y contraseña."
              : "Elegí tu cuenta en Google o GitHub. En Discord, revisá la cuenta y usá «¿No eres tú?» para cambiarla. Vas a salir temporalmente de Umbral y volver al finalizar."}
      </p>
      {status === "error" ? (
        <button
          className="social-button"
          type="button"
          onClick={() => {
            setStatus("loading");
            setAttempt((current) => current + 1);
          }}
        >
          Reintentar comprobación
        </button>
      ) : null}
    </div>
  );
}

// Exporta: SocialLoginButtons.
// Lo utilizan: LoginPage and RegisterPage.
// Depende de: React, react-icons and authService.
