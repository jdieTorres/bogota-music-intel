import type { Evento } from "@/lib/events";

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

function esMismoEvento(a: Evento, b: Evento): boolean {
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
  const conHora =
    evento.starts_at !== null && !evento.starts_at.includes("T00:00:00");
  return [
    evento.price_text,
    evento.category,
    evento.description,
    evento.image_url,
    conHora ? "hora" : null,
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

/**
 * Une los eventos que son el mismo show visto por dos fuentes: misma sala,
 * mismo día y títulos equivalentes. De cada grupo se conserva el registro
 * más completo. Respeta el orden de entrada.
 */
export function unificarDuplicados(eventos: Evento[]): Evento[] {
  const grupos: Evento[][] = [];

  for (const evento of eventos) {
    const grupo = grupos.find((candidatos) => {
      const referencia = candidatos[0];
      if (
        referencia.venue_name_raw.toLowerCase() !==
        evento.venue_name_raw.toLowerCase()
      ) {
        return false;
      }
      if (!referencia.starts_at || !evento.starts_at) return false;
      if (claveDeDia(referencia.starts_at) !== claveDeDia(evento.starts_at)) {
        return false;
      }
      return esMismoEvento(referencia, evento);
    });

    if (grupo) grupo.push(evento);
    else grupos.push([evento]);
  }

  return grupos.map((grupo) =>
    grupo.reduce((mejor, actual) =>
      riqueza(actual) > riqueza(mejor) ? actual : mejor,
    ),
  );
}
