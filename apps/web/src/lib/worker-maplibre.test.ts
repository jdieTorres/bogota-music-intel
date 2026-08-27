import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regresión de un fallo silencioso: si el worker de MapLibre no está donde
 * `MapaEscena` lo busca, el mapa se dibuja completo — canvas, marcadores,
 * controles, atribución — pero nunca pide una tesela y queda en negro, sin
 * error en consola. Nada más lo detecta hasta abrirlo en el navegador.
 *
 * Los archivos los deja `scripts/copiar-worker-maplibre.mjs`, enganchado a
 * `pretest`, `predev` y `prebuild`.
 */

const raiz = join(import.meta.dirname, "..", "..");
const publico = join(raiz, "public");

function rutaDeclaradaEnElComponente(): string {
  const fuente = readFileSync(
    join(raiz, "src", "components", "MapaEscena.tsx"),
    "utf8",
  );
  const encontrada = /setWorkerUrl\(\s*"([^"]+)"\s*\)/.exec(fuente);
  if (!encontrada) throw new Error("MapaEscena ya no llama a setWorkerUrl()");
  return encontrada[1];
}

describe("worker de maplibre", () => {
  it("el archivo que declara el componente existe en public/", () => {
    const ruta = rutaDeclaradaEnElComponente();
    expect(existsSync(join(publico, ruta))).toBe(true);
  });

  it("el worker encuentra el chunk hermano que importa", () => {
    const ruta = rutaDeclaradaEnElComponente();
    const worker = readFileSync(join(publico, ruta), "utf8");

    // El worker es un módulo ES: importa `./maplibre-gl-shared.mjs` relativo a
    // su propia URL, así que los dos tienen que quedar en la misma carpeta.
    const hermanos = [...worker.matchAll(/from"(\.\/[^"]+)"/g)].map((m) => m[1]);
    expect(hermanos.length).toBeGreaterThan(0);

    const carpeta = join(publico, ruta, "..");
    for (const hermano of hermanos) {
      expect(existsSync(join(carpeta, hermano))).toBe(true);
    }
  });

  it("la copia corresponde a la versión instalada de maplibre-gl", async () => {
    const instalada = (
      await import("maplibre-gl/package.json", { with: { type: "json" } })
    ).default.version;
    const sello = readFileSync(join(publico, "maplibre", "VERSION"), "utf8");
    expect(sello).toContain(instalada);
  });
});
