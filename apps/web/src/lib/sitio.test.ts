import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { metadatosDePagina } from "@/lib/sitio";

describe("metadatosDePagina", () => {
  it("le da a la página su propio título en la tarjeta de compartir", () => {
    // El punto de que exista: una página que solo define `title` hereda el
    // `openGraph` del layout, así que el enlace compartido saldría con el
    // nombre del sitio en vez del nombre del toque. Y no se nota mirando,
    // porque la pestaña del navegador sí muestra el título correcto.
    const meta = metadatosDePagina({
      titulo: "Fiestas",
      descripcion: "Las noches y ciclos de las salas de Bogotá.",
      ruta: "/fiestas",
    });

    expect(meta.title).toBe("Fiestas");
    expect(meta.openGraph?.title).toBe("Fiestas");
    expect(meta.openGraph?.description).toBe(meta.description);
  });

  it("sin imagen no pone ninguna", () => {
    // Un evento sin afiche comparte sin imagen. Una de relleno afirmaría que
    // el toque tiene afiche, que es exactamente lo que la ficha se cuida de
    // no decir.
    const meta = metadatosDePagina({
      titulo: "Un toque sin afiche",
      descripcion: "Jueves 1 de octubre · Latino Power",
      ruta: "/evento/x",
      imagen: null,
    });

    expect(meta.openGraph).toBeDefined();
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it("la portada se queda con el título por defecto del layout", () => {
    const meta = metadatosDePagina({ descripcion: "La cartelera.", ruta: "/" });

    expect(meta.title).toBeUndefined();
    expect(meta.openGraph?.title).toBe("Cartelera de Bogotá");
  });
});

/**
 * El chequeo que avisa cuando falta una entrada.
 *
 * Olvidarse de `metadatosDePagina` en una página nueva no rompe nada
 * visible: la pestaña sale bien y el enlace compartido sale con el título
 * del sitio. Por eso lo tiene que decir un test y no una revisión a ojo.
 */
describe("las páginas que definen sus metadatos", () => {
  const APP = join(import.meta.dirname, "..", "app");

  function paginas(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
      const ruta = join(dir, entrada.name);
      if (entrada.isDirectory()) return paginas(ruta);
      return entrada.name === "page.tsx" ? [ruta] : [];
    });
  }

  it.each(paginas(APP).map((ruta) => [ruta.slice(APP.length + 1), ruta]))(
    "%s los arma con metadatosDePagina",
    (_nombre, ruta) => {
      const codigo = readFileSync(ruta, "utf8");
      const losDefine =
        codigo.includes("export const metadata") ||
        codigo.includes("generateMetadata");
      if (!losDefine) return;

      expect(codigo).toContain("metadatosDePagina");
    },
  );
});
