/**
 * Cómo se escribe el precio de un toque.
 *
 * En **lucas**, que es como se habla de plata acá: 240.000 se dice "240 lks".
 * La base guarda pesos enteros y la conversión es de presentación — guardar
 * 240 obligaría a decidir en la ingesta cuántos decimales sobreviven, que es
 * una decisión de cómo se ve y no de qué se sabe.
 *
 * Los montos no son redondos (Latino Power vende a 33.900), así que el decimal
 * se conserva: redondear 33.900 a "34 lks" muestra un número que nadie va a
 * pagar. Los redondos salen limpios, sin ",0" colgando.
 */

/** Las cinco formas que puede tomar un precio. Ver `precios.py` en el backend. */
export type ClasePrecio = "gratis" | "unico" | "rango" | "desde" | "con_costo";

export type PrecioEvento = {
  /** `null` = no sabemos si cuesta. NO es lo mismo que `con_costo`. */
  price_kind: ClasePrecio | null;
  price_min: number | null;
  price_max: number | null;
};

/** Cuántos decimales de luca se muestran antes de que el número estorbe. */
const DECIMALES = 2;

/**
 * Un monto en pesos, escrito en lucas y sin el signo.
 *
 * 120000 → "120" · 33900 → "33,9" · 28250 → "28,25"
 */
export function enLucas(pesos: number): string {
  const lucas = pesos / 1000;
  // `toLocaleString` con `maximumFractionDigits` ya suelta los ceros de más,
  // así que "120,0" no llega a existir. La coma decimal la pone el locale.
  return lucas.toLocaleString("es-CO", { maximumFractionDigits: DECIMALES });
}

/**
 * El precio listo para pantalla, o `null` si no hay nada honesto que decir.
 *
 * Devolver `null` en vez de "Sin publicar" es a propósito: en la tarjeta el
 * hueco se omite y en la ficha se rotula, y esa decisión es de cada vista.
 */
export function formatearPrecio(evento: PrecioEvento): string | null {
  const { price_kind, price_min, price_max } = evento;

  switch (price_kind) {
    case "gratis":
      return "Entrada libre";

    // Sabemos que cuesta, no cuánto. Es más de lo que dice un campo vacío, y
    // por eso no se colapsa con `null`.
    case "con_costo":
      return "Entrada con costo";

    case "unico":
      return price_min === null ? null : `$${enLucas(price_min)} lks`;

    // El piso sin techo: la fuente publicó `startingPrice` y decir el número
    // pelado afirmaría que el show cuesta eso.
    case "desde":
      return price_min === null ? null : `Desde $${enLucas(price_min)} lks`;

    case "rango": {
      if (price_min === null || price_max === null) return null;
      // Un rango cuyos extremos coinciden no es un rango. Puede llegar así si
      // el admin escribe el mismo monto dos veces.
      if (price_min === price_max) return `$${enLucas(price_min)} lks`;
      // Un solo `$` y un solo `lks` para todo el rango: repetirlos lo vuelve
      // ilegible en el ancho de una tarjeta.
      return `$${enLucas(price_min)} – ${enLucas(price_max)} lks`;
    }

    default:
      return null;
  }
}
