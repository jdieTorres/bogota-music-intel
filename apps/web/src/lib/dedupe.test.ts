import { describe, expect, it } from "vitest";

import { unificarDuplicados } from "@/lib/dedupe";
import type { Evento } from "@/lib/events";

function evento(parcial: Partial<Evento> & { title: string }): Evento {
  return {
    id: parcial.title,
    source: "test",
    starts_at: "2026-08-29T01:00:00+00:00",
    ends_at: null,
    date_precision: "day",
    description: null,
    price_text: null,
    category: null,
    ticket_url: null,
    source_url: "https://ejemplo.co",
    image_url: null,
    venue_name_raw: "Royal Center",
    venues: null,
    ...parcial,
  };
}

describe("unificarDuplicados", () => {
  it("une el mismo show publicado por la sala y por el promotor", () => {
    // Caso real: Royal Center y Rockal Live listan el mismo concierto.
    const resultado = unificarDuplicados([
      evento({ title: "MADE4RAP" }),
      evento({ title: "MADE4RAP BOGOTÁ", category: "Hip Hop/Rap" }),
    ]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].category).toBe("Hip Hop/Rap");
  });

  it("une cuando un título está contenido en el otro", () => {
    const resultado = unificarDuplicados([
      evento({ title: "AKRIILA -  TOUR LUCY" }),
      evento({ title: "AKRIILA EN BOGOTÁ" }),
    ]);
    expect(resultado).toHaveLength(1);
  });

  it("conserva el registro más completo", () => {
    const pobre = evento({ title: "MADE4RAP" });
    const rico = evento({
      title: "MADE4RAP BOGOTÁ",
      price_text: "$157.000 COP",
      category: "Hip Hop/Rap",
      image_url: "https://ejemplo.co/a.jpg",
    });

    expect(unificarDuplicados([pobre, rico])[0]).toBe(rico);
    // El orden de entrada no debe cambiar cuál gana.
    expect(unificarDuplicados([rico, pobre])[0]).toBe(rico);
  });

  it("NO une dos shows distintos de la misma sala el mismo día", () => {
    const resultado = unificarDuplicados([
      evento({ title: "Noche de Salsa" }),
      evento({ title: "Noche Electrónica" }),
    ]);
    expect(resultado).toHaveLength(2);
  });

  it("NO une eventos con el mismo título en salas distintas", () => {
    const resultado = unificarDuplicados([
      evento({ title: "The Jazz Room", venue_name_raw: "Royal Center" }),
      evento({ title: "The Jazz Room", venue_name_raw: "Latino Power" }),
    ]);
    expect(resultado).toHaveLength(2);
  });

  it("NO une funciones del mismo evento en días distintos", () => {
    const resultado = unificarDuplicados([
      evento({ title: "The Jazz Room", starts_at: "2026-09-04T01:00:00+00:00" }),
      evento({ title: "The Jazz Room", starts_at: "2026-09-11T01:00:00+00:00" }),
    ]);
    expect(resultado).toHaveLength(2);
  });

  it("no toca eventos sin fecha", () => {
    const resultado = unificarDuplicados([
      evento({ title: "Por confirmar", starts_at: null }),
      evento({ title: "Por confirmar", starts_at: null }),
    ]);
    expect(resultado).toHaveLength(2);
  });

  it("respeta el orden cronológico de entrada", () => {
    const resultado = unificarDuplicados([
      evento({ title: "Primero", starts_at: "2026-08-29T01:00:00+00:00" }),
      evento({ title: "Segundo", starts_at: "2026-08-30T01:00:00+00:00" }),
    ]);
    expect(resultado.map((e) => e.title)).toEqual(["Primero", "Segundo"]);
  });

  it("lista vacía", () => {
    expect(unificarDuplicados([])).toEqual([]);
  });
});
