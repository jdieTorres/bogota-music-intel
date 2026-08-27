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
 *
 * Vive aparte de `events.ts` porque es política, no acceso a datos: acá no
 * se abre conexión a Supabase, así que se puede probar sin credenciales y
 * lo usan por igual la cartelera y el mapa.
 *
 * La clasificación la escribe el pipeline de ingesta
 * (`services/api/bogota_music_intel/classify.py`); acá solo se lee.
 */

/**
 * Filtro de PostgREST para dejar fuera lo que no es música.
 *
 * Se pide "es música O todavía no se sabe" en vez de "distinto de
 * not_music" porque en SQL una comparación contra null da null, y eso
 * dejaría fuera justamente los eventos sin clasificar todavía. Ante la duda
 * el evento se muestra: esconderlo no deja ningún rastro visible.
 */
export const SOLO_MUSICA = "event_type.is.null,event_type.eq.music";

/** Lo mínimo que hace falta para ordenar por criterio editorial. */
type ConOrigen = { is_local: boolean | null };

/**
 * Pone adelante los toques locales. Se aplica dentro de un mismo día: entre
 * días manda la fecha, no el criterio editorial.
 *
 * Solo baja al internacional **confirmado**. Un evento cuyo artista no se
 * pudo resolver (`is_local === null`) se queda donde estaba: la mayoría de
 * los artistas locales pequeños no están en MusicBrainz, así que penalizar
 * lo desconocido hundiría justamente los toques que hay que destacar.
 *
 * El orden es estable, así que dentro de cada bloque se respeta la hora.
 */
export function priorizarLocales<T extends ConOrigen>(eventos: T[]): T[] {
  return [...eventos].sort(
    (a, b) => Number(a.is_local === false) - Number(b.is_local === false),
  );
}
