/**
 * Presenta mensajes accesibles de formularios reutilizando Alert.
 *
 * Lectura guiada. Componente reutilizable FormStatus. Sus props conectan contenido y
 * acciones con el componente que lo usa; para seguir el dato, buscar sus importaciones y
 * los callbacks recibidos en lugar de suponer que guarda directamente en una base.
 */
import { Alert } from "./Alert.jsx";

export function FormStatus({ form }) {
  return form.status ? (
    <Alert type={form.status.type}>{form.status.message}</Alert>
  ) : null;
}

// Exporta: FormStatus.
// Lo utilizan: code and profile forms.
// Depende de: Alert.
