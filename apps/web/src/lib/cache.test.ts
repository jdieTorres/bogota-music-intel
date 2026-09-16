import { readFileSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { REVALIDAR_SEGUNDOS, RUTAS_CON_REVALIDATE } from "@/lib/cache";

/**
 * Lo que sostiene la duplicación que Next obliga a tener.
 *
 * `export const revalidate` tiene que ser un literal en cada ruta —la
 * constante no se puede importar, ver `cache.ts`—, así que el mismo número
 * está escrito ocho veces. **Eso solo es aceptable si algo avisa cuando una
 * copia se desvía**, que es la lección de `inicioDeHoyEnBogota()`: estuvo
 * copiada cuatro veces y solo una tenía test, y la advertencia se cumplió al
 * revés sin que nadie se enterara.
 */

const declarado = (ruta: string): number | null => {
  const m = readFileSync(ruta, "utf8").match(/^export const revalidate = (\d+);$/m);
  return m ? Number(m[1]) : null;
};

describe("el revalidate de las rutas", () => {
  it.each(RUTAS_CON_REVALIDATE)("%s usa el valor acordado", (ruta) => {
    expect(declarado(ruta)).toBe(REVALIDAR_SEGUNDOS);
  });

  it("no hay ninguna ruta que lo declare y se haya quedado fuera de la lista", () => {
    // ⚠️ El chequeo de arriba solo mira las rutas que alguien acordó anotar.
    // Una ruta nueva que declare `revalidate` y no esté en la lista no la
    // cubriría nadie — que es justamente la forma en que una lista a mano se
    // queda corta en silencio.
    // `readdirSync` recursivo y no `globSync`: el segundo existe en Node 22
    // pero no está en los tipos, y un `any` acá dejaría pasar justo los
    // errores que este test busca.
    const todas = readdirSync("src/app", { recursive: true, encoding: "utf8" })
      .map((p) => `src/app/${p.replaceAll("\\", "/")}`)
      .filter((p) => /\/(page\.tsx|sitemap\.ts|route\.ts)$/.test(p));
    const declaran = todas.filter((p) => declarado(p) !== null);
    const sinVigilar = declaran.filter((p) => !RUTAS_CON_REVALIDATE.includes(p));

    expect(sinVigilar).toEqual([]);
  });

  it("la lista no nombra rutas que ya no existen o dejaron de declararlo", () => {
    // El reverso: una ruta borrada o que pasó a dinámica dejaría el test de
    // arriba fallando con un mensaje confuso sobre un archivo que no está.
    const fantasmas = RUTAS_CON_REVALIDATE.filter((p) => {
      try {
        return declarado(p) === null;
      } catch {
        return true;
      }
    });

    expect(fantasmas).toEqual([]);
  });
});
