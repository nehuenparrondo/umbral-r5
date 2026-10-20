/**
 * Presenta mensajes accesibles de formularios reutilizando Alert.
 */
import { Alert } from "./Alert.jsx";

export function FormStatus({ form }) {
  return form.status ? (
    <Alert type={form.status.type}>{form.status.message}</Alert>
  ) : null;
}

// This file exports: FormStatus.
// It is used by: code and profile forms.
// It imports from: Alert.
