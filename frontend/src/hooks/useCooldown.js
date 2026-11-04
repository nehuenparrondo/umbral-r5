/**
 * Muestra la espera visual para reenviar codigos; el limite real queda en backend.
 *
 * Lectura guiada. Hook reutilizable que agrupa estado o comportamiento de React. El nombre
 * use permite reconocer que se consume desde componentes u otros hooks, no como un
 * endpoint del servidor.
 */
import { useEffect, useState } from "react";

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

// Exporta: useCooldown.
// Lo utilizan: CodePage.
// Depende de: React timers.
