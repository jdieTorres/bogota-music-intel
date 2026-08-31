import { describe, expect, it } from "vitest";

import { claveDeTitulo } from "@/lib/tituloEvento";
import { GRAFIAS, TITULOS } from "@/lib/titulosCurados";

// El mismo contrato que exigen los tests de artistas_locales.py y
// coordenadas_curadas.py en el backend: nada entra a una lista curada sin
// una fuente consultable escrita al lado. La regla dura del proyecto es que
// el dato venga de una fuente, nunca de memoria — y un test es la única
// forma de que eso siga siendo cierto dentro de seis meses.

describe("GRAFIAS", () => {
  it("cada entrada deja escrito de dónde salió", () => {
    for (const g of GRAFIAS) {
      expect(g.evidencia.length, `sin evidencia: ${g.nombre}`).toBeGreaterThan(60);
    }
  });

  it("cada entrada cambia algo", () => {
    for (const g of GRAFIAS) {
      expect(g.comoLoPublican, `entrada que no corrige nada: ${g.nombre}`).not.toBe(
        g.nombre,
      );
    }
  });

  it("no hay dos entradas que se peleen la misma grafía", () => {
    const claves = GRAFIAS.map((g) => claveDeTitulo(g.comoLoPublican));
    expect(new Set(claves).size).toBe(claves.length);
  });
});

describe("TITULOS", () => {
  it("cada entrada deja escrito de dónde salió", () => {
    for (const t of TITULOS) {
      expect(t.evidencia.length, `sin evidencia: ${t.comoLoPublican}`).toBeGreaterThan(60);
    }
  });

  it("cada entrada nombra al menos un artista, sin huecos", () => {
    for (const t of TITULOS) {
      expect(t.artistas.length, `sin artistas: ${t.comoLoPublican}`).toBeGreaterThan(0);
      for (const artista of t.artistas) expect(artista.trim()).toBe(artista);
      expect(t.artistas.every(Boolean)).toBe(true);
    }
  });

  it("la gira es un nombre o es null, nunca una cadena vacía", () => {
    // "No sé" y "confirmado que no hay gira" son estados distintos; una
    // cadena vacía los colapsa y termina mostrando una barra colgando.
    for (const t of TITULOS) {
      expect(t.gira === null || t.gira.trim().length > 0).toBe(true);
    }
  });

  it("no hay dos entradas para el mismo título", () => {
    const claves = TITULOS.map((t) => claveDeTitulo(t.comoLoPublican));
    expect(new Set(claves).size).toBe(claves.length);
  });
});
