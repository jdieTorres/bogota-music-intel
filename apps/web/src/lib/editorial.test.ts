import { describe, expect, it } from "vitest";

import { GENEROS_SUGERIDOS } from "@/lib/admin/generos";
import {
  EN_CARTELERA,
  SOLO_CONCIERTOS,
  SOLO_FIESTAS,
  generoVisible,
  priorizarLocales,
} from "@/lib/editorial";

/** Lo único que mira `priorizarLocales`, más un nombre para poder afirmar. */
function evento(title: string, is_local: boolean | null) {
  return { title, is_local };
}

describe("priorizarLocales", () => {
  it("baja al internacional confirmado", () => {
    const resultado = priorizarLocales([
      evento("ROBBIE WILLIAMS", false),
      evento("El Kalvo", true),
    ]);
    expect(resultado.map((e) => e.title)).toEqual(["El Kalvo", "ROBBIE WILLIAMS"]);
  });

  it("NO penaliza al artista que no se pudo resolver", () => {
    // La mayoría de los artistas locales pequeños no están en MusicBrainz.
    // Si "no sé" contara como "no es local", la cartelera hundiría
    // justamente los toques que existe para promover.
    const resultado = priorizarLocales([
      evento("MADE4RAP", null),
      evento("ROBBIE WILLIAMS", false),
    ]);
    expect(resultado.map((e) => e.title)).toEqual(["MADE4RAP", "ROBBIE WILLIAMS"]);
  });

  it("no reordena entre un local y uno sin resolver", () => {
    // Ninguno de los dos se degrada, así que manda el orden de entrada,
    // que viene cronológico.
    const resultado = priorizarLocales([
      evento("Sin resolver, más temprano", null),
      evento("Local, más tarde", true),
    ]);
    expect(resultado.map((e) => e.title)).toEqual([
      "Sin resolver, más temprano",
      "Local, más tarde",
    ]);
  });

  it("conserva el orden cronológico dentro de cada bloque", () => {
    const resultado = priorizarLocales([
      evento("Intl 1", false),
      evento("Local 1", true),
      evento("Intl 2", false),
      evento("Local 2", true),
    ]);
    expect(resultado.map((e) => e.title)).toEqual([
      "Local 1",
      "Local 2",
      "Intl 1",
      "Intl 2",
    ]);
  });

  it("no muta la lista que recibe", () => {
    const original = [evento("Intl", false), evento("Local", true)];
    priorizarLocales(original);
    expect(original.map((e) => e.title)).toEqual(["Intl", "Local"]);
  });

  it("lista vacía", () => {
    expect(priorizarLocales([])).toEqual([]);
  });
});

describe("filtros editoriales", () => {
  it("los conciertos dejan pasar lo que todavía no se clasificó", () => {
    // El filtro tiene que ser "es música O es null". Pedir sólo
    // "distinto de not_music" haría que PostgREST descartara los null,
    // porque en SQL comparar contra null da null — y la cartelera se
    // vaciaría hasta que el clasificador corra.
    expect(SOLO_CONCIERTOS).toContain("event_type.is.null");
    expect(SOLO_CONCIERTOS).toContain("event_type.eq.music");
  });

  it("las dos pestañas no muestran lo mismo", () => {
    // Si los conciertos dejaran pasar las fiestas, cada evento saldría en
    // las dos pestañas y separarlas no habría servido de nada.
    expect(SOLO_CONCIERTOS).not.toContain("fiesta");
    expect(SOLO_FIESTAS).toContain("event_type.eq.fiesta");
    expect(SOLO_FIESTAS).not.toContain("event_type.eq.music");
  });

  it("el mapa muestra las dos cosas, pero nunca lo que no es música", () => {
    expect(EN_CARTELERA).toContain("event_type.eq.music");
    expect(EN_CARTELERA).toContain("event_type.eq.fiesta");
    expect(EN_CARTELERA).toContain("event_type.is.null");
    expect(EN_CARTELERA).not.toContain("not_music");
  });
});

describe("generoVisible", () => {
  it("muestra el género cuando dice algo", () => {
    expect(generoVisible("Rock/Punk/Metal")).toBe("Rock/Punk/Metal");
    expect(generoVisible("Hip Hop/Rap")).toBe("Hip Hop/Rap");
  });

  it("esconde la categoría que no aporta nada", () => {
    // visitbogota escribe su taxonomía en `category` desde el 2026-09-01,
    // y "Conciertos" en la pestaña de conciertos es puro ruido.
    expect(generoVisible("Conciertos")).toBeNull();
    // "Otro" es el valor de Rockal Live para "otro género": tampoco dice nada.
    expect(generoVisible("Otro")).toBeNull();
  });

  it("no se deja engañar por mayúsculas ni espacios", () => {
    expect(generoVisible("  CONCIERTOS ")).toBeNull();
  });

  it("sin categoría no hay chip", () => {
    expect(generoVisible(null)).toBeNull();
  });
});

describe("los géneros que sugiere el admin", () => {
  it("ninguno es de los que la cartelera esconde", () => {
    // Si una sugerencia cayera en la lista de "no aporta nada", el admin la
    // elegiría del desplegable y el chip no saldría, sin nada que se lo
    // explique. Ofrecer un valor que después se descarta es mentirle sobre
    // lo que va a pasar.
    for (const genero of GENEROS_SUGERIDOS) {
      expect(generoVisible(genero)).toBe(genero);
    }
  });
});
