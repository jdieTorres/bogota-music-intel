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

/** Conciertos: un artista de cartel, más lo que aún no se clasificó. */
export const SOLO_CONCIERTOS = "event_type.is.null,event_type.eq.music";

/** Fiestas y ciclos: la sala programándose a sí misma. */
export const SOLO_FIESTAS = "event_type.eq.fiesta";

/**
 * Todo lo que es escena, sin separar. Lo usa el mapa: una sala con fiesta
 * está tan activa como una con concierto, y separarlas ahí no ayudaría a
 * nadie a saber dónde hay música esta noche.
 */
export const EN_CARTELERA =
  "event_type.is.null,event_type.eq.music,event_type.eq.fiesta";

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

/**
 * Categorías que no vale la pena mostrar como chip, porque no dicen nada
 * que el lector no vea ya.
 *
 * El chip existe para el género —"Pop", "Rock/Punk/Metal", "Hip Hop/Rap"—.
 * Pero `category` cumple dos papeles: además alimenta al clasificador, y
 * desde que visitbogota escribe ahí su taxonomía (2026-09-01) puede traer
 * "Conciertos", que en la pestaña de conciertos es puro ruido.
 *
 * Se filtra al mostrar y no al guardar: el clasificador necesita el valor.
 */
const CATEGORIAS_SIN_VALOR_VISIBLE = new Set([
  "conciertos",
  "concierto",
  "musica",
  "música",
  "otros",
  "otro",
  "cultura",
]);

/** El género a mostrar, o null si la categoría no aporta nada. */
export function generoVisible(category: string | null): string | null {
  if (!category) return null;
  return CATEGORIAS_SIN_VALOR_VISIBLE.has(category.trim().toLowerCase())
    ? null
    : category;
}
