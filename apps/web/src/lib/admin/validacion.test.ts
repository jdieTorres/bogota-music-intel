import { describe, expect, it } from "vitest";

import { faltaParaGuardar, faltaParaPublicar } from "@/lib/admin/validacion";

const completo = { nombre: "El Kalvo", evidencia: "https://instagram.com/elkalvo" };

describe("faltaParaPublicar", () => {
  it("sin evidencia no se publica, y lo dice en cristiano", () => {
    // La base lo rechaza con `artista_publicado_necesita_evidencia`, que es
    // lo que se veía antes arriba de la página: cierto, inútil y lejos del
    // campo que hay que llenar.
    const falta = faltaParaPublicar({ ...completo, evidencia: null });

    expect(falta?.campo).toBe("evidencia");
    expect(falta?.mensaje).toMatch(/evidencia/i);
    expect(falta?.mensaje).not.toMatch(/constraint|violates|null value/i);
  });

  it("la evidencia en blanco cuenta como que falta", () => {
    // La restricción usa btrim: unos espacios no la satisfacen, y dejar que
    // la base lo descubra devuelve el mismo error ilegible.
    expect(faltaParaPublicar({ ...completo, evidencia: "   " })?.campo).toBe("evidencia");
  });

  it("sin nombre tampoco", () => {
    expect(faltaParaPublicar({ ...completo, nombre: "" })?.campo).toBe("nombre");
  });

  it("el nombre se reclama antes que la evidencia", () => {
    // Se lleva a un solo campo, así que se lleva al primero que falta y en el
    // orden en que están en pantalla.
    expect(faltaParaPublicar({ nombre: "", evidencia: null })?.campo).toBe("nombre");
  });

  it("completo no falta nada", () => {
    expect(faltaParaPublicar(completo)).toBeNull();
  });
});

describe("faltaParaGuardar", () => {
  it("un borrador se guarda a medias, que es para lo que existe", () => {
    // Guardar no es publicar: la ficha se escribe en varias pasadas y exigir
    // evidencia para guardar obligaría a inventarla para no perder lo escrito.
    expect(faltaParaGuardar({ nombre: "El Kalvo", evidencia: null })).toBeNull();
  });

  it("pero sin nombre no hay nada que guardar", () => {
    expect(faltaParaGuardar({ nombre: "  ", evidencia: null })?.campo).toBe("nombre");
  });
});
