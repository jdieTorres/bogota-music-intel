/**
 * Copia el worker de MapLibre a `public/maplibre/` para que el navegador pueda
 * pedirlo por URL.
 *
 * Por qué hace falta: maplibre-gl 6 dejó de inlinear el worker como blob y ahora
 * lo resuelve con `new URL('./maplibre-gl-worker.mjs', import.meta.url)`. Su
 * código descarta el resultado si `import.meta.url` no empieza por http(s):
 *
 *     let e = import.meta.url;
 *     if (!/^https?:/.test(e)) return ``;      // <- Turbopack cae aquí
 *
 * Bajo Turbopack (dev y build) `import.meta.url` no es una URL http, así que
 * MapLibre se queda sin worker y **falla en silencio**: el canvas, los
 * marcadores y los controles se dibujan, pero las teselas vectoriales nunca se
 * piden y el mapa queda en negro. Sin excepción ni advertencia en consola.
 *
 * Se copian los archivos en vez de comitearlos para que no se desincronicen de
 * la versión instalada de maplibre-gl. `public/maplibre/` está en .gitignore.
 */
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl.mjs"));
const destino = join(import.meta.dirname, "..", "public", "maplibre");

// El worker importa `./maplibre-gl-shared.mjs` como hermano, así que los dos
// tienen que quedar en la misma carpeta.
const ARCHIVOS = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

await mkdir(destino, { recursive: true });

for (const archivo of ARCHIVOS) {
  const origen = join(dist, archivo);
  // Los .map pesan varios MB y no se copian; sin quitar la referencia, las
  // devtools piden un archivo que no existe.
  const codigo = (await readFile(origen, "utf8")).replace(
    /\n?\/\/# sourceMappingURL=.*$/,
    "\n",
  );
  await writeFile(join(destino, archivo), codigo, "utf8");
}

// Deja constancia de para qué versión se copió, por si algo se desalinea.
const { version } = require("maplibre-gl/package.json");
await writeFile(
  join(destino, "VERSION"),
  `maplibre-gl ${version}\nGenerado por scripts/copiar-worker-maplibre.mjs — no editar a mano.\n`,
  "utf8",
);

console.log(`maplibre: worker copiado a public/maplibre/ (v${version})`);
