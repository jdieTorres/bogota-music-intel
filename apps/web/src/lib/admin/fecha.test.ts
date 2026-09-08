import { describe, expect, it } from "vitest";

import { aCamposDeFecha, desdeCamposDeFecha } from "@/lib/admin/fecha";

describe("desdeCamposDeFecha", () => {
  it("guarda la fecha aunque no haya hora", () => {
    // El bug que lo motivó: un `datetime-local` devuelve vacío mientras
    // falte una de las dos mitades, así que escribir solo el día no
    // guardaba nada. La mayoría de los afiches anuncian el día y no la hora.
    expect(desdeCamposDeFecha("2026-09-20", "")).toBe("2026-09-20T00:00:00-05:00");
  });

  it("junta fecha y hora en hora de Bogotá", () => {
    expect(desdeCamposDeFecha("2026-09-20", "21:00")).toBe("2026-09-20T21:00:00-05:00");
  });

  it("sin fecha no hay instante", () => {
    expect(desdeCamposDeFecha("", "21:00")).toBeNull();
    expect(desdeCamposDeFecha("", "")).toBeNull();
  });

  it("nunca produce un instante en UTC", () => {
    // Un evento de las 9 de la noche guardado como UTC se muestra cinco
    // horas antes. Ya pasó dos veces en este proyecto.
    expect(desdeCamposDeFecha("2026-09-20", "21:00")).not.toMatch(/Z$/);
  });
});

describe("aCamposDeFecha", () => {
  it("parte un instante en los dos campos, en hora de Bogotá", () => {
    // 2026-09-21T02:00Z son las 9 de la noche del 20 en Bogotá: el día
    // también cambia, no solo la hora.
    expect(aCamposDeFecha("2026-09-21T02:00:00Z")).toEqual({
      fecha: "2026-09-20",
      hora: "21:00",
    });
  });

  it("deja la hora vacía cuando el evento no tiene hora publicada", () => {
    // Medianoche de Bogotá es la convención de "solo se sabe el día".
    // Devolverla como 00:00 la convertiría en una hora que alguien escribió.
    expect(aCamposDeFecha("2026-09-20T05:00:00Z")).toEqual({
      fecha: "2026-09-20",
      hora: "",
    });
  });

  it("de un evento sin fecha devuelve los dos campos vacíos", () => {
    expect(aCamposDeFecha(null)).toEqual({ fecha: "", hora: "" });
  });

  it("ida y vuelta sin hora conserva el día", () => {
    const guardado = desdeCamposDeFecha("2026-09-20", "");
    expect(aCamposDeFecha(guardado)).toEqual({ fecha: "2026-09-20", hora: "" });
  });
});
