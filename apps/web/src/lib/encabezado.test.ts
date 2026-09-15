import { describe, expect, it } from "vitest";

import {
  EN_LA_CARTELERA,
  encabezado,
  encabezadoEnTexto,
  desestructurarTitulo,
  tituloDesde,
  trozosConEnlaces,
} from "@/lib/encabezado";

const toque = (artistas: string[], gira: string | null = null, title = "lo que sea") => ({
  title,
  artistas,
  gira,
});

describe("encabezado", () => {
  it("compone la lista cuando hay varias bandas", () => {
    const piezas = encabezado(toque(["Mukangu", "Atake Mapalé", "Los Yoryis"]));
    expect(piezas?.artistas).toEqual(["Mukangu", "Atake Mapalé", "Los Yoryis"]);
    expect(piezas?.ocultos).toBe(0);
  });

  it("devuelve null con un solo artista, para que se muestre el título", () => {
    // Con un nombre el título ya dice exactamente eso, y componerlo de nuevo
    // abriría la puerta a que el título editado a mano y la lista difieran.
    expect(encabezado(toque(["Akriila"], null, "Akriila | Tour Lucy"))).toBeNull();
  });

  it("devuelve null en una fiesta, que no tiene cartel", () => {
    expect(encabezado(toque([], null, "Noches Bomm"))).toBeNull();
  });

  it("corta al tope y dice cuántos quedaron fuera", () => {
    const piezas = encabezado(toque(["A", "B", "C", "D", "E"]), EN_LA_CARTELERA);
    expect(piezas?.artistas).toEqual(["A", "B", "C"]);
    expect(piezas?.ocultos).toBe(2);
  });

  it("no inventa ocultos cuando caben todos", () => {
    expect(encabezado(toque(["A", "B"]), EN_LA_CARTELERA)?.ocultos).toBe(0);
  });
});

describe("encabezadoEnTexto", () => {
  it("escribe la lista con el mismo separador que la pantalla", () => {
    // ⚠️ Lo que se comparte por WhatsApp tiene que decir lo mismo que la
    // página. Si esto devolviera `title`, la tarjeta llegaría con el "&"
    // encadenado que la web ya no muestra.
    expect(encabezadoEnTexto(toque(["Mukangu", "Atake Mapalé"]))).toBe(
      "Mukangu · Atake Mapalé",
    );
  });

  it("conserva la gira", () => {
    expect(
      encabezadoEnTexto(toque(["Sara Curruchich", "Humazapas"], "Festival Orígenes")),
    ).toBe("Sara Curruchich · Humazapas | Festival Orígenes");
  });

  it("cae al título cuando no hay cartel que componer", () => {
    expect(encabezadoEnTexto(toque([], null, "Rock al Parque 2026"))).toBe(
      "Rock al Parque 2026",
    );
  });

  it("no corta: una tarjeta de compartir no tiene una fila que respetar", () => {
    expect(encabezadoEnTexto(toque(["A", "B", "C", "D", "E"]))).toBe("A · B · C · D · E");
  });
});

describe("tituloDesde", () => {
  it("con un solo artista es su nombre", () => {
    expect(tituloDesde(["Akriila"], null)).toBe("Akriila");
  });

  it("le pega la gira detrás de la barra", () => {
    expect(tituloDesde(["Akriila"], "Tour Lucy")).toBe("Akriila | Tour Lucy");
  });

  it("une varios con el mismo separador que la ingesta", () => {
    // " & " y no " · ": así un evento cargado a mano y uno del cron se guardan
    // igual. El punto medio lo pone la pantalla.
    expect(tituloDesde(["Mukangu", "Atake Mapalé"], null)).toBe(
      "Mukangu & Atake Mapalé",
    );
  });

  it("gira vacía es lo mismo que sin gira", () => {
    expect(tituloDesde(["Akriila"], "")).toBe("Akriila");
    expect(tituloDesde(["Akriila"], "   ")).toBe("Akriila");
  });

  it("limpia los espacios de cada nombre y descarta los vacíos", () => {
    expect(tituloDesde([" Mukangu ", "", "  "], null)).toBe("Mukangu");
  });
});

describe("desestructurarTitulo", () => {
  it("separa el cartel de la gira", () => {
    expect(desestructurarTitulo("Mukangu & Atake Mapalé | Gira")).toEqual({
      artistas: ["Mukangu", "Atake Mapalé"],
      gira: "Gira",
    });
  });

  it("sin barra, todo es cartel", () => {
    expect(desestructurarTitulo("Akriila")).toEqual({
      artistas: ["Akriila"],
      gira: null,
    });
  });

  it("es reversible con tituloDesde en el caso normal", () => {
    const original = "Todos Tus Muertos & Rey Gordiflón | Tour";
    const { artistas, gira } = desestructurarTitulo(original);
    expect(tituloDesde(artistas, gira)).toBe(original);
  });

  it("⚠️ parte mal al artista que lleva '&' en su propio nombre", () => {
    // Queda escrito porque es el límite conocido y no un descuido:
    // «Carlos Vives & La Provincia» está curado como UN artista, con
    // evidencia, y acá salen dos. Se acepta solo porque el destino es un
    // formulario que una persona revisa antes de guardar — en la ingesta
    // sería inaceptable. El título recompuesto sí vuelve a ser el mismo.
    const original = "Carlos Vives & La Provincia | Tour al Sol";
    const { artistas, gira } = desestructurarTitulo(original);
    expect(artistas).toEqual(["Carlos Vives", "La Provincia"]);
    expect(tituloDesde(artistas, gira)).toBe(original);
  });

  it("una gira con barra adentro no se pierde", () => {
    expect(desestructurarTitulo("X | Gira | 2026").gira).toBe("Gira | 2026");
  });
});

describe("trozosConEnlaces", () => {
  const kalvo = { nombre: "El Kalvo", slug: "el-kalvo" };
  const mapale = { nombre: "Atake Mapalé", slug: "atake-mapale" };

  it("enlaza el nombre cuando es todo el título", () => {
    expect(trozosConEnlaces("El Kalvo", [kalvo])).toEqual([
      { texto: "El Kalvo", slug: "el-kalvo" },
    ]);
  });

  it("deja fuera del enlace lo que no es el nombre", () => {
    expect(trozosConEnlaces("El Kalvo | Gira", [kalvo])).toEqual([
      { texto: "El Kalvo", slug: "el-kalvo" },
      { texto: " | Gira" },
    ]);
  });

  it("compara sin tildes: la fuente y la ficha no las escriben igual", () => {
    expect(trozosConEnlaces("Atake Mapale", [mapale])).toEqual([
      { texto: "Atake Mapale", slug: "atake-mapale" },
    ]);
  });

  it("sin fichas devuelve el texto entero, sin enlaces", () => {
    expect(trozosConEnlaces("Rock al Parque 2026", [])).toEqual([
      { texto: "Rock al Parque 2026" },
    ]);
  });

  it("no enlaza a quien no aparece", () => {
    expect(trozosConEnlaces("Otra Banda", [kalvo])).toEqual([
      { texto: "Otra Banda" },
    ]);
  });

  it("enlaza varios nombres en el mismo texto", () => {
    const trozos = trozosConEnlaces("El Kalvo · Atake Mapalé", [kalvo, mapale]);
    expect(trozos.filter((t) => t.slug).map((t) => t.slug)).toEqual([
      "el-kalvo",
      "atake-mapale",
    ]);
  });

  it("el nombre más largo gana la coincidencia", () => {
    // Sin ordenar por largo, "La Muchacha" se comería el enlace de
    // "La Muchacha y su Banda" y el enlace llevaría a la ficha equivocada.
    const corta = { nombre: "La Muchacha", slug: "la-muchacha" };
    const larga = { nombre: "La Muchacha y su Banda", slug: "muchacha-banda" };
    expect(trozosConEnlaces("La Muchacha y su Banda", [corta, larga])).toEqual([
      { texto: "La Muchacha y su Banda", slug: "muchacha-banda" },
    ]);
  });

  it("cada ficha enlaza una sola vez", () => {
    const trozos = trozosConEnlaces("El Kalvo y El Kalvo", [kalvo]);
    expect(trozos.filter((t) => t.slug)).toHaveLength(1);
  });
});
