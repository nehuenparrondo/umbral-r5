/**
 * Presenta mensajes accesibles de formularios reutilizando Alert.
 */
import { Alert } from "./Alert.jsx";

/**
 * Lee form.status del hook useForm y presenta su tipo y mensaje mediante Alert. Devuelve null
 * cuando no hay resultado que informar.
 */
export function FormStatus({ form }) {
  return form.status ? (
    <Alert type={form.status.type}>{form.status.message}</Alert>
  ) : null;
}

