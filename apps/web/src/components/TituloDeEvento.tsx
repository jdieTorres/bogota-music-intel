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
 * ⚠️ **Acá no se enlaza a nadie**, aunque sea el nombre de un artista que
 * tiene ficha. Estos nombres son lo que decía el anuncio, y coincidir de
 * nombre no prueba que sean el mismo artista. Quien enlaza es `CartelDelToque`,
 * que pinta el cartel confirmado a mano — y así el caso de un solo artista
 * también tiene por dónde llegar al directorio, que enlazando el título se
 * quedaba sin salida.
 */

import { encabezado } from "@/lib/encabezado";
import type { Evento } from "@/lib/events";

export function TituloDeEvento({
  evento,
  tope,
}: {
  evento: Pick<Evento, "title" | "artistas" | "gira">;
  tope?: number;
}) {
  const piezas = encabezado(evento, tope);
  if (!piezas) return <>{evento.title}</>;

  return (
    <>
      {piezas.artistas.map((artista, i) => (
        <span key={artista}>
          {i > 0 && <span className="text-muted"> · </span>}
          {artista}
        </span>
      ))}
      {piezas.ocultos > 0 && <span className="text-muted"> +{piezas.ocultos}</span>}
      {piezas.gira && <span className="text-muted"> | {piezas.gira}</span>}
    </>
  );
}
