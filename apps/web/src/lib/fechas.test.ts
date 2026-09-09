import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { horaDeEvento, piezasDeDia, siguePorVenir, tieneHoraPublicada } from "@/lib/fechas";

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

describe("siguePorVenir", () => {
  // ⚠️ Este bloque existe por un bug real, encontrado el 2026-09-09 revisando
  // la ficha del artista contra las reglas duras.
  //
  // El filtro estaba escrito como `starts_at >= inicioDeHoyEnBogota()`, o sea
  // **comparando dos cadenas ISO con husos distintos**: `starts_at` llega de
  // la base con `+00:00` y el corte del día se escribe con `-05:00`. Comparar
  // eso como texto responde por el orden de los caracteres, no por el de los
  // instantes, y falla justo donde más duele — dentro del mismo día.
  //
  // Es el mismo error de razonar sobre el texto ISO que ya se cometió dos
  // veces acá, con otra cara. Por eso el reloj se congela: sin eso el caso
  // que lo delata no se puede escribir.
  beforeEach(() => {
    vi.useFakeTimers();
    // Mediodía del 9 de septiembre en Bogotá.
    vi.setSystemTime(new Date("2026-09-09T17:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("un show de anoche ya pasó, aunque su texto ISO diga el día de hoy", () => {
    // 11 p. m. del 8 de septiembre en Bogotá se guarda como el 9 a las 04:00Z.
    // Comparado como texto contra "2026-09-09T00:00:00-05:00" da `true` —
    // "04" es mayor que "00"— y el show de anoche aparecería como por venir.
    expect(siguePorVenir("2026-09-09T04:00:00+00:00")).toBe(false);
  });

  it("un show de esta noche sí está por venir", () => {
    // 8 p. m. del 9 de septiembre en Bogotá: el 10 a las 01:00Z.
    expect(siguePorVenir("2026-09-10T01:00:00+00:00")).toBe(true);
  });

  it("un show que ya empezó hoy sigue contando como por venir", () => {
    // 10 a. m. de hoy, con el reloj en el mediodía. El corte es el inicio del
    // día y no "ahora": a media tarde, el show del mediodía todavía le sirve
    // a quien va saliendo.
    expect(siguePorVenir("2026-09-09T15:00:00+00:00")).toBe(true);
  });

  it("sin fecha publicada no afirma que esté por venir", () => {
    expect(siguePorVenir(null)).toBe(false);
  });
});
