import { describe, expect, it } from "vitest";

import { slugDeSala } from "@/lib/admin/slug";

/**
 * Salidas reales de `python-slugify`, que es lo que usa `upsert_venues` en
 * la ingesta. Generadas corriéndolo, no escritas de memoria.
 *
 * Por qué importa tanto: el slug es la identidad de la sala. Si el
 * formulario genera uno distinto del que generaría el scraper para el mismo
 * nombre, el día que una fuente empiece a publicar esa sala la crearía otra
 * vez como fila nueva, y los eventos quedarían repartidos entre las dos
 * copias sin que nada avise.
 */
const COMO_LO_HACE_PYTHON: [string, string][] = [
  ["Movistar Arena", "movistar-arena"],
  ["Royal Center", "royal-center"],
  ["Latino Power Chapinero", "latino-power-chapinero"],
  ["Lourdes Music Hall", "lourdes-music-hall"],
  ["Teatro Jorge Eliécer Gaitán", "teatro-jorge-eliecer-gaitan"],
  ["Teatro Libre de Bogotá Sala Centro", "teatro-libre-de-bogota-sala-centro"],
  ["Auditorio Mayor", "auditorio-mayor"],
  ["Capital Live Concerts", "capital-live-concerts"],
  ["Teatro Libre Sede Chapinero", "teatro-libre-sede-chapinero"],
  ["Bar El Tránsito", "bar-el-transito"],
  ["Café & Copas", "cafe-copas"],
  ["  espacios   raros  ", "espacios-raros"],
  // El apóstrofo también separa: 'nono-s-pub', no 'nonos-pub'.
  ["Ñoño's Pub", "nono-s-pub"],
  ["Salón 1900", "salon-1900"],
  ["AC/DC Bar", "ac-dc-bar"],
  ["Casa E — Sede Bogotá", "casa-e-sede-bogota"],
  // El punto decimal también: 'villa-maria-2-0'.
  ["Villa María 2.0", "villa-maria-2-0"],
];

describe("slugDeSala", () => {
  it.each(COMO_LO_HACE_PYTHON)("%s -> %s", (nombre, esperado) => {
    expect(slugDeSala(nombre)).toBe(esperado);
  });

  it("no deja guiones colgando en los bordes", () => {
    expect(slugDeSala("¡¡¡Bar!!!")).toBe("bar");
  });
});
