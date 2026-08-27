import type { Evento } from "@/lib/events";
import { tieneHoraPublicada } from "@/lib/fechas";

/**
 * Un mismo concierto llega por dos fuentes cuando el promotor y la sala
 * publican su propia cartelera: MADE4RAP aparece como "MADE4RAP" en el sitio
 * de Royal Center y como "MADE4RAP BOGOTÁ" en la página de Rockal Live.
 * Sin unificar, el calendario muestra el show dos veces.
 *
 * Nota: esto vive en el frontend mientras el calendario sea el único
 * consumidor. Cuando exista la API pública conviene moverlo a la ingesta,
 * para que todos los clientes vean la misma cartelera ya canonizada.
 */

const RELLENO = new Set([
  "en", "de", "del", "la", "el", "los", "las", "y", "a",
  "bogota", "colombia", "tour", "vivo", "concierto", "show", "presenta",
]);

const DIACRITICOS = /[̀-ͯ]/g;

function tokens(titulo: string): Set<string> {
  const normalizado = titulo
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");

  const palabras = normalizado
    .split(/\s+/)
    .filter((palabra) => palabra.length > 0 && !RELLENO.has(palabra));

  // Si el título era puro relleno ("En vivo"), se cae al texto normalizado
  // completo antes que devolver un conjunto vacío que empareja con todo.
  return palabras.length > 0
    ? new Set(palabras)
    : new Set(normalizado.split(/\s+/).filter(Boolean));
}

/** Lo mínimo que hace falta para decidir si dos filas son el mismo show. */
type ConTituloYFecha = { title: string; starts_at: string | null };

function tituloEquivalente(a: ConTituloYFecha, b: ConTituloYFecha): boolean {
  const ta = tokens(a.title);
  const tb = tokens(b.title);
  if (ta.size === 0 || tb.size === 0) return false;

  const comunes = [...ta].filter((palabra) => tb.has(palabra));
  if (comunes.length === 0) return false;

  // Uno contenido en el otro ("AKRIILA" dentro de "AKRIILA TOUR LUCY"),
  // o mayoría de palabras compartidas. Exigir esto evita fusionar dos
  // shows distintos de la misma sala el mismo día ("Noche de Salsa" y
  // "Noche Electrónica" comparten solo "noche": no se fusionan).
  const contenido = comunes.length === ta.size || comunes.length === tb.size;
  const jaccard = comunes.length / new Set([...ta, ...tb]).size;
  return contenido || jaccard >= 0.5;
}

/** Cuenta qué tan completo es un registro, para quedarse con el mejor. */
function riqueza(evento: Evento): number {
  return [
    evento.price_text,
    evento.category,
    evento.description,
    evento.image_url,
    tieneHoraPublicada(evento.starts_at) ? "hora" : null,
  ].filter(Boolean).length;
}

function claveDeDia(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function mismoDia(a: ConTituloYFecha, b: ConTituloYFecha): boolean {
  if (!a.starts_at || !b.starts_at) return false;
  return claveDeDia(a.starts_at) === claveDeDia(b.starts_at);
}

/** Agrupa por el criterio dado y se queda con un representante por grupo,
 *  conservando el orden de entrada. */
function unificar<T>(
  items: T[],
  mismoGrupo: (referencia: T, candidato: T) => boolean,
  puntaje: (item: T) => number,
): T[] {
  const grupos: T[][] = [];
  for (const item of items) {
    const grupo = grupos.find((candidatos) => mismoGrupo(candidatos[0], item));
    if (grupo) grupo.push(item);
    else grupos.push([item]);
  }
  return grupos.map((grupo) =>
    grupo.reduce((mejor, actual) =>
      puntaje(actual) > puntaje(mejor) ? actual : mejor,
    ),
  );
}

/**
 * Une los eventos que son el mismo show visto por dos fuentes: misma sala,
 * mismo día y títulos equivalentes. De cada grupo se conserva el registro
 * más completo. Respeta el orden de entrada.
 */
export function unificarDuplicados(eventos: Evento[]): Evento[] {
  return unificar(
    eventos,
    (referencia, evento) =>
      referencia.venue_name_raw.toLowerCase() ===
        evento.venue_name_raw.toLowerCase() &&
      mismoDia(referencia, evento) &&
      tituloEquivalente(referencia, evento),
    riqueza,
  );
}

/**
 * Misma unificación para una lista que ya se sabe de una sola sala (los
 * eventos de un pin del mapa). Sin datos de precio o género para comparar,
 * se prefiere el registro que sí trae hora real sobre el que quedó a
 * medianoche por no haberla publicado.
 */
export function unificarEnUnaSala<T extends ConTituloYFecha>(eventos: T[]): T[] {
  return unificar(
    eventos,
    (referencia, evento) =>
      mismoDia(referencia, evento) && tituloEquivalente(referencia, evento),
    (evento) => (tieneHoraPublicada(evento.starts_at) ? 1 : 0),
  );
}
