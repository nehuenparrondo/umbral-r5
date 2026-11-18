/**
 * Cambia una clave existente o crea una para cuentas nacidas por OAuth.
 */
import { KeyRound } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useForm } from "../../hooks/useForm.js";
import { changePassword } from "../../services/userService.js";
import {
  validateConfirmPassword,
  validatePassword,
} from "../../utils/validators.js";
import { Button } from "../Button.jsx";
import { FormStatus } from "../FormStatus.jsx";
import { PasswordStrength } from "../PasswordStrength.jsx";
import { TextField } from "../TextField.jsx";

/**
 * Valida contraseña nueva/confirmación y exige la actual cuando user.hasPassword es true.
 * Envía los datos al servicio, actualiza el perfil confirmado y vacía los campos después del éxito.
 * El hash se calcula exclusivamente en el backend; una cuenta social puede establecer aquí su
 * primera contraseña local.
 */
export function PasswordChangeForm() {
  const { user, updateAuthenticatedUser } = useAuth();
  const form = useForm(
    { currentPassword: "", newPassword: "", confirmPassword: "" },
    (values) => ({
      currentPassword:
        user.hasPassword && !values.currentPassword
          ? "Ingresa tu contrasena actual."
          : "",
      newPassword: validatePassword(values.newPassword),
      confirmPassword: validateConfirmPassword(
        values.newPassword,
        values.confirmPassword,
      ),
    }),
    async (values) => {
      const result = await changePassword(values);
      updateAuthenticatedUser(result.user || { ...user, hasPassword: true });
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
        <KeyRound aria-hidden="true" />
        <div>
          <h2>
            {user.hasPassword ? "Cambiar contrasena" : "Crear contrasena"}
          </h2>
          <p>
            {user.hasPassword
              ? "La clave actual confirma que el cambio es tuyo."
              : "Agrega un acceso local para no depender del proveedor social."}
          </p>
        </div>
      </div>
      <FormStatus form={form} />
      {user.hasPassword ? (
        <TextField
          label="Contrasena actual"
          type="password"
          autoComplete="current-password"
          {...form.field("currentPassword")}
        />
      ) : null}
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
      <Button type="submit" icon={KeyRound} loading={form.busy}>
        {user.hasPassword ? "Actualizar contrasena" : "Crear contrasena"}
      </Button>
    </form>
  );
}

