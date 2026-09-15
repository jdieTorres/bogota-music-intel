import { describe, expect, it } from "vitest";

import { EN_LA_CARTELERA, encabezado, encabezadoEnTexto } from "@/lib/encabezado";

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
