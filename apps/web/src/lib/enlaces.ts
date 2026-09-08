/**
 * Sacar el enlace que sirve de un campo escrito a mano.
 *
 * `evidence` es texto libre: a veces es una URL pelada, a veces una frase con
 * la URL adentro ("lo publicó la sala en su historia: https://…"), y a veces
 * no tiene ninguna ("me lo confirmó el bajista").
 *
 * ⚠️ **Por eso se extrae en vez de mostrarse entero.** Hasta el 2026-09-08 la
 * ficha imprimía el campo completo al pie, así que una nota interna quedaba
 * a la vista de cualquiera. Sacar solo el enlace muestra menos, no más: si no
 * hay URL, no sale nada.
 */
export function primerEnlace(texto: string | null): string | null {
  if (!texto) return null;
  const encontrado = texto.match(/https?:\/\/[^\s<>"']+/i);
  if (!encontrado) return null;
  // Un enlace pegado dentro de una frase suele arrastrar la puntuación final.
  return encontrado[0].replace(/[.,;:)\]]+$/, "");
}
