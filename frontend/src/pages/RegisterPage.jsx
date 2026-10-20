/**
 * Formulario de registro con validacion en tiempo real y chequeo de disponibilidad.
 */
import { UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { AuthLayout } from "../components/AuthLayout.jsx";
import { Button } from "../components/Button.jsx";
import { PasswordStrength } from "../components/PasswordStrength.jsx";
import { TextField } from "../components/TextField.jsx";
import { SocialLoginButtons } from "../components/SocialLoginButtons.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { checkAvailability } from "../services/authService.js";
import {
  fieldErrorsToObject,
  validateConfirmPassword,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/validators.js";

const initialValues = {
  // Estado inicial controlado para todos los inputs del registro.
  email: "",
  username: "",
  displayName: "",
  password: "",
  confirmPassword: "",
};

export function RegisterPage() {
  // El alta no inicia sesión: requiere confirmar el correo mediante un código.
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [availability, setAvailability] = useState({
    emailAvailable: null,
    usernameAvailable: null,
    loading: false,
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcula errores locales en tiempo real sin esperar al backend.
  const localErrors = useMemo(
    () => ({
      email: validateEmail(values.email),
      username: validateUsername(values.username),
      displayName: validateDisplayName(values.displayName),
      password: validatePassword(values.password),
      confirmPassword: validateConfirmPassword(
        values.password,
        values.confirmPassword,
      ),
    }),
    [values],
  );

  useEffect(() => {
    // Solo consulta disponibilidad cuando email/username tienen formato valido.
    const emailIsCheckable = values.email.trim() && !localErrors.email;
    const usernameIsCheckable = values.username.trim() && !localErrors.username;

    if (!emailIsCheckable && !usernameIsCheckable) {
      setAvailability({
        emailAvailable: null,
        usernameAvailable: null,
        loading: false,
      });
      return;
    }

    // AbortController evita setear estado si el usuario cambia rapido de campo.
    const controller = new AbortController();
    // Debounce de 450ms para no disparar una request por cada tecla.
    const timer = window.setTimeout(async () => {
      setAvailability((current) => ({ ...current, loading: true }));
      try {
        const result = await checkAvailability(
          {
            email: emailIsCheckable ? values.email : "",
            username: usernameIsCheckable ? values.username : "",
          },
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setAvailability({ ...result, loading: false });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setAvailability({
            emailAvailable: null,
            usernameAvailable: null,
            loading: false,
          });
          setStatus({ type: "error", message: error.message });
        }
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [localErrors.email, localErrors.username, values.email, values.username]);

  if (isAuthenticated) {
    // Un usuario logueado no necesita volver a registrarse.
    return <Navigate to="/perfil" replace />;
  }

  // Errores especificos de duplicados vienen del endpoint de disponibilidad.
  const availabilityErrors = {
    email:
      availability.emailAvailable === false
        ? "Ese email ya esta registrado."
        : "",
    username:
      availability.usernameAvailable === false
        ? "Ese username ya esta en uso."
        : "",
  };

  // Solo muestra errores cuando el campo ya fue tocado o enviado.
  const visibleErrors = {
    email: touched.email
      ? serverErrors.email || availabilityErrors.email || localErrors.email
      : "",
    username: touched.username
      ? serverErrors.username ||
        availabilityErrors.username ||
        localErrors.username
      : "",
    displayName: touched.displayName
      ? serverErrors.displayName || localErrors.displayName
      : "",
    password: touched.password
      ? serverErrors.password || localErrors.password
      : "",
    confirmPassword: touched.confirmPassword
      ? serverErrors.confirmPassword || localErrors.confirmPassword
      : "",
  };

  const updateValue = (field) => (event) => {
    // Actualiza un campo sin mutar el estado previo.
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setTouched((current) => ({ ...current, [field]: true }));
    setServerErrors((current) => ({ ...current, [field]: "" }));
  };

  const markTouched = (field) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const submit = async (event) => {
    // Evita submit HTML tradicional para manejar feedback en React.
    event.preventDefault();
    setTouched({
      email: true,
      username: true,
      displayName: true,
      password: true,
      confirmPassword: true,
    });
    setStatus({ type: "", message: "" });

    // No envia al backend si ya hay errores locales o duplicados conocidos.
    const hasErrors =
      Object.values(localErrors).some(Boolean) ||
      availabilityErrors.email ||
      availabilityErrors.username;

    if (hasErrors) return;

    setIsSubmitting(true);
    try {
      // El backend vuelve a validar y devuelve el desafío de verificación.
      const result = await register(values);
      navigate("/verificar-email", {
        replace: true,
        state: {
          challengeId: result.challengeId || "",
          identifier: result.identifier || values.email,
          message: result.message,
        },
      });
    } catch (error) {
      setServerErrors(fieldErrorsToObject(error.details));
      setStatus({
        type: "error",
        message: error.message || "No se pudo crear la cuenta.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout variant="register">
      <div className="form-panel form-panel--wide">
        <div className="section-heading">
          <p className="eyebrow">TU PRIMER PASO</p>
          <h1>Hacé lugar para vos.</h1>
          <p>Creá tu cuenta. Después verificamos tu correo con un código.</p>
        </div>

        {status.message ? (
          <Alert type={status.type}>{status.message}</Alert>
        ) : null}

        <form className="stack-form" onSubmit={submit} noValidate>
          <div className="two-column">
            <TextField
              label="Email"
              type="email"
              value={values.email}
              onBlur={markTouched("email")}
              onChange={updateValue("email")}
              error={visibleErrors.email}
              help={availability.emailAvailable ? "Email disponible." : ""}
              autoComplete="email"
            />
            <TextField
              label="Nombre de usuario"
              value={values.username}
              onBlur={markTouched("username")}
              onChange={updateValue("username")}
              error={visibleErrors.username}
              help={
                availability.usernameAvailable
                  ? "Username disponible."
                  : "Letras, numeros, _ o punto."
              }
              autoComplete="username"
            />
          </div>
          <TextField
            label="Nombre visible"
            value={values.displayName}
            onBlur={markTouched("displayName")}
            onChange={updateValue("displayName")}
            error={visibleErrors.displayName}
            help="Opcional; si queda vacio usamos tu username."
            autoComplete="name"
          />
          <div className="two-column two-column--top">
            <div>
              <TextField
                label="Contraseña"
                type="password"
                value={values.password}
                onBlur={markTouched("password")}
                onChange={updateValue("password")}
                error={visibleErrors.password}
                autoComplete="new-password"
              />
              <PasswordStrength password={values.password} />
            </div>
            <TextField
              label="Confirmar contraseña"
              type="password"
              value={values.confirmPassword}
              onBlur={markTouched("confirmPassword")}
              onChange={updateValue("confirmPassword")}
              error={visibleErrors.confirmPassword}
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            icon={UserPlus}
            loading={isSubmitting || availability.loading}
          >
            Crear mi cuenta
          </Button>
        </form>

        <SocialLoginButtons />

        <p className="switch-copy">
          ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

// This file exports: RegisterPage (registration view).
// It is used by: src/App.jsx.
// It imports from: React, React Router, auth services, auth hook, validators, and UI components.
