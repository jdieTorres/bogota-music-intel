import { describe, expect, it } from "vitest";

import {
  aCamposDeFecha,
  anioParaDiaYMes,
  desdeCamposDeFecha,
  fechaConAnioInferido,
} from "@/lib/admin/fecha";

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

describe("anioParaDiaYMes", () => {
  // 15 de septiembre de 2026, 10:00 de la mañana en Bogotá.
  const hoy = new Date("2026-09-15T15:00:00Z");

  it("usa el año en curso para una fecha que todavía no llega", () => {
    expect(anioParaDiaYMes("09-20", hoy)).toBe(2026);
    expect(anioParaDiaYMes("12-31", hoy)).toBe(2026);
  });

  it("pasa al año entrante cuando el mes ya pasó", () => {
    // El caso que pidió Juan: un afiche de enero leído en septiembre.
    expect(anioParaDiaYMes("01-15", hoy)).toBe(2027);
    expect(anioParaDiaYMes("03-02", hoy)).toBe(2027);
  });

  it("deja en el año en curso lo de hoy mismo", () => {
    expect(anioParaDiaYMes("09-15", hoy)).toBe(2026);
  });

  it("aguanta siete días hacia atrás, para el flyer del toque de anoche", () => {
    expect(anioParaDiaYMes("09-14", hoy)).toBe(2026);
    expect(anioParaDiaYMes("09-08", hoy)).toBe(2026);
    // Al octavo ya se lee como del año entrante.
    expect(anioParaDiaYMes("09-07", hoy)).toBe(2027);
  });

  it("no inventa nada con una entrada que no es día y mes", () => {
    expect(anioParaDiaYMes("2026-09-20", hoy)).toBeNull();
    expect(anioParaDiaYMes("13-01", hoy)).toBeNull();
    expect(anioParaDiaYMes("", hoy)).toBeNull();
  });

  it("lee el día en hora de Bogotá y no en la del navegador", () => {
    // 1 de enero a las 02:00 UTC es todavía 31 de diciembre en Bogotá, así
    // que "12-31" es hoy y no el 31 del año que viene.
    const anioNuevo = new Date("2027-01-01T02:00:00Z");
    expect(anioParaDiaYMes("12-31", anioNuevo)).toBe(2026);
  });
});

describe("fechaConAnioInferido", () => {
  const hoy = new Date("2026-09-15T15:00:00Z");

  it("arma la fecha completa", () => {
    expect(fechaConAnioInferido("10-03", hoy)).toBe("2026-10-03");
    expect(fechaConAnioInferido("01-20", hoy)).toBe("2027-01-20");
  });

  it("devuelve null si no hay día y mes que completar", () => {
    expect(fechaConAnioInferido("nada", hoy)).toBeNull();
  });
});
