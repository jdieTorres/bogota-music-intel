import { describe, expect, it } from "vitest";

import { esSoloUnEnlace, salaQueCoincide } from "@/lib/admin/afiche";

describe("salaQueCoincide", () => {
  const salas = [
    { id: "a", name: "Latino Power Chapinero" },
    { id: "b", name: "Teatro Libre Sede Centro" },
    { id: "c", name: "Teatro Libre Sede Chapinero" },
  ];

  it("empareja ignorando acentos, mayúsculas y puntuación", () => {
    expect(salaQueCoincide("LATINO POWER CHAPINERÓ", salas)).toBe("a");
  });

  it("NO empareja por subcadena", () => {
    // "Teatro Libre" a secas es ambiguo entre dos sedes. Elegir una sería
    // afirmar algo que el afiche no dice.
    expect(salaQueCoincide("Teatro Libre", salas)).toBeNull();
  });

  it("devuelve null para una sala que no existe todavía", () => {
    // Nunca se crea una sala desde el afiche: el slug tiene que coincidir con
    // el que genera la ingesta o los eventos quedan repartidos entre copias.
    expect(salaQueCoincide("Boro Room", salas)).toBeNull();
  });

  it("devuelve null si el afiche no nombra el lugar", () => {
    expect(salaQueCoincide(null, salas)).toBeNull();
  });
});

describe("esSoloUnEnlace", () => {
  it("reconoce el enlace pegado solo", () => {
    // El caso real: se pega el link del post en vez del texto. Nuestro
    // servidor no puede ir a buscarlo —Instagram lo bloquea— y el modelo
    // tampoco lo abre, así que gastar la llamada solo devuelve campos vacíos
    // y parece un fallo.
    expect(esSoloUnEnlace("https://www.instagram.com/p/ABC123/")).toBe(true);
    expect(esSoloUnEnlace("  www.tuboleta.com/evento/x  ")).toBe(true);
  });

  it("deja pasar el texto que además trae un enlace", () => {
    // Acá sí hay contenido copiado por una persona: eso es "pegar, no traer".
    expect(
      esSoloUnEnlace("Bloodbath en Lourdes, 20 de septiembre. Boletas: https://passline.com/x"),
    ).toBe(false);
  });

  it("no se activa con texto normal ni con el campo vacío", () => {
    expect(esSoloUnEnlace("Todo Copas en Latino Power")).toBe(false);
    expect(esSoloUnEnlace("   ")).toBe(false);
  });
});
