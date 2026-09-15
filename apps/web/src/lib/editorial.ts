/**
 * El criterio editorial de la cartelera, en un solo lugar.
 *
 * La plataforma promueve los toques de artistas locales. Eso son dos
 * decisiones distintas, tomadas con Juan el 2026-08-27:
 *
 * 1. Lo que no es música en vivo (comedia, lucha libre, teatro) no entra.
 * 2. Los artistas internacionales sí entran, pero en segundo plano: un show
 *    de Robbie Williams en el Movistar es parte de la escena en vivo de
 *    Bogotá aunque no sea un toque local.
 * 3. Las fiestas y ciclos de sala van en su propia pestaña. No compiten con
 *    los conciertos por el mismo lugar en la lista, porque ordenar una
 *    noche de club junto a un show del Movistar no compara nada.
 * 4. Los festivales van en la suya (2026-09-01). Comparten con la fiesta
 *    que no hay un artista de cartel, pero no se mezclan con ella: una
 *    noche de club y tres días en el Simón Bolívar tampoco se comparan.
 *
 * Vive aparte de `events.ts` porque es política, no acceso a datos: acá no
 * se abre conexión a Supabase, así que se puede probar sin credenciales y
 * lo usan por igual la cartelera y el mapa.
 *
 * La clasificación la escribe el pipeline de ingesta
 * (`services/api/bogota_music_intel/classify.py`); acá solo se lee.
 */

/**
 * Los tres filtros de PostgREST, que son tres preguntas distintas.
 *
 * Todos se escriben en positivo ("es esto O es aquello") y no como una
 * negación: en SQL una comparación contra null da null, así que pedir
 * "distinto de not_music" dejaría fuera justamente los eventos que todavía
 * no se clasificaron. Ante la duda el evento se muestra — esconderlo no
 * deja ningún rastro visible para nadie.
 */

// `import type` y no un import normal: `events.ts` importa de este
// archivo, y un import de valor cerraría el ciclo. El tipo se borra al
// compilar, así que en tiempo de ejecución no hay dependencia.
import type { TipoEvento } from "@/lib/events";

/** Conciertos: un artista de cartel, más lo que aún no se clasificó. */
export const SOLO_CONCIERTOS = "event_type.is.null,event_type.eq.music";

/** Fiestas y ciclos: la sala programándose a sí misma. */
export const SOLO_FIESTAS = "event_type.eq.fiesta";

/** Festivales: varios días, varios artistas, ninguno de cartel. */
export const SOLO_FESTIVALES = "event_type.eq.festival";

/**
 * Todo lo que es escena, sin separar. Lo usa el mapa: una sala con fiesta o
 * con festival está tan activa como una con concierto, y separarlas ahí no
 * ayudaría a nadie a saber dónde hay música esta noche.
 */
export const EN_CARTELERA =
  "event_type.is.null,event_type.eq.music,event_type.eq.fiesta,event_type.eq.festival";

/** Lo mínimo que hace falta para ordenar por criterio editorial. */
type ConOrigen = { is_local: boolean | null };

/**
 * Pone adelante los toques locales. Se aplica dentro de un mismo día: entre
 * días manda la fecha, no el criterio editorial.
 *
 * Solo baja al **confirmado como no local**. Un evento sin marcar
 * (`is_local === null`) se queda donde estaba, y desde el 2026-09-08 eso es
 * el caso por defecto: el campo lo escribe una persona en /admin y nada lo
 * calcula. Penalizar lo no marcado hundiría todo lo que Juan todavía no ha
 * mirado — justamente los toques nuevos que hay que destacar.
 *
 * El orden es estable, así que dentro de cada bloque se respeta la hora.
 */
export function priorizarLocales<T extends ConOrigen>(eventos: T[]): T[] {
  return [...eventos].sort(
    (a, b) => Number(a.is_local === false) - Number(b.is_local === false),
  );
}

/**
 * De qué pestaña salió un evento, para poder devolver al lector a ella.
 *
 * El enlace de volver de la ficha mandaba siempre a `/`, así que a quien
 * llegaba desde `/fiestas` o `/festivales` lo dejaba en otra lista. Sale del
 * tipo del evento y no del historial del navegador a propósito: la ficha es
 * lo que se pega en un grupo de WhatsApp, y quien llega por ahí no tiene
 * historial del cual volver — pero sí merece saber dónde vive ese evento.
 */
export function pestanaDelEvento(tipo: TipoEvento): {
  href: string;
  etiqueta: string;
} {
  if (tipo === "fiesta") return { href: "/fiestas", etiqueta: "las fiestas" };
  if (tipo === "festival") {
    return { href: "/festivales", etiqueta: "los festivales" };
  }
  // `music` y `null` comparten destino: un evento sin clasificar se muestra
  // en la cartelera de toques, así que ahí es donde el lector lo vio.
  return { href: "/", etiqueta: "la cartelera" };
}
