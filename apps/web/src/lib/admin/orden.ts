/**
 * Mover un elemento de sitio dentro de una lista.
 *
 * Vive aparte del componente por el mismo motivo que el resto del criterio de
 * `/admin`: acá no se importa React ni Supabase, así que se prueba sin montar
 * nada. Lo usan los chips de artistas y de géneros para reordenarse
 * arrastrando o con el teclado.
 *
 * **Devuelve una lista nueva y nunca muta la que recibe**, que es lo que
 * espera React para volver a pintar.
 */
export function moverEn<T>(lista: readonly T[], desde: number, hasta: number): T[] {
  const copia = [...lista];
  // Un índice fuera de rango devuelve la lista igual en vez de romper: los dos
  // llamadores son eventos del navegador —un `drop` sobre el borde, una flecha
  // en el último chip— y ahí es más sano no hacer nada que lanzar.
  if (
    desde < 0 ||
    hasta < 0 ||
    desde >= copia.length ||
    hasta >= copia.length ||
    desde === hasta
  ) {
    return copia;
  }

  const [elemento] = copia.splice(desde, 1);
  copia.splice(hasta, 0, elemento);
  return copia;
}
