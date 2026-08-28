"use client";

import { useEffect, useState } from "react";

import { IconMoon, IconSun } from "@/components/icons";

const CLAVE_STORAGE = "bmi-theme";

/**
 * Toggle claro/oscuro de Verde Neón (2026-08-28). El valor real vive en el
 * atributo `data-theme` de `<html>`, puesto ANTES de hidratar por el script
 * inline en `layout.tsx` (para que no haya parpadeo ni choque de
 * hidratación). Este componente arranca asumiendo "claro" — lo mismo que
 * asume ese script cuando no hay nada guardado — y en `useEffect` lee el
 * valor real del DOM para corregirse si hace falta. Ese único reacomodo
 * ocurre después del primer render, así que nunca hay mismatch de SSR.
 */
export function ThemeToggle() {
  const [modo, setModo] = useState<"claro" | "oscuro">("claro");

  useEffect(() => {
    const actual = document.documentElement.getAttribute("data-theme");
    setModo(actual === "oscuro" ? "oscuro" : "claro");
  }, []);

  function alternar() {
    const siguiente = modo === "oscuro" ? "claro" : "oscuro";
    document.documentElement.setAttribute("data-theme", siguiente);
    try {
      window.localStorage.setItem(CLAVE_STORAGE, siguiente);
    } catch {
      // Modo incógnito o storage bloqueado: el toggle sigue funcionando
      // para esta visita, solo no persiste a la próxima.
    }
    setModo(siguiente);
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
