/**
 * Formulario de login con validacion local y errores genericos.
 */
import { LogIn } from "lucide-react";
import { useState } from "react";
import {
  Navigate,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { AuthLayout } from "../components/AuthLayout.jsx";
import { Button } from "../components/Button.jsx";
import { TextField } from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { SocialLoginButtons } from "../components/SocialLoginButtons.jsx";

const oauthErrors = {
  oauth_cancelled: "El acceso fue cancelado antes de completarse.",
  oauth_configuration:
    "La conexión social necesita revisar su configuración en Auth0. Por ahora podés usar tu email y contraseña.",
  oauth_denied:
    "El proveedor no autorizó el acceso. Revisá los permisos de tu cuenta o usá otro método.",
  oauth_invalid_state:
    "La solicitud social vencio o no es valida. Intenta nuevamente.",
  oauth_not_configured:
    "Ese proveedor todavia no tiene credenciales configuradas.",
  oauth_provider:
    "El proveedor no pudo completar el acceso. Intenta nuevamente.",
  oauth_profile: "El proveedor no entrego un perfil valido.",
  oauth_email_missing:
    "El proveedor no compartio un email. Usa otro metodo de acceso.",
  oauth_email_unverified:
    "No se vinculo la cuenta porque el proveedor no confirmo ese email.",
  oauth_account_disabled: "La cuenta local esta desactivada.",
  oauth_rate_limited:
    "Hubo demasiados intentos de acceso social. Espera unos minutos.",
};

export function LoginPage() {
  const { isAuthenticated, isAdmin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const oauthError = oauthErrors[searchParams.get("error")] || "";

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/perfil"} replace />;
  }

  const updateValue = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!values.identifier.trim())
      nextErrors.identifier = "Ingresa tu email o username.";
    if (!values.password) nextErrors.password = "Ingresa tu contrasena.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(values);
    } catch (error) {
      if (error.code === "EMAIL_VERIFICATION_REQUIRED") {
        navigate("/verificar-email", {
          state: { identifier: values.identifier, message: error.message },
        });
        return;
      }
      setStatus({
        type: "error",
        message: error.message || "Usuario o contrasena incorrectos.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="form-panel">
        <div className="section-heading">
          <p className="eyebrow">BIENVENIDO DE NUEVO</p>
          <h1>Entrá a tu espacio.</h1>
          <p>Tu cuenta y tus conexiones, donde las dejaste.</p>
        </div>

        {status.message || oauthError || location.state?.message ? (
          <Alert type={status.type || (oauthError ? "error" : "success")}>
            {status.message || oauthError || location.state?.message}
          </Alert>
        ) : null}

        <form className="stack-form" onSubmit={submit} noValidate>
          <TextField
            label="Email o usuario"
            placeholder="nombre@ejemplo.com"
            value={values.identifier}
            onChange={updateValue("identifier")}
            error={errors.identifier}
            autoComplete="username"
          />
          <TextField
            label="Contraseña"
            placeholder="Tu contraseña"
            type="password"
            value={values.password}
            onChange={updateValue("password")}
            error={errors.password}
            autoComplete="current-password"
          />
          <Button type="submit" icon={LogIn} loading={isSubmitting}>
            Ingresar
          </Button>
        </form>

        <SocialLoginButtons />

        <p className="switch-copy">
          ¿Todavía no tenés cuenta? <Link to="/registro">Crear mi cuenta</Link>
        </p>
        <div className="auth-links">
          <Link to="/recuperar">Olvidé mi contraseña</Link>
          <Link to="/codigo-acceso">Usar un código</Link>
          <Link to="/verificar-email">Verificar correo</Link>
        </div>
      </div>
    </AuthLayout>
  );
}

// This file exports: LoginPage (login view).
// It is used by: src/App.jsx.
// It imports from: React, React Router, auth hook, and form components.
