/**
 * Quién tocó, con nombre y enlace a su ficha.
 *
 * Sale **solo del cartel confirmado a mano** (`event_artists`), nunca de los
 * nombres que leyó la fuente. Esa es la diferencia que el sitio tiene que
 * dejar ver: el encabezado dice lo que decía el anuncio, y este bloque dice
 * quiénes de esos están en el directorio porque alguien los verificó.
 *
 * ⚠️ **Solo sale en fiestas y festivales** (2026-09-15, pedido de Juan). En un
 * toque el título ya dice quién toca, así que repetir los mismos nombres
 * debajo era decir dos veces lo mismo: ahí el enlace va **en el propio
 * nombre**, dentro del titular (`TituloDeEvento`). En una fiesta o un festival
 * el título es el nombre del ciclo y no contiene a nadie, así que este bloque
 * es la única forma de nombrar a quienes tocan.
 *
 * ⚠️ **Y el rótulo no es un detalle de redacción.** Rock al Parque tiene
 * decenas de artistas y nadie va a vincularlos todos; llamar "En el cartel" a
 * cinco fichas afirmaría por omisión que el lineup son esos cinco. "De la
 * escena tocan" dice lo que de verdad es —una selección editorial, que es
 * justo lo que esta plataforma puede aportar y el sitio del festival no— y el
 * pie remite al cartel completo.
 */

import Link from "next/link";

import type { EnElCartelPublico } from "@/lib/artists";
import type { TipoEvento } from "@/lib/events";

export function CartelDelToque({
  cartel,
  tipo,
  masInfo,
}: {
  cartel: EnElCartelPublico[];
  tipo: TipoEvento;
  /** El anuncio original, para remitir al cartel completo de un festival. */
  masInfo: string | null;
}) {
  // En un toque los nombres ya van enlazados dentro del título.
  const sinCartelPropio = tipo === "fiesta" || tipo === "festival";
  if (cartel.length === 0 || !sinCartelPropio) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
        De la escena tocan
      </h2>

      <ul className="mt-3 flex flex-wrap gap-2">
        {cartel.map((artista) => (
          <li key={artista.slug}>
            <Link
              href={`/artista/${artista.slug}`}
              className="inline-block rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
            >
              {artista.nombre}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-muted">
        No es el cartel completo: son los artistas de la escena que seguimos.
        {masInfo && (
          <>
            {" "}
            <a
              href={masInfo}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-border underline-offset-4 transition-colors hover:text-accent"
            >
              El cartel completo, en el anuncio ↗
            </a>
          </>
        )}
      </p>
    </section>
  );
}
