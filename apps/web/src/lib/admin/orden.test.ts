import { describe, expect, it } from "vitest";

import { moverEn } from "@/lib/admin/orden";

describe("moverEn", () => {
  const cartel = ["Kidchen", "Sor sagrario", "Rios de ceniza"];

  it("lleva un elemento hacia adelante", () => {
    expect(moverEn(cartel, 0, 2)).toEqual([
      "Sor sagrario",
      "Rios de ceniza",
      "Kidchen",
    ]);
  });

  it("lo lleva hacia atrás", () => {
    expect(moverEn(cartel, 2, 0)).toEqual([
      "Rios de ceniza",
      "Kidchen",
      "Sor sagrario",
    ]);
  });

  it("intercambia dos vecinos", () => {
    expect(moverEn(cartel, 0, 1)).toEqual([
      "Sor sagrario",
      "Kidchen",
      "Rios de ceniza",
    ]);
  });

  it("no muta la lista original", () => {
    const original = [...cartel];
    moverEn(cartel, 0, 2);
    expect(cartel).toEqual(original);
  });

  it("un índice fuera de rango no rompe ni cambia nada", () => {
    // Los dos llamadores son eventos del navegador: un `drop` sobre el borde
    // del contenedor, una flecha en el último chip.
    expect(moverEn(cartel, 0, 9)).toEqual(cartel);
    expect(moverEn(cartel, -1, 1)).toEqual(cartel);
    expect(moverEn(cartel, 1, 1)).toEqual(cartel);
  });

  it("con un solo elemento no hay nada que mover", () => {
    expect(moverEn(["uno"], 0, 0)).toEqual(["uno"]);
  });
});
