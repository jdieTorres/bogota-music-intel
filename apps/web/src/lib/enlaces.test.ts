import { describe, expect, it } from "vitest";

import { primerEnlace } from "@/lib/enlaces";

describe("primerEnlace", () => {
  it("saca la URL pelada", () => {
    expect(primerEnlace("https://www.instagram.com/p/DdAE8wcCSW9/?hl=en")).toBe(
      "https://www.instagram.com/p/DdAE8wcCSW9/?hl=en",
    );
  });

  it("saca la URL de adentro de una frase", () => {
    expect(primerEnlace("Lo publicó la sala en su historia: https://ejemplo.co/x")).toBe(
      "https://ejemplo.co/x",
    );
  });

  it("no se lleva la puntuación que cierra la frase", () => {
    expect(primerEnlace("Confirmado en https://ejemplo.co/x, por el bajista.")).toBe(
      "https://ejemplo.co/x",
    );
  });

  it("devuelve null cuando la evidencia no es un enlace", () => {
    // El caso que importa: una nota interna no puede terminar publicada.
    expect(primerEnlace("Me lo confirmó el bajista por teléfono")).toBeNull();
    expect(primerEnlace(null)).toBeNull();
  });
});
