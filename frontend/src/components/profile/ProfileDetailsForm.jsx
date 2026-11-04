/**
 * Edita datos no sensibles; el email se verifica por un recorrido separado.
 *
 * Lectura guiada. Componente reutilizable ProfileDetailsForm. Sus props conectan contenido
 * y acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y
 * los callbacks recibidos en lugar de suponer que guarda directamente en una base.
 */
import { Save, UserRound } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useForm } from "../../hooks/useForm.js";
import { updateProfile } from "../../services/userService.js";
import {
  validateDisplayName,
  validateUsername,
} from "../../utils/validators.js";
import { Button } from "../Button.jsx";
import { FormStatus } from "../FormStatus.jsx";
import { TextField } from "../TextField.jsx";

export function ProfileDetailsForm() {
  const { user, updateAuthenticatedUser } = useAuth();
  const form = useForm(
    { username: user.username, displayName: user.displayName },
    (values) => ({
      username: validateUsername(values.username),
      displayName: validateDisplayName(values.displayName),
    }),
    async (values) => {
      const result = await updateProfile(values);
      updateAuthenticatedUser(result.user);
      return { message: "Datos guardados." };
    },
  );

  return (
    <form
      className="profile-section stack-form"
      onSubmit={form.submit}
      noValidate
    >
      <div className="panel-title">
        <UserRound aria-hidden="true" />
        <div>
          <h2>Datos personales</h2>
          <p>Rol actual: {user.role}</p>
        </div>
      </div>
      <FormStatus form={form} />
      <TextField
        label="Nombre de usuario"
        autoComplete="username"
        maxLength={30}
        {...form.field("username")}
      />
      <TextField
        label="Nombre visible"
        autoComplete="name"
        maxLength={80}
        {...form.field("displayName")}
      />
      <Button type="submit" icon={Save} loading={form.busy}>
        Guardar cambios
      </Button>
    </form>
  );
}

// Exporta: ProfileDetailsForm.
// Lo utilizan: ProfilePage.
// Depende de: session, useForm, validators and shared controls.
