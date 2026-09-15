/**
 * Cómo se escribe el encabezado de un toque de varias bandas.
 *
 * Vive aparte de `events.ts` por el mismo motivo que `editorial.ts`: acá no
 * se abre conexión a Supabase, así que se prueba sin credenciales. Es
 * criterio, no acceso a datos.
 *
 * **El problema que resuelve.** Hasta el 2026-09-15 un cartel de varias
 * bandas se publicaba como una frase: "Mukangu & Atake Mapalé & Los Yoryis".
 * Con tres nombres ya se lee mal y con cinco es ilegible, pero lo que de
 * verdad costaba es que **una frase no enlaza con nada**: el directorio no
 * puede saber que ahí hay tres artistas. Ahora la lista llega aparte y el
 * encabezado se compone de ella.
 *
 * ⚠️ **Plana, sin destacar a nadie.** El orden lo puso la sala al escribir los
 * nombres, o el modelo al leer el afiche — nadie verificó que el primero
 * encabece. Un cartel underground de cuatro bandas pares es normal, y pintar
 * al primero más grande afirmaría una jerarquía que nadie midió. La jerarquía
 * se gana cuando alguien arma el cartel a mano en `event_artists`, que sí
 * tiene un orden con dueño.
 */

import type { Evento } from "@/lib/events";

/**
 * Cuántos nombres caben en una fila de la cartelera antes de cortar.
 *
 * Tres y no dos: con dos, "Mukangu · Atake Mapalé +1" corta justo donde el
 * cartel se pone interesante. Y no más de tres porque la fila tiene una
 * altura fija y el cuarto nombre empuja la hora fuera de su sitio.
 */
export const EN_LA_CARTELERA = 3;

export type Encabezado = {
  /** Los nombres que se muestran, ya cortados. */
  artistas: string[];
  /** Cuántos quedaron fuera del corte. 0 si caben todos. */
  ocultos: number;
  gira: string | null;
};

/**
 * Las piezas del encabezado, o `null` si hay que mostrar `evento.title` tal
 * cual.
 *
 * Se devuelve `null` con cero o un artista, y no un encabezado de un nombre.
 * Con un solo artista el título ya dice exactamente eso, y componerlo de
 * nuevo desde la lista solo abre la posibilidad de que el título editado a
 * mano y la lista digan cosas distintas. Lo mismo vale para fiestas y
 * festivales, cuya lista está vacía a propósito: su título es el nombre del
 * ciclo, no un cartel.
 */
export function encabezado(
  evento: Pick<Evento, "title" | "artistas" | "gira">,
  tope = Number.POSITIVE_INFINITY,
): Encabezado | null {
  const artistas = evento.artistas ?? [];
  if (artistas.length < 2) return null;

  return {
    artistas: artistas.slice(0, tope),
    ocultos: Math.max(0, artistas.length - tope),
    gira: evento.gira,
  };
}

/**
 * El mismo encabezado en una sola línea de texto plano.
 *
 * Lo usa la tarjeta de compartir, que va dentro de una etiqueta `meta` y la
 * pinta el chat de quien la recibe. Sale de acá y no de `title` para que lo
 * que se ve en WhatsApp sea lo mismo que se ve en la página; si se leyera el
 * título, un cartel de varias bandas llegaría con el "&" encadenado que la
 * web ya no muestra.
 */
export function encabezadoEnTexto(
  evento: Pick<Evento, "title" | "artistas" | "gira">,
): string {
  const piezas = encabezado(evento);
  if (!piezas) return evento.title;

  const cartel = piezas.artistas.join(" · ");
  return piezas.gira ? `${cartel} | ${piezas.gira}` : cartel;
}
