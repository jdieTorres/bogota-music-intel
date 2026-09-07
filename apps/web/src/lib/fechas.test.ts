import { describe, expect, it } from "vitest";

import { horaDeEvento, piezasDeDia, tieneHoraPublicada } from "@/lib/fechas";

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

describe("piezasDeDia", () => {
  it("parte la fecha en día de semana, número y mes", () => {
    expect(piezasDeDia("2026-09-11")).toEqual({
      diaSemana: "vie",
      numero: "11",
      mes: "sept",
    });
  });

  // Regresión: la clave es YYYY-MM-DD y formatearla a medianoche hace que el
  // huso de Bogotá (UTC-5 todo el año) corra la fecha al día anterior. Ya se
  // pagó dos veces en este proyecto con razonamientos sobre horas.
  it("no corre el día hacia atrás en el primero del mes", () => {
    expect(piezasDeDia("2026-09-01").numero).toBe("1");
    expect(piezasDeDia("2026-09-01").mes).toBe("sept");
  });
});
