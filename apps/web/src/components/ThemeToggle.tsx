"use client";

import { useSyncExternalStore } from "react";

import { IconMoon, IconSun } from "@/components/icons";

const CLAVE_STORAGE = "bmi-theme";

type Modo = "claro" | "oscuro";

/**
 * Toggle claro/oscuro de Verde Neón (2026-08-28).
 *
 * **El valor real vive en el atributo `data-theme` de `<html>`**, puesto
 * antes de hidratar por el script inline de `layout.tsx` para que no haya
 * parpadeo. Así que este componente no guarda una copia de ese valor: lo
 * **lee** con `useSyncExternalStore`, que es justamente para estado que
 * vive fuera de React.
 *
 * Antes tenía un `useState("claro")` más un `useEffect` que leía el DOM y
 * se corregía. Funcionaba, pero era una copia que podía quedar desfasada
 * —cualquier otra cosa que tocara `data-theme` dejaba el ícono mintiendo—
 * y además `setState` dentro de un efecto dispara un render en cascada, que
 * es lo que marca `react-hooks/set-state-in-effect`. Leer la fuente de
 * verdad en vez de copiarla arregla las dos cosas de una.
 */
function suscribir(alCambiar: () => void) {
  const observador = new MutationObserver(alCambiar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observador.disconnect();
}

function modoDelDom(): Modo {
  return document.documentElement.getAttribute("data-theme") === "oscuro"
    ? "oscuro"
    : "claro";
}

/** En el servidor no hay DOM que leer. "claro" es exactamente lo que asume
 *  el script inline cuando no hay nada guardado, así que el HTML servido y
 *  el primer render del cliente coinciden y no hay choque de hidratación. */
function modoEnElServidor(): Modo {
  return "claro";
}

export function ThemeToggle() {
  const modo = useSyncExternalStore(suscribir, modoDelDom, modoEnElServidor);

  function alternar() {
    const siguiente: Modo = modo === "oscuro" ? "claro" : "oscuro";
    // Escribir el atributo alcanza: el MutationObserver de arriba avisa y el
    // componente se vuelve a pintar solo. No hay que sincronizar nada a mano.
    document.documentElement.setAttribute("data-theme", siguiente);
    try {
      window.localStorage.setItem(CLAVE_STORAGE, siguiente);
    } catch {
      // Modo incógnito o storage bloqueado: el toggle sigue funcionando
      // para esta visita, solo no persiste a la próxima.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={modo === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="rounded-full border border-border p-1.5 text-muted transition-colors hover:border-accent/60 hover:text-foreground"
    >
      {modo === "oscuro" ? (
        <IconSun className="h-4 w-4" />
      ) : (
        <IconMoon className="h-4 w-4" />
      )}
    </button>
  );
}
