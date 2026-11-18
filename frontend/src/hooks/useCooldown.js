/**
 * Muestra la espera visual para reenviar codigos; el limite real queda en backend.
 */
import { useEffect, useState } from "react";

/**
 * Cuenta segundos con un temporizador que se limpia al cambiar o desmontar; restart inicia una
 * espera de 60 segundos.
 * Evita repetir inmediatamente el envío desde la interfaz. El servidor aplica además sus propios
 * límites y vencimiento del código.
 */
export function useCooldown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setTimeout(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [seconds]);
  return { seconds, restart: () => setSeconds(60) };
}

