/**
 * Edita datos no sensibles; el email se verifica por un recorrido separado.
 */
import { Pencil, Save, UserRound } from "lucide-react";
import { useState } from "react";
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
import { Alert } from "../Alert.jsx";

/**
 * Separa los datos confirmados de user y el borrador editable de username/nombre visible.
 * Guardar valida y llama a la API; solo una respuesta exitosa actualiza AuthContext y cierra la
 * edición.
 * Cancelar descarta el borrador sin escribir en MySQL. El avatar de esta tarjeta es un icono, no
 * una carga de archivos.
 */
export function ProfileDetailsForm() {
  const { user, updateAuthenticatedUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const form = useForm(
    { username: user.username, displayName: user.displayName },
    (values) => ({
      username: validateUsername(values.username),
      displayName: validateDisplayName(values.displayName),
    }),
    async (values) => {
      // El contexto y la tarjeta cambian solo después de que la API confirmó la escritura.
      const result = await updateProfile(values);
      updateAuthenticatedUser(result.user);
      setEditing(false);
      setSaved(true);
      return { message: "Datos guardados." };
    },
  );

  // La tarjeta muestra datos confirmados. El formulario conserva un borrador separado.
  if (!editing) {
    return (
      <section
        className="profile-section personal-card"
        aria-labelledby="profile-name"
      >
        <span className="profile-avatar">
          <UserRound aria-hidden="true" />
        </span>
        <p className="eyebrow">MI PERFIL</p>
        <h2 id="profile-name">{user.displayName || user.username}</h2>
        <p className="muted-copy">@{user.username}</p>
        <p>{user.email}</p>
        {saved ? <Alert type="success">Datos guardados.</Alert> : null}
        <Button
          type="button"
          icon={Pencil}
          onClick={() => {
            form.reset({
              username: user.username,
              displayName: user.displayName,
            });
            form.setStatus(null);
            setSaved(false);
            setEditing(true);
          }}
        >
          Editar perfil
        </Button>
      </section>
    );
  }

  return (
    <form
      className="profile-section stack-form"
      onSubmit={form.submit}
      noValidate
    >
      <div className="panel-title">
        <UserRound aria-hidden="true" />
        <div>
          <h2>Editar perfil</h2>
          <p>Actualizá tus datos y guardá los cambios.</p>
        </div>
      </div>
      <FormStatus form={form} />
      <TextField
        label="Nombre de usuario"
        autoComplete="username"
        maxLength={30}
        autoFocus
        disabled={form.busy}
        {...form.field("username")}
      />
      <TextField
        label="Nombre visible"
        autoComplete="name"
        maxLength={80}
        disabled={form.busy}
        {...form.field("displayName")}
      />
      <div className="form-actions">
        <Button type="submit" icon={Save} loading={form.busy}>
          Guardar cambios
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={form.busy}
          onClick={() => {
            form.reset();
            form.setStatus(null);
            setEditing(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

