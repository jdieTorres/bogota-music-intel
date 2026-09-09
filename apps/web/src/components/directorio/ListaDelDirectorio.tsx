"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { IconArtista } from "@/components/icons";

/**
 * El directorio, en filas.
 *
 * **Filas con filete, no una cuadrícula de tarjetas.** Es la misma decisión
 * que ya tomó la cartelera: la tarjeta con borde hace que cada entrada lea
 * como un widget suelto, y esto es un catálogo, no un panel.
 *
 * **El género es la navegación**, como en RYM, y no un adorno al final de la
 * fila. Es la única taxonomía que este proyecto tiene curada a mano, así que
 * es la que sirve para recorrer.
 *
 * ⚠️ El filtro es de cliente y no una ruta con `searchParams`, por lo mismo
 * que las pestañas de la cartelera son rutas: cambiar el filtro no puede
 * costar un viaje al servidor cuando la lista entera ya está renderizada.
 */

export type ArtistaEnLista = {
  slug: string;
  nombre: string;
  fotoUrl: string | null;
  origen: string | null;
  generos: string[];
  salas: string[];
  cantidadDeTracks: number;
};

const TODOS = "Todos";

export function ListaDelDirectorio({ artistas }: { artistas: ArtistaEnLista[] }) {
  const generos = [TODOS, ...new Set(artistas.flatMap((a) => a.generos))].sort((a, b) =>
    a === TODOS ? -1 : b === TODOS ? 1 : a.localeCompare(b, "es-CO"),
  );
  const [genero, setGenero] = useState(TODOS);

  const visibles =
    genero === TODOS ? artistas : artistas.filter((a) => a.generos.includes(genero));

  return (
    <>
      {generos.length > 2 && (
        <div className="flex flex-wrap gap-2 pb-6">
          {generos.map((g) => {
            const activo = g === genero;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGenero(g)}
                aria-pressed={activo}
                className={
                  "rounded-full px-3 py-1 text-sm transition-[transform,background-color,color] duration-150 active:scale-[0.97] " +
                  (activo
                    ? "bg-accent text-background"
                    : "border border-border text-muted hover:text-foreground")
                }
                style={{ transitionTimingFunction: "var(--ease-salida)" }}
              >
                {g}
              </button>
            );
          })}
        </div>
      )}

      <ul>
        {visibles.map((artista) => (
          <li key={artista.slug} className="border-t border-border">
            <Link
              href={`/artista/${artista.slug}`}
              className="group -mx-3 flex items-start gap-4 rounded-sm px-3 py-4 transition-colors hover:bg-surface-hover"
            >
              {/* La miniatura, como en cualquier catálogo de música: la cara
                  del artista dice más de un vistazo que su nombre escrito, y
                  una lista de puro texto se lee como una tabla de base de
                  datos. Sin foto va el ícono, que no afirma nada. */}
              <span className="relative h-14 w-14 shrink-0 self-start overflow-hidden rounded-sm bg-surface sm:h-16 sm:w-16">
                {artista.fotoUrl ? (
                  <Image
                    src={artista.fotoUrl}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <IconArtista className="h-7 w-7 opacity-70" />
                  </span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold leading-tight tracking-tight transition-colors group-hover:text-accent sm:text-xl">
                  {artista.nombre}
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted">
                  {/* El origen es un hecho y solo aparece si consta. No decir
                      de dónde es alguien es más honesto que suponer Bogotá. */}
                  {artista.origen}
                  {artista.generos.map((g) => (
                    <span key={g}>
                      {artista.origen ? " · " : ""}
                      <span className="text-accent-2">{g}</span>
                    </span>
                  ))}
                </span>
                {artista.salas.length > 0 && (
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {artista.salas.join(" · ")}
                  </span>
                )}
              </span>

              {/* Cuántos tracks tiene cargados. Es el dato que dice si vale la
                  pena entrar, y en cero no se escribe "0 tracks": el hueco ya
                  lo dice sin llamar la atención sobre lo que falta. */}
              {artista.cantidadDeTracks > 0 && (
                <span className="shrink-0 self-center font-mono text-xs text-muted">
                  {artista.cantidadDeTracks}
                  {artista.cantidadDeTracks === 1 ? " track" : " tracks"}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {visibles.length === 0 && (
        <p className="border-t border-border py-8 text-sm text-muted">
          Nadie del directorio toca {genero} todavía.
        </p>
      )}
    </>
  );
}
