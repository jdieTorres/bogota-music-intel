/**
 * El nombre del toque, tipografiado.
 *
 * Con un solo artista es el título y ya. Con varios es **una lista**, no una
 * frase: "Mukangu · Atake Mapalé · Los Yoryis" en vez del "&" encadenado que
 * se publicaba hasta el 2026-09-15 y que con cinco bandas era ilegible.
 *
 * El punto medio es el mismo separador que ya usa el renglón de la sala y el
 * género, así que no mete un símbolo nuevo al sitio, y va en `muted` para que
 * lo que se lea sean los nombres y no los puntos.
 *
 * **El nombre que tiene ficha en el directorio es el enlace** (2026-09-15,
 * pedido de Juan). Antes iba en un bloque "En el cartel" debajo del título, y
 * eso decía dos veces lo mismo: en un toque el título ya dice quién toca. El
 * bloque se quedó para fiestas y festivales, donde el nombre del ciclo no
 * contiene a nadie.
 *
 * ⚠️ **Enlaza solo el cartel confirmado**, nunca por coincidencia con los
 * nombres que leyó la fuente: que un texto coincida no prueba que sea el mismo
 * artista. `fichas` llega de `event_artists`, que lo confirmó una persona.
 */

import Link from "next/link";

import { IconEnlaceExterno } from "@/components/icons";
import {
  type FichaDeArtista,
  encabezado,
  escalaDeArtista,
  trozosConEnlaces,
} from "@/lib/encabezado";
import type { Evento } from "@/lib/events";

/** El verde de la marca, que en el resto del sitio se gasta justamente en el
 *  enlace, y subrayado para que se lea como uno dentro de un titular donde
 *  todo pesa igual. */
const ENLACE =
  "text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent";

function ConEnlaces({ texto, fichas }: { texto: string; fichas: FichaDeArtista[] }) {
  return (
    <>
      {trozosConEnlaces(texto, fichas).map((trozo, i) =>
        trozo.slug ? (
          // Abre en otra pestaña, pedido de Juan: quien está mirando un toque
          // no pierde la ficha al ir a ver quién toca.
          <Link
            key={i}
            href={`/artista/${trozo.slug}`}
            target="_blank"
            rel="noreferrer"
            className={ENLACE}
          >
            {trozo.texto}
            {/* Escala con la tipografía —`em` y no `px`— porque el mismo
                componente se pinta a 5xl en la ficha y a 1rem en cualquier
                otro sitio. `align-top` lo sube al hombro de la mayúscula en
                vez de dejarlo en la línea base. */}
            <IconEnlaceExterno className="ml-1 inline-block h-[0.42em] w-[0.42em] align-top" />
            {/* El ícono es un dibujo y no dice nada a quien no lo ve. */}
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </Link>
        ) : (
          <span key={i}>{trozo.texto}</span>
        ),
      )}
    </>
  );
}

export function TituloDeEvento({
  evento,
  tope,
  fichas = [],
}: {
  evento: Pick<Evento, "title" | "artistas" | "gira">;
  tope?: number;
  /** El cartel confirmado. Vacío en la cartelera: la fila entera ya es un
   *  enlace al evento y uno dentro de otro no se puede hacer. */
  fichas?: FichaDeArtista[];
}) {
  const piezas = encabezado(evento, tope);
  if (!piezas) return <ConEnlaces texto={evento.title} fichas={fichas} />;

  return (
    <>
      {piezas.artistas.map((artista, i) => (
        // El tamaño baja del tercero en adelante (`escalaDeArtista`). Va en
        // `em` y no en píxeles porque el mismo componente se pinta a 5xl en la
        // ficha y a tamaño de fila en la cartelera: el escalón tiene que ser
        // proporcional, no absoluto.
        <span key={artista} style={{ fontSize: `${escalaDeArtista(i)}em` }}>
          {i > 0 && <span className="text-muted"> · </span>}
          <ConEnlaces texto={artista} fichas={fichas} />
        </span>
      ))}
      {piezas.ocultos > 0 && <span className="text-muted"> +{piezas.ocultos}</span>}
      {piezas.gira && <span className="text-muted"> | {piezas.gira}</span>}
    </>
  );
}
