/**
 * El vocabulario de géneros: una semilla en git y todo lo que se haya escrito.
 *
 * **La lista se acuerda de lo nuevo sin que nadie la edite.** Un género que se
 * escribe una vez queda guardado en `canonical_events.generos`, y de ahí sale
 * la sugerencia para el evento siguiente. No hay tabla de géneros ni lista que
 * mantener a mano: el vocabulario *es* lo que ya se usó.
 *
 * La semilla existe solo para arrancar, porque una lista vacía no sugiere
 * nada.
 *
 * ⚠️ **Nada de géneros compuestos.** "Rock/Punk/Metal" salió el 2026-09-08, a
 * pedido de Juan: era el vocabulario de Rockal Live y mete tres géneros en uno,
 * que es justo lo contrario de lo que sirve. Ahora que un evento admite varios,
 * lo específico se pone específico — "Punk" y "Hardcore", no "Rock/Punk/Metal".
 *
 * Sigue siendo sugerencia y no vocabulario cerrado: lo que no esté se escribe
 * igual. La lista existe para que no convivan "rock", "Rock" y "Rock/Punk/
 * Metal", no para decidir qué géneros hay.
 */

import { supabase } from "@/lib/supabase";

export const GENEROS_SEMILLA = [
  "Pop",
  "Hip Hop/Rap",
  "Reggaeton",
  "Salsa",
  "Cumbia",
  "Folclor",
  "Electrónica",
  "Jazz",
  "Blues",
  "Reggae",
  "Indie",
  "Punk",
  "Metal",
  "Hardcore",
  "Post-punk",
  "Shoegaze",
  "Experimental",
  "Champeta",
  "Vallenato",
];

/**
 * Todos los géneros conocidos, ordenados alfabéticamente y sin repetir.
 *
 * Se piden los arreglos enteros y se aplanan acá en vez de pedirle a Postgres
 * un `unnest` distinto: PostgREST no expone funciones de conjunto sin crear
 * una RPC, y para unas decenas de filas la diferencia no se nota.
 */
export async function getGeneros(): Promise<string[]> {
  const { data, error } = await supabase
    .from("canonical_events")
    .select("generos")
    .not("generos", "eq", "{}");

  // Un fallo acá no puede dejar el formulario sin sugerencias: se cae a la
  // semilla, que es peor pero sirve.
  const usados = error
    ? []
    : (data ?? []).flatMap((fila) => (fila.generos ?? []) as string[]);

  return [...new Set([...GENEROS_SEMILLA, ...usados])].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}
