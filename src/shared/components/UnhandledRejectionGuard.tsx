"use client";

import { useEffect } from "react";

/**
 * Em alguns cenários do dev server/HMR no Windows, o browser pode disparar
 * `unhandledrejection` com `reason` sendo apenas um `Event` genérico.
 * Isso não traz stack útil e derruba a tela com overlay.
 */
export function UnhandledRejectionGuard() {
  useEffect(() => {
    const onUnhandled = (evt: PromiseRejectionEvent) => {
      if (evt.reason instanceof Event) {
        evt.preventDefault();
        // Mantém rastreabilidade no console sem quebrar a UI.
        console.warn("Unhandled rejection com Event genérico foi ignorado.", evt.reason);
      }
    };

    window.addEventListener("unhandledrejection", onUnhandled);
    return () => window.removeEventListener("unhandledrejection", onUnhandled);
  }, []);

  return null;
}
