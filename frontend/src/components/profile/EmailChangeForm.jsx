/**
 * Confirma cambios de email con contrasena local y codigo Mailtrap.
 *
 * Lectura guiada. Componente reutilizable EmailChangeForm. Sus props conectan contenido y
 * acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y
 * los callbacks recibidos en lugar de suponer que guarda directamente en una base.
 */
import { Check, Mail } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useForm } from "../../hooks/useForm.js";
import {
  confirmEmailChange,
  requestEmailChange,
} from "../../services/codeService.js";
import { validateEmail } from "../../utils/validators.js";
import { Alert } from "../Alert.jsx";
import { Button } from "../Button.jsx";
import { FormStatus } from "../FormStatus.jsx";
import { TextField } from "../TextField.jsx";

export function EmailChangeForm() {
  const { user, updateAuthenticatedUser } = useAuth();
  const [challengeId, setChallengeId] = useState("");
  const form = useForm(
    { email: "", currentPassword: "", code: "" },
    (values) =>
      challengeId
        ? {
            code: /^\d{6}$/.test(values.code)
              ? ""
              : "Ingresa los 6 numeros del codigo.",
          }
        : {
            email: validateEmail(values.email),
            currentPassword: values.currentPassword
              ? ""
              : "Ingresa tu contrasena actual.",
          },
    async (values) => {
      if (!challengeId) {
        const result = await requestEmailChange({
          email: values.email.trim().toLowerCase(),
          currentPassword: values.currentPassword,
        });
        setChallengeId(result.challengeId);
        return { message: "Revisa Mailtrap o el nuevo correo." };
      }
      const result = await confirmEmailChange({
        challengeId,
        code: values.code,
      });
      updateAuthenticatedUser(result.user);
      setChallengeId("");
      form.reset();
      return result;
    },
  );

  return (
    <form
      className="profile-section stack-form"
      onSubmit={form.submit}
      noValidate
    >
      <div className="panel-title">
        <Mail aria-hidden="true" />
        <div>
          <h2>Cambiar email</h2>
          <p className="current-email">Actual: {user.email}</p>
        </div>
      </div>
      {!user.hasPassword ? (
        <Alert type="info">
          Primero crea una contrasena local para autorizar este cambio.
        </Alert>
      ) : (
        <>
          <FormStatus form={form} />
          {!challengeId ? (
            <>
              <TextField
                label="Nuevo email"
                type="email"
                autoComplete="email"
                maxLength={254}
                {...form.field("email")}
              />
              <TextField
                label="Contrasena actual"
                type="password"
                autoComplete="current-password"
                {...form.field("currentPassword")}
              />
            </>
          ) : (
            <TextField
              label="Codigo para el nuevo email"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              {...form.field("code")}
            />
          )}
          <div className="form-actions">
            <Button
              type="submit"
              icon={challengeId ? Check : Mail}
              loading={form.busy}
            >
              {challengeId ? "Confirmar email" : "Enviar codigo"}
            </Button>
            {challengeId ? (
              <button
                type="button"
                className="text-button"
                disabled={form.busy}
                onClick={() => {
                  setChallengeId("");
                  form.setStatus(null);
                }}
              >
                Solicitar otro codigo
              </button>
            ) : null}
          </div>
        </>
      )}
    </form>
  );
}

// Exporta: EmailChangeForm.
// Lo utilizan: ProfilePage.
// Depende de: Mailtrap code services, session, useForm and controls.
