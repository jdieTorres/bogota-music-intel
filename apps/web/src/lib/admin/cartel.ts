/**
 * El criterio del campo que arma el cartel de un toque.
 *
 * Vive aparte de `artistas.ts` por el mismo motivo que `directorio.ts` vive
 * aparte de `artists.ts`: acá no se abre conexión a Supabase, así que se
 * prueba sin credenciales. Es criterio, no acceso a datos.
 */

export type ArtistaVinculable = {
  id: string;
  nombre: string;
  slug: string;
  status: "borrador" | "publicado";
};

const CUANTAS = 5;

/** Sin tildes y en minúsculas, que es como se escribe en un campo de
 *  búsqueda aunque el nombre lleve tilde. */
const plano = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * A quién ofrecer para el cartel, según lo que se lleva escrito.
 *
 * - **Con el campo vacío no propone nada.** Una lista de todo el directorio
 *   al enfocar no ayuda a elegir, y crece hasta volverse inmanejable.
 * - **Busca en cualquier parte del nombre**, no solo al principio: uno teclea
 *   la palabra que recuerda, que casi nunca es la primera.
 * - ⚠️ **Incluye los borradores.** Un artista creado desde otro toque nace en
 *   borrador; si no apareciera acá, el siguiente toque crearía un duplicado y
 *   chocaría contra el slug repetido.
 * - **No ofrece a quien ya está en este cartel**, porque vincularlo dos veces
 *   rompe contra la llave primaria.
 */
export function sugerencias(
  artistas: ArtistaVinculable[],
  texto: string,
  yaEnElCartel: string[],
): ArtistaVinculable[] {
  const buscado = plano(texto.trim());
  if (!buscado) return [];

  const puestos = new Set(yaEnElCartel);
  return artistas
    .filter((a) => !puestos.has(a.id) && plano(a.nombre).includes(buscado))
    .slice(0, CUANTAS);
}
