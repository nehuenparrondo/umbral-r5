/**
 * Reutiliza una vista para verificar email, desbloquear y recuperar contrasena.
 *
 * Lectura guiada. Pantalla compartida de códigos. El propósito distingue verificar,
 * desbloquear o restablecer; un mismo número no autoriza operaciones distintas sin el
 * desafío correspondiente.
 */
import { ArrowRight, Mail, RotateCw } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { AuthLayout } from "../components/AuthLayout.jsx";
import { Button } from "../components/Button.jsx";
import { FormStatus } from "../components/FormStatus.jsx";
import { PasswordStrength } from "../components/PasswordStrength.jsx";
import { TextField } from "../components/TextField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useCooldown } from "../hooks/useCooldown.js";
import { useForm } from "../hooks/useForm.js";
import {
  confirmCode,
  requestCode,
  resetPassword,
} from "../services/codeService.js";
import {
  validateConfirmPassword,
  validatePassword,
} from "../utils/validators.js";

const titles = {
  verify_email: "Verificá tu correo.",
  unlock: "Volvé a ingresar.",
  reset_password: "Recuperá tu contraseña.",
};

/**
 * Reutiliza una pantalla para verify_email, unlock y reset_password según purpose.
 * Primero solicita desafío por identificador; con challengeId muestra código y, al recuperar,
 * contraseña nueva.
 * Verificar email vuelve al login; si desbloquear devuelve una sesión, la aplica y abre bienvenida.
 * El servidor decide el resultado válido.
 */
export function CodePage({ purpose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const [challengeId, setChallengeId] = useState(
    location.state?.challengeId || "",
  );
  const cooldown = useCooldown();

  const form = useForm(
    {
      identifier: location.state?.identifier || "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
    (values) => ({
      identifier: values.identifier.trim() ? "" : "Ingresa tu email o usuario.",
      code:
        challengeId && !/^\d{6}$/.test(values.code)
          ? "Ingresa los 6 numeros del codigo."
          : "",
      newPassword:
        challengeId && purpose === "reset_password"
          ? validatePassword(values.newPassword)
          : "",
      confirmPassword:
        challengeId && purpose === "reset_password"
          ? validateConfirmPassword(values.newPassword, values.confirmPassword)
          : "",
    }),
    async (values) => {
      if (!challengeId) return sendCode();
      const body = { challengeId, code: values.code, purpose };
      const result =
        purpose === "reset_password"
          ? await resetPassword({
              ...body,
              newPassword: values.newPassword,
              confirmPassword: values.confirmPassword,
            })
          : await confirmCode(body);

      if (result.user) {
        applySession(result);
        navigate("/bienvenida", {
          replace: true,
        });
      } else {
        navigate("/login", {
          replace: true,
          state: { message: result.message },
        });
      }
      return null;
    },
  );

  /**
   * Solicita un desafío para el identificador/proósito, guarda su id, vacía el código anterior e
   * inicia la espera visual.
   * Devuelve la respuesta para mostrar el mensaje; el código secreto se consulta en el correo, no
   * en este JSON.
   */
  async function sendCode() {
    const result = await requestCode({
      identifier: form.values.identifier.trim().toLowerCase(),
      purpose,
    });
    setChallengeId(result.challengeId);
    form.setValues((values) => ({ ...values, code: "" }));
    cooldown.restart();
    return result;
  }

  return (
    <AuthLayout variant={purpose}>
      <div className="form-panel">
        <div className="section-heading">
          <p className="eyebrow">Seguridad de la cuenta</p>
          <h1>{titles[purpose]}</h1>
          <p>
            Consultá el código en el buzón de pruebas de Mailtrap configurado
            para este trabajo.
          </p>
        </div>
        {location.state?.message ? (
          <Alert type="info">{location.state.message}</Alert>
        ) : null}
        <FormStatus form={form} />
        <form className="stack-form" onSubmit={form.submit} noValidate>
          <TextField
            label="Email o usuario"
            autoComplete="username"
            maxLength={254}
            readOnly={Boolean(challengeId)}
            {...form.field("identifier")}
          />
          {challengeId ? (
            <>
              <TextField
                label="Codigo de verificacion"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                {...form.field("code")}
              />
              {purpose === "reset_password" ? (
                <div className="two-column">
                  <div>
                    <TextField
                      label="Nueva contrasena"
                      type="password"
                      autoComplete="new-password"
                      {...form.field("newPassword")}
                    />
                    <PasswordStrength password={form.values.newPassword} />
                  </div>
                  <TextField
                    label="Confirmar nueva contrasena"
                    type="password"
                    autoComplete="new-password"
                    {...form.field("confirmPassword")}
                  />
                </div>
              ) : null}
            </>
          ) : null}
          <div className="form-actions">
            <Button
              type="submit"
              icon={challengeId ? ArrowRight : Mail}
              loading={form.busy}
            >
              {challengeId ? "Confirmar codigo" : "Enviar codigo"}
            </Button>
            {challengeId ? (
              <Button
                type="button"
                icon={RotateCw}
                variant="secondary"
                disabled={form.busy || cooldown.seconds > 0}
                onClick={() => form.run(sendCode)}
              >
                {cooldown.seconds
                  ? `Reenviar en ${cooldown.seconds} s`
                  : "Reenviar codigo"}
              </Button>
            ) : null}
          </div>
        </form>
        <div className="auth-links">
          <Link to="/login">Volver al ingreso</Link>
          {challengeId ? (
            <button
              className="text-button"
              type="button"
              disabled={form.busy}
              onClick={() => {
                setChallengeId("");
                form.reset();
                form.setStatus(null);
              }}
            >
              Usar otra cuenta
            </button>
          ) : null}
        </div>
      </div>
    </AuthLayout>
  );
}

