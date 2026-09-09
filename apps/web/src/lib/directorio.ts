/**
 * El criterio del directorio: a quién más vale la pena oír.
 *
 * Vive aparte de `artists.ts` por el mismo motivo que `editorial.ts` vive
 * aparte de `events.ts`: acá no se abre conexión a Supabase, así que se
 * prueba sin credenciales. Es criterio, no acceso a datos.
 *
 * **Esto no es un motor de similitud sonora, y no puede serlo.** Esa idea ya
 * se descartó con evidencia: no hay fuente legal del audio de esta escena, y
 * ninguna API conoce al artista local emergente. Lo que sí hay son tres
 * señales que salen de la cartelera que ya está en la base, y que ninguna
 * plataforma global podría tener porque son de esta ciudad.
 *
 * ⚠️ **Cada recomendación llega con su razón, y eso no es adorno.** "Porque
 * te gusta X" afirmaría algo que nadie midió: no sabemos qué le gusta a
 * nadie. "Compartieron cartel el 12 de oct" es un hecho comprobable, y si la
 * razón no se puede escribir, la fila no va.
 */

import { fechaCorta } from "@/lib/fechas";

export type SenalDeArtista = {
  slug: string;
  nombre: string;
  /** Los eventos en los que estuvo en cartel. */
  carteles: { eventoId: string; startsAt: string | null }[];
  /** Las salas donde ha tocado, por nombre. */
  salas: string[];
  generos: string[];
};

export type Recomendacion = {
  slug: string;
  nombre: string;
  /** Por qué aparece. Se muestra en pantalla, siempre. */
  razon: string;
};

/**
 * El orden de las señales, de la más específica a la más gruesa.
 *
 * El cartel va primero porque describe una noche concreta: dos bandas que
 * tocaron juntas comparten público de verdad. La sala va después, que es la
 * misma idea con menos precisión. El género va último y con razón: con siete
 * valores en uso, "Rock" mete a media escena en la misma bolsa.
 */
const CARTEL = 0;
const SALA = 1;
const GENERO = 2;

export function recomendar(
  base: SenalDeArtista,
  otros: SenalDeArtista[],
  tope = 6,
): Recomendacion[] {
  const eventosBase = new Set(base.carteles.map((c) => c.eventoId));
  const salasBase = new Set(base.salas);
  const generosBase = new Set(base.generos);

  const encontradas: { peso: number; recomendacion: Recomendacion }[] = [];

  for (const otro of otros) {
    if (otro.slug === base.slug) continue;

    const juntos = otro.carteles.find((c) => eventosBase.has(c.eventoId));
    if (juntos) {
      // Sin fecha publicada no se inventa una: se dice el hecho a secas.
      const cuando = juntos.startsAt ? ` el ${fechaCorta(juntos.startsAt)}` : "";
      encontradas.push({
        peso: CARTEL,
        recomendacion: {
          slug: otro.slug,
          nombre: otro.nombre,
          razon: `Compartieron cartel${cuando}`,
        },
      });
      continue;
    }

    const salaEnComun = otro.salas.find((sala) => salasBase.has(sala));
    if (salaEnComun) {
      encontradas.push({
        peso: SALA,
        recomendacion: {
          slug: otro.slug,
          nombre: otro.nombre,
          razon: `También ha tocado en ${salaEnComun}`,
        },
      });
      continue;
    }

    const generoEnComun = otro.generos.find((genero) => generosBase.has(genero));
    if (generoEnComun) {
      encontradas.push({
        peso: GENERO,
        recomendacion: {
          slug: otro.slug,
          nombre: otro.nombre,
          razon: `Comparten ${generoEnComun}`,
        },
      });
    }
  }

  // Por peso y, dentro del mismo peso, alfabético. El orden tiene que ser
  // estable: una lista que se baraja sola en cada carga hace dudar de si el
  // dato cambió.
  encontradas.sort(
    (a, b) =>
      a.peso - b.peso || a.recomendacion.nombre.localeCompare(b.recomendacion.nombre, "es-CO"),
  );

  // Sin señales devuelve vacío. Rellenar con artistas al azar diría "estos se
  // parecen" sobre algo que nadie comprobó.
  return encontradas.slice(0, tope).map((e) => e.recomendacion);
}
