/**
 * Quién tocó, con nombre y enlace a su ficha.
 *
 * Sale **solo del cartel confirmado a mano** (`event_artists`), nunca de los
 * nombres que leyó la fuente. Esa es la diferencia que el sitio tiene que
 * dejar ver: el encabezado dice lo que decía el anuncio, y este bloque dice
 * quiénes de esos están en el directorio porque alguien los verificó.
 *
 * Por eso no aparece cuando no hay cartel armado, en vez de repetir los
 * nombres del título sin enlace: un bloque titulado "En el cartel" que
 * repitiera el encabezado no agregaría nada y haría creer que esos nombres
 * fueron verificados.
 *
 * ⚠️ **En un festival el rótulo es otro, y no es un detalle de redacción.**
 * Rock al Parque tiene decenas de artistas y nadie va a vincularlos todos;
 * llamar "En el cartel" a cinco fichas afirmaría por omisión que el lineup
 * son esos cinco. "De la escena tocan" dice lo que de verdad es —una
 * selección editorial, que es justo lo que esta plataforma puede aportar y el
 * sitio del festival no— y el pie remite al cartel completo.
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
  if (cartel.length === 0) return null;

  const esFestival = tipo === "festival";

  return (
    <section className="mt-8">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
        {esFestival ? "De la escena tocan" : "En el cartel"}
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

      {esFestival && (
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
                El cartel completo, en el anuncio del festival ↗
              </a>
            </>
          )}
        </p>
      )}
    </section>
  );
}
