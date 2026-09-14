import { describe, expect, it } from "vitest";

import { type ArtistaVinculable, sugerencias } from "@/lib/admin/cartel";

const artista = (nombre: string, extra: Partial<ArtistaVinculable> = {}): ArtistaVinculable => ({
  id: nombre,
  nombre,
  slug: nombre.toLowerCase().replace(/\s+/g, "-"),
  status: "publicado",
  ...extra,
});

const DIRECTORIO = [
  artista("Nicolás y los Fumadores"),
  artista("Los Petit Fellas"),
  artista("El Kalvo", { status: "borrador" }),
  artista("Diamante Eléctrico"),
];

describe("sugerencias", () => {
  it("sin escribir nada no propone nada", () => {
    // El campo arranca callado: una lista de todo el directorio al enfocar
    // no ayuda a elegir, y con el directorio lleno sería inmanejable.
    expect(sugerencias(DIRECTORIO, "", [])).toEqual([]);
  });

  it("encuentra por cualquier parte del nombre, no solo por el principio", () => {
    // "Fumadores" tiene que traer a "Nicolás y los Fumadores": uno busca por
    // la palabra que recuerda, que casi nunca es la primera.
    expect(sugerencias(DIRECTORIO, "fumadores", []).map((a) => a.nombre)).toEqual([
      "Nicolás y los Fumadores",
    ]);
  });

  it("ignora mayúsculas y tildes", () => {
    // Nadie escribe "Nicolás" con tilde en un campo de búsqueda, y "diamante
    // electrico" tiene que encontrar a "Diamante Eléctrico".
    expect(sugerencias(DIRECTORIO, "electrico", []).map((a) => a.nombre)).toEqual([
      "Diamante Eléctrico",
    ]);
    expect(sugerencias(DIRECTORIO, "NICOLAS", []).map((a) => a.nombre)).toEqual([
      "Nicolás y los Fumadores",
    ]);
  });

  it("propone también los borradores", () => {
    // El que se creó desde el toque del jueves está en borrador. Si no
    // apareciera, el toque del sábado crearía un duplicado y chocaría contra
    // el slug repetido.
    expect(sugerencias(DIRECTORIO, "kalvo", []).map((a) => a.nombre)).toEqual(["El Kalvo"]);
  });

  it("no propone a quien ya está en el cartel de este toque", () => {
    // Vincularlo dos veces rompe contra la llave primaria, y ofrecerlo es
    // prometer algo que va a fallar.
    expect(sugerencias(DIRECTORIO, "petit", ["Los Petit Fellas"])).toEqual([]);
  });

  it("no se pasa de cinco", () => {
    const muchos = Array.from({ length: 20 }, (_, i) => artista(`Banda ${i}`));
    expect(sugerencias(muchos, "banda", [])).toHaveLength(5);
  });
});
