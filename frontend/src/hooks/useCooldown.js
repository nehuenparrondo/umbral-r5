/**
 * Muestra la espera visual para reenviar codigos; el limite real queda en backend.
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

// This file exports: useCooldown.
// It is used by: CodePage.
// It imports from: React timers.
