/**
 * Comparte el borrador, la validación y los errores de los formularios de R5.
 *
 * Lectura guiada. Agrupa valores, validación, estado pendiente y errores por campo.
 * Recibir una respuesta correcta del servidor es lo que permite mostrar éxito, no
 * simplemente pulsar Enviar.
 */
import { useState } from "react";
import { fieldErrorsToObject } from "../utils/validators.js";

/**
 * Agrupa valores, campos tocados, errores locales/remotos, espera y resultado.
 * validate(values) devuelve errores por campo y onSubmit(values) realiza la operación; el hook no
 * conoce rutas HTTP ni tablas.
 * Expone field, submit, run y reset para reutilizar la misma secuencia en los formularios del
 * perfil y códigos.
 */
export function useForm(initialValues, validate, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const localErrors = validate(values);

  /**
   * Devuelve las props controladas de un campo: valor, cambio, desenfoque y error visible si fue
   * tocado.
   * Al editar limpia el error remoto de ese campo para permitir corregirlo sin ocultar los demás.
   */
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

  /**
   * Ejecuta una operación asíncrona mostrando espera y limpiando mensajes previos.
   * Devuelve su resultado, o null si falla después de convertir el error en estado/mensajes por
   * campo; no vuelve a lanzar ese error.
   */
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

  /**
   * Detiene el envío HTML, marca todos los campos como tocados y solo ejecuta onSubmit si no hay
   * errores locales.
   * Delega espera y fallos a run; la validación del backend sigue siendo obligatoria.
   */
  async function submit(event) {
    event.preventDefault();
    setTouched(
      Object.fromEntries(Object.keys(values).map((key) => [key, true])),
    );
    if (Object.values(localErrors).some(Boolean)) return;
    await run(() => onSubmit(values));
  }

  /**
   * Reemplaza valores por los indicados o por los iniciales y limpia campos tocados/errores
   * remotos.
   * No borra status, para que una confirmación exitosa pueda seguir visible después de vaciar el
   * formulario.
   */
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

