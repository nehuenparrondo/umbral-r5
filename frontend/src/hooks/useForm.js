/**
 * Comparte estado, validacion y errores entre formularios R3/R5.
 *
 * Lectura guiada. Agrupa valores, validación, estado pendiente y errores por campo.
 * Recibir una respuesta correcta del servidor es lo que permite mostrar éxito, no
 * simplemente pulsar Enviar.
 */
import { useState } from "react";
import { fieldErrorsToObject } from "../utils/validators.js";

export function useForm(initialValues, validate, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const localErrors = validate(values);

  const field = (name) => ({
    value: values[name],
    onChange: (event) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      setTouched((current) => ({ ...current, [name]: true }));
      setServerErrors((current) => ({ ...current, [name]: "" }));
    },
    onBlur: () => setTouched((current) => ({ ...current, [name]: true })),
    error: touched[name] ? serverErrors[name] || localErrors[name] || "" : "",
  });

  async function run(operation) {
    setBusy(true);
    setStatus(null);
    setServerErrors({});
    try {
      const result = await operation();
      if (result?.message) {
        setStatus({ type: "success", message: result.message });
      }
      return result;
    } catch (error) {
      setServerErrors(fieldErrorsToObject(error.details));
      setStatus({ type: "error", message: error.message });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setTouched(
      Object.fromEntries(Object.keys(values).map((key) => [key, true])),
    );
    if (Object.values(localErrors).some(Boolean)) return;
    await run(() => onSubmit(values));
  }

  function reset(next = initialValues) {
    setValues(next);
    setTouched({});
    setServerErrors({});
  }

  return {
    values,
    field,
    submit,
    run,
    reset,
    busy,
    status,
    setStatus,
    setValues,
  };
}

// Exporta: useForm.
// Lo utilizan: CodePage and profile forms.
// Depende de: React and validators.
