import { describe, expect, it } from "vitest";

import { horaDeEvento, tieneHoraPublicada } from "@/lib/fechas";

describe("tieneHoraPublicada", () => {
  // Bogotá es UTC-5 todo el año. La trampa: comparar el texto ISO contra
  // "T00:00:00" responde sobre UTC, no sobre la hora local, y da lo contrario
  // de lo que se busca.

  it("medianoche en Bogotá (T05:00:00Z) es 'sin hora publicada'", () => {
    expect(tieneHoraPublicada("2026-08-29T05:00:00+00:00")).toBe(false);
  });

  it("las 7 p. m. de Bogotá (T00:00:00Z del día siguiente) SÍ tienen hora", () => {
    expect(tieneHoraPublicada("2026-08-30T00:00:00+00:00")).toBe(true);
  });

  it("una hora cualquiera de la noche tiene hora", () => {
    expect(tieneHoraPublicada("2026-09-11T01:00:00+00:00")).toBe(true);
  });

  it("sin fecha no hay hora", () => {
    expect(tieneHoraPublicada(null)).toBe(false);
  });
});

describe("horaDeEvento", () => {
  it("no inventa una hora cuando la fuente solo publicó fecha", () => {
    expect(horaDeEvento("2026-08-29T05:00:00+00:00", "day")).toBeNull();
  });

  it("formatea la hora local de Bogotá", () => {
    // 2026-10-03T01:00:00Z = 8:00 p. m. del 2 de octubre en Bogotá.
    const resultado = horaDeEvento("2026-10-03T01:00:00+00:00", "day");
    expect(resultado).toMatch(/8:00/);
    expect(resultado).toMatch(/p\.?\s?m/i);
  });

  it("no muestra hora si la precisión no es de día", () => {
    expect(horaDeEvento("2026-10-03T01:00:00+00:00", "unknown")).toBeNull();
  });
});
