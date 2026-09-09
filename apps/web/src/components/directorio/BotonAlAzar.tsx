"use client";

import { type TrackEnCola, useRockola } from "@/components/rockola/Rockola";

/**
 * La moneda de la rockola: pone algo sin que haya que elegirlo.
 *
 * Tres decisiones que lo hacen sentir un botón y no un enlace:
 *
 * - **`scale(0.97)` al oprimir**, 160 ms. Entre el click y el primer sonido
 *   pasa medio segundo largo —hay que montar un iframe y pedirle el video a
 *   otro servidor—, y sin acuse inmediato el botón parece muerto.
 * - **El nombre del track aparece antes que el audio.** Lo hace la bandeja al
 *   recibir la cola, no este botón, pero es la misma idea: primero se dice
 *   qué va a sonar, después suena.
 * - **No repite lo que está puesto.** Con un catálogo chico, el azar sin
 *   memoria devuelve dos veces lo mismo y se lee como que el botón falló.
 */
export function BotonAlAzar({ tracks }: { tracks: TrackEnCola[] }) {
  const { ponerAlAzar } = useRockola();

  // Sin nada cargado el botón no existe. Uno que no puede hacer nada y avisa
  // con un aviso de error hace ver rota una página que solo está vacía.
  if (!tracks.length) return null;

  return (
    <button
      type="button"
      onClick={() => ponerAlAzar(tracks)}
      className="rounded-full border border-accent px-4 py-1.5 font-display text-sm font-semibold tracking-tight text-accent transition-[transform,background-color,color] duration-150 hover:bg-accent hover:text-background active:scale-[0.97]"
      style={{ transitionTimingFunction: "var(--ease-salida)" }}
    >
      Suena algo
    </button>
  );
}
