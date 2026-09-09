"use client";

import { useState } from "react";

import { FundaConDisco } from "@/components/rockola/Disco";
import { type TrackEnCola, useRockola } from "@/components/rockola/Rockola";
import { IconEncolar, IconEnlaceExterno, IconPausa, IconPlay } from "@/components/icons";

/**
 * La cara sonora de la ficha del artista: la funda con el disco y el
 * tracklist.
 *
 * Es la contratapa de un LP, y encaja porque los datos curados tienen esa
 * forma.
 *
 * ⚠️ **Dos acciones por fila, no una.** Tocar el track lo pone a sonar ya —que
 * es lo que espera cualquiera que toca el nombre de una canción—, y el ícono
 * de la derecha lo manda al final de la cola. Hasta el 2026-09-09 el click
 * encolaba, y era una sorpresa: tocabas una canción y no sonaba.
 */
export function Contraportada({
  tracks,
  bandcampUrl,
}: {
  tracks: TrackEnCola[];
  bandcampUrl: string | null;
}) {
  const { actual, sonando, poner, encolar, alternar } = useRockola();

  // Qué disco se muestra en la funda: el que esté sonando si es de este
  // artista, y si no el primero del tracklist. Mostrar el de otro artista
  // convertiría la ficha en una segunda bandeja.
  const deEsteArtista = tracks.some((t) => t.id === actual?.id);
  const [enFunda, setEnFunda] = useState<TrackEnCola | null>(tracks[0] ?? null);
  const mostrado = deEsteArtista ? actual : enFunda;

  if (!tracks.length) {
    return (
      <section className="border-t border-border py-8">
        {/* El hueco se dice en voz alta. Sin tracks cargados no hay nada que
            sonar, y un reproductor vacío haría ver rota una ficha que no lo
            está. */}
        <p className="text-sm text-muted">Todavía no hay nada suyo para escuchar acá.</p>
        {bandcampUrl && (
          <div className="max-w-md">
            <EnlaceABandcamp url={bandcampUrl} />
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="border-t border-border py-10">
      <div className="flex flex-col gap-10 sm:flex-row sm:gap-12">
        <div className="shrink-0">
          <FundaConDisco
            track={mostrado}
            sonando={Boolean(deEsteArtista && sonando)}
            lado={200}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Cara A
          </h2>

          {/* El `-mx-3` deja que el realce del hover se salga tres píxeles a
              cada lado mientras el texto conserva su aire. Sin eso el título
              queda pegado al borde del bloque de color justo cuando el bloque
              aparece, que es cuando más se nota. */}
          <ol className="-mx-3 mt-4">
            {tracks.map((track, i) => {
              const puesto = track.id === actual?.id;
              return (
                <li
                  key={track.id}
                  className="flex items-stretch border-t border-border first:border-t-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      // Si ya es el que suena, el mismo click pausa y reanuda:
                      // volver a ponerlo desde cero sería perder el minuto que
                      // lleva andando.
                      if (puesto) alternar();
                      else poner(track);
                      setEnFunda(track);
                    }}
                    onMouseEnter={() => setEnFunda(track)}
                    // Con teclado pasa lo mismo que con el puntero: un estado
                    // que solo existe en `hover` no existe para quien tabula.
                    onFocus={() => setEnFunda(track)}
                    className="group flex min-w-0 flex-1 items-center gap-4 rounded-sm px-3 py-3.5 text-left transition-[transform,background-color] duration-150 hover:bg-surface-hover active:scale-[0.995]"
                    style={{ transitionTimingFunction: "var(--ease-salida)" }}
                  >
                    <span
                      className={
                        "flex h-7 w-7 shrink-0 items-center justify-center " +
                        (puesto ? "text-accent" : "text-muted")
                      }
                    >
                      {puesto ? (
                        sonando ? (
                          <IconPausa className="h-5 w-5" />
                        ) : (
                          <IconPlay className="h-5 w-5" />
                        )
                      ) : (
                        <>
                          <span className="font-mono text-xs group-hover:hidden group-focus-visible:hidden">
                            {i + 1}
                          </span>
                          <IconPlay className="hidden h-5 w-5 group-hover:block group-focus-visible:block" />
                        </>
                      )}
                    </span>

                    <span
                      className={
                        "min-w-0 flex-1 truncate font-display text-base font-semibold tracking-tight transition-colors sm:text-lg " +
                        (puesto ? "text-accent" : "group-hover:text-accent")
                      }
                    >
                      {track.titulo}
                    </span>

                    {track.anio && (
                      <span className="shrink-0 font-mono text-xs text-muted">{track.anio}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => encolar(track)}
                    aria-label={`Encolar ${track.titulo}`}
                    title="Encolar"
                    className="shrink-0 rounded-sm px-3 text-muted transition-[transform,background-color,color] duration-150 hover:bg-surface-hover hover:text-foreground active:scale-[0.97]"
                    style={{ transitionTimingFunction: "var(--ease-salida)" }}
                  >
                    <IconEncolar className="h-5 w-5" />
                  </button>
                </li>
              );
            })}
          </ol>

          {bandcampUrl && <EnlaceABandcamp url={bandcampUrl} />}
        </div>
      </div>
    </section>
  );
}

/**
 * El disco completo, en Bandcamp.
 *
 * ⚠️ **No entra a la cola y no es un olvido.** Su reproductor no expone
 * control por JavaScript, así que no se puede encadenar: una rockola que se
 * detiene sola en la tercera canción no es una rockola. Va como enlace, que
 * es donde va en una contratapa de verdad — y es donde el artista cobra, que
 * en una plataforma hecha para promover esta escena no es un detalle menor.
 */
function EnlaceABandcamp({ url }: { url: string }) {
  return (
    // Bloque con filete y no una línea de texto suelta. Es la idea que
    // zig-zag.fm resuelve con su "Buy on Discogs": el enlace a donde el
    // artista cobra no es una nota al pie del tracklist, es el otro destino
    // de la ficha. En una plataforma hecha para promover esta escena, mandar
    // a alguien a comprar es parte del producto.
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group mt-7 flex items-center gap-3 rounded-sm border border-border px-4 py-3.5 transition-[transform,background-color] duration-150 hover:bg-surface-hover active:scale-[0.99]"
      style={{ transitionTimingFunction: "var(--ease-salida)" }}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display font-semibold tracking-tight transition-colors group-hover:text-accent">
          El disco completo, en Bandcamp
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          Es donde suena entero y donde le pagan al artista
        </span>
      </span>
      <IconEnlaceExterno className="h-4 w-4 shrink-0 text-muted" />
    </a>
  );
}
