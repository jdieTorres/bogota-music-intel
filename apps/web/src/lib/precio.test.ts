import { describe, expect, it } from "vitest";

import { enLucas, formatearPrecio, type PrecioEvento } from "./precio";

const precio = (p: Partial<PrecioEvento>): PrecioEvento => ({
  price_kind: null,
  price_min: null,
  price_max: null,
  ...p,
});

describe("enLucas", () => {
  it("un monto redondo no arrastra decimales", () => {
    expect(enLucas(120000)).toBe("120");
    expect(enLucas(77000)).toBe("77");
  });

  it("conserva el decimal de un monto que no es redondo", () => {
    // Redondear 33.900 a "34 lks" mostraría un precio que nadie va a pagar.
    expect(enLucas(33900)).toBe("33,9");
    expect(enLucas(28250)).toBe("28,25");
    expect(enLucas(101700)).toBe("101,7");
  });

  it("usa coma decimal, no punto", () => {
    expect(enLucas(33900)).toContain(",");
    expect(enLucas(33900)).not.toContain(".");
  });

  it("no se va a cuatro decimales por un monto raro", () => {
    expect(enLucas(33333)).toBe("33,33");
  });
});

describe("formatearPrecio", () => {
  it("un precio único", () => {
    expect(formatearPrecio(precio({ price_kind: "unico", price_min: 120000, price_max: 120000 })))
      .toBe("$120 lks");
  });

  it("un rango lleva un solo $ y un solo lks", () => {
    // Repetirlos lo vuelve ilegible en el ancho de una tarjeta.
    expect(formatearPrecio(precio({ price_kind: "rango", price_min: 33900, price_max: 120000 })))
      .toBe("$33,9 – 120 lks");
  });

  it("un rango con los dos extremos iguales no se escribe como rango", () => {
    expect(formatearPrecio(precio({ price_kind: "rango", price_min: 80000, price_max: 80000 })))
      .toBe("$80 lks");
  });

  it("el piso sin techo dice que es un piso", () => {
    // Rockal Live publica `startingPrice`. Mostrarlo pelado afirmaría que el
    // show cuesta eso, y la fuente solo dice que es el más barato.
    expect(formatearPrecio(precio({ price_kind: "desde", price_min: 77000 })))
      .toBe("Desde $77 lks");
  });

  it("gratis se escribe con palabras, no como $0", () => {
    expect(formatearPrecio(precio({ price_kind: "gratis", price_min: 0, price_max: 0 })))
      .toBe("Entrada libre");
  });

  it("'cuesta pero no sabemos cuánto' no es lo mismo que no saber nada", () => {
    expect(formatearPrecio(precio({ price_kind: "con_costo" }))).toBe("Entrada con costo");
    expect(formatearPrecio(precio({ price_kind: null }))).toBeNull();
  });

  it("una clase con el monto faltante no inventa un precio", () => {
    // Puede pasar si una migración a medias deja la clase sin sus montos.
    expect(formatearPrecio(precio({ price_kind: "unico" }))).toBeNull();
    expect(formatearPrecio(precio({ price_kind: "rango", price_min: 33900 }))).toBeNull();
  });
});
