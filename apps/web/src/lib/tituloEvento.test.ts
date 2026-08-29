import { describe, expect, it } from "vitest";

import { partirArtistaYGira, tituloCaso, tituloParaMostrar } from "@/lib/tituloEvento";

describe("tituloCaso", () => {
  it("capitaliza cada palabra y deja conectores en minúscula", () => {
    expect(tituloCaso("FIESTA DE LA SALSA")).toBe("Fiesta de la Salsa");
    expect(tituloCaso("el plan de la mariposa")).toBe("El Plan de la Mariposa");
  });

  it("capitaliza el conector cuando abre el título", () => {
    expect(tituloCaso("la muchacha en bogotá")).toBe("La Muchacha en Bogotá");
  });

  it("conserva números y no rompe con acentos", () => {
    expect(tituloCaso("10 AÑOS Y NO AZARAN")).toBe("10 Años y No Azaran");
  });

  it("colapsa espacios repetidos", () => {
    expect(tituloCaso("ROBBIE   WILLIAMS")).toBe("Robbie Williams");
  });
});

describe("partirArtistaYGira", () => {
  it("separa por barra vertical", () => {
    expect(partirArtistaYGira("ROBBIE WILLIAMS | BRITPOP")).toEqual({
      artista: "ROBBIE WILLIAMS",
      gira: "BRITPOP",
    });
  });

  it("separa por guion con espacios alrededor", () => {
    expect(partirArtistaYGira("AKRIILA - TOUR LUCY")).toEqual({
      artista: "AKRIILA",
      gira: "TOUR LUCY",
    });
  });

  it("no separa un guion pegado al nombre (Jay-Z)", () => {
    expect(partirArtistaYGira("JAY-Z EN BOGOTÁ")).toEqual({
      artista: "JAY-Z EN BOGOTÁ",
      gira: null,
    });
  });

  it("no separa por barra diagonal (podría ser parte del nombre)", () => {
    expect(partirArtistaYGira("AC/DC EN BOGOTÁ")).toEqual({
      artista: "AC/DC EN BOGOTÁ",
      gira: null,
    });
  });

  it("sin separador, todo el título es el artista", () => {
    expect(partirArtistaYGira("Los Mirlos")).toEqual({
      artista: "Los Mirlos",
      gira: null,
    });
  });

  it("un separador al borde no inventa un lado vacío", () => {
    expect(partirArtistaYGira("ROBBIE WILLIAMS |")).toEqual({
      artista: "ROBBIE WILLIAMS |",
      gira: null,
    });
  });
});

describe("tituloParaMostrar", () => {
  it("concierto con gira: artista | gira, cada uno en su formato", () => {
    expect(
      tituloParaMostrar({ title: "ROBBIE WILLIAMS | BRITPOP", event_type: "music" }),
    ).toBe("Robbie Williams | Britpop");
  });

  it("concierto sin gira: solo el artista, sin barra colgando", () => {
    expect(tituloParaMostrar({ title: "EL KALVO", event_type: "music" })).toBe(
      "El Kalvo",
    );
  });

  it("evento sin clasificar todavía se trata como concierto", () => {
    expect(tituloParaMostrar({ title: "EL KALVO", event_type: null })).toBe(
      "El Kalvo",
    );
  });

  it("fiesta: el nombre completo en el mismo formato, sin partir artista/gira", () => {
    expect(
      tituloParaMostrar({ title: "NOCHES BOMM VOL. 5", event_type: "fiesta" }),
    ).toBe("Noches Bomm Vol. 5");
  });
});
