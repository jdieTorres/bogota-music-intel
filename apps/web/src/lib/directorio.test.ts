import { describe, expect, it } from "vitest";

import { recomendar, type SenalDeArtista } from "@/lib/directorio";

function artista(slug: string, parcial: Partial<SenalDeArtista> = {}): SenalDeArtista {
  return {
    slug,
    nombre: parcial.nombre ?? slug,
    carteles: parcial.carteles ?? [],
    salas: parcial.salas ?? [],
    generos: parcial.generos ?? [],
  };
}

describe("recomendar", () => {
  it("no devuelve nada cuando no hay ninguna señal", () => {
    // Lo que importa: no rellena. Una lista de artistas al azar afirmaría
    // "estos se parecen" sobre algo que nadie comprobó.
    const base = artista("la-base", { salas: ["Latino Power"], generos: ["Punk"] });
    const otros = [artista("ajeno", { salas: ["Movistar Arena"], generos: ["Vallenato"] })];
    expect(recomendar(base, otros)).toEqual([]);
  });

  it("nunca se recomienda a sí mismo", () => {
    const base = artista("la-base", { salas: ["Latino Power"] });
    expect(recomendar(base, [base])).toEqual([]);
  });

  it("cada fila trae su razón escrita", () => {
    const base = artista("la-base", { salas: ["Latino Power"] });
    const otros = [artista("vecino", { nombre: "Vecino", salas: ["Latino Power"] })];
    expect(recomendar(base, otros)).toEqual([
      { slug: "vecino", nombre: "Vecino", razon: "También ha tocado en Latino Power" },
    ]);
  });

  it("pone el cartel antes que la sala y la sala antes que el género", () => {
    const base = artista("la-base", {
      carteles: [{ eventoId: "e1", startsAt: "2026-10-13T01:00:00Z" }],
      salas: ["Latino Power"],
      generos: ["Punk"],
    });
    const otros = [
      artista("por-genero", { nombre: "Por género", generos: ["Punk"] }),
      artista("por-sala", { nombre: "Por sala", salas: ["Latino Power"] }),
      artista("por-cartel", {
        nombre: "Por cartel",
        carteles: [{ eventoId: "e1", startsAt: "2026-10-13T01:00:00Z" }],
      }),
    ];
    expect(recomendar(base, otros).map((r) => r.slug)).toEqual([
      "por-cartel",
      "por-sala",
      "por-genero",
    ]);
  });

  it("una sola razón por artista: la más fuerte que tenga", () => {
    const base = artista("la-base", { salas: ["Latino Power"], generos: ["Punk"] });
    const otros = [
      artista("los-dos", { nombre: "Los dos", salas: ["Latino Power"], generos: ["Punk"] }),
    ];
    const resultado = recomendar(base, otros);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].razon).toBe("También ha tocado en Latino Power");
  });

  it("fecha el cartel en hora de Bogotá, no en UTC", () => {
    // El show es del 12 de octubre a las 8 p. m. en Bogotá, y por eso se
    // guarda como el 13 en UTC. Razonar sobre el texto ISO diría "13 de oct".
    const cartel = [{ eventoId: "e1", startsAt: "2026-10-13T01:00:00Z" }];
    const base = artista("la-base", { carteles: cartel });
    const otros = [artista("companero", { nombre: "Compañero", carteles: cartel })];
    expect(recomendar(base, otros)[0].razon).toBe("Compartieron cartel el 12 de oct");
  });

  it("dice el hecho sin fecha cuando la fuente no publicó una", () => {
    const base = artista("la-base", { carteles: [{ eventoId: "e1", startsAt: null }] });
    const otros = [artista("companero", { carteles: [{ eventoId: "e1", startsAt: null }] })];
    expect(recomendar(base, otros)[0].razon).toBe("Compartieron cartel");
  });

  it("ordena alfabético dentro de la misma razón, para que la lista no se baraje", () => {
    const base = artista("la-base", { salas: ["Latino Power"] });
    const otros = [
      artista("zeta", { nombre: "Zeta", salas: ["Latino Power"] }),
      artista("alfa", { nombre: "Alfa", salas: ["Latino Power"] }),
    ];
    expect(recomendar(base, otros).map((r) => r.nombre)).toEqual(["Alfa", "Zeta"]);
  });

  it("respeta el tope", () => {
    const base = artista("la-base", { salas: ["Latino Power"] });
    const otros = Array.from({ length: 10 }, (_, i) =>
      artista(`b${i}`, { nombre: `Banda ${i}`, salas: ["Latino Power"] }),
    );
    expect(recomendar(base, otros, 3)).toHaveLength(3);
  });
});
