/**
 * El slug con que la ingesta identifica una sala.
 *
 * Vive aparte de `salas.ts` por el mismo motivo que `editorial.ts` vive
 * aparte de `events.ts`: acá no se abre conexión a Supabase, así que se
 * puede probar sin credenciales. Es lógica, no acceso a datos.
 */

/**
 * El slug con que la ingesta identifica una sala.
 *
 * **Tiene que dar exactamente lo mismo que `python-slugify`**, que es lo que
 * usa `upsert_venues`. Si difiere aunque sea en un carácter, el día que un
 * scraper encuentre esta misma sala la crearía otra vez como fila nueva, con
 * sus eventos colgando de la copia.
 *
 * No es una esperanza: `salas.test.ts` compara contra una tabla de salidas
 * reales de `python-slugify`, incluidos los casos que rompen lo obvio —
 * "Ñoño's Pub" da `nono-s-pub` y no `nonos-pub`, porque el apóstrofo
 * también separa.
 */
export function slugDeSala(nombre: string): string {
  return nombre
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
