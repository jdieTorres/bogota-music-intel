import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * La tabla de la paleta no se desfasa en silencio.
 *
 * `context/look-and-feel/CLAUDE.md` trae la paleta en una tabla, y esa tabla
 * es una segunda copia de lo que declara `globals.css`. Una copia a mano
 * falla de la peor manera posible: **equivocada se ve igual que correcta**.
 * No rompe el sitio, no da error, solo miente cuando alguien la consulta.
 *
 * Ya pasó dos veces el mismo día. `context/look-and-feel/tokens.css` era una
 * tercera copia y estuvo nueve días mostrando la paleta de Verde Neón, que el
 * rediseño del 2026-09-07 había reemplazado entera; se borró el 2026-09-16
 * en vez de sincronizarla, porque una copia que hay que acordarse de
 * sincronizar se vuelve a desincronizar. Y esa misma tarde, al pasar el modo
 * oscuro a ser el defecto, esta tabla estuvo un rato con el encabezado
 * cambiado y los valores en la columna de antes — que es justo el error que
 * una lectura rápida no ve.
 *
 * Manda `globals.css`. Si los dos difieren, lo que se actualiza es la tabla.
 */

const raiz = join(import.meta.dirname, "..", "..", "..", "..");
const GLOBALS = join(raiz, "apps", "web", "src", "app", "globals.css");
const DOC = join(raiz, "context", "look-and-feel", "CLAUDE.md");

/** Qué bloque de CSS describe cada columna de la tabla. */
const BLOQUE_DE = {
  oscuro: ":root",
  claro: ':root[data-theme="claro"]',
} as const;

/**
 * Los tokens que la tabla no lista, y no es un olvido:
 *
 * - `--popup-surface` es del mapa, que no cambia con el toggle. Tiene su
 *   propia sección en el documento.
 * - `--grano-opacidad` no es un color y no se mide como tal.
 */
const FUERA_DE_LA_TABLA = ["--popup-surface", "--grano-opacidad"];

function sinComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Las custom properties de un bloque, por selector exacto.
 *
 * El selector se busca tal cual y no con una expresión laxa: `globals.css`
 * tiene además un `@theme inline` con los alias de color y de tipografía de
 * Tailwind, que no son la paleta.
 */
function tokensDelBloque(css: string, selector: string): Map<string, string> {
  const limpio = sinComentarios(css);
  const inicio = limpio.indexOf(`${selector} {`);
  if (inicio === -1) throw new Error(`globals.css ya no tiene \`${selector}\``);

  const cuerpo = limpio.slice(inicio + selector.length + 2, limpio.indexOf("}", inicio));

  const tokens = new Map<string, string>();
  for (const [, nombre, valor] of cuerpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (FUERA_DE_LA_TABLA.includes(nombre)) continue;
    tokens.set(nombre, valor.trim().toLowerCase());
  }
  return tokens;
}

/**
 * La tabla de la paleta, leída con su encabezado.
 *
 * **Cuál columna es cuál sale del encabezado, no de la posición**, y eso es
 * la mitad del valor de este test: cambiar el encabezado sin mover los
 * valores deja una tabla que se lee perfecta y dice lo contrario de lo que
 * pasa. Es exactamente el error que se cometió el 2026-09-16.
 */
function tablaDeLaPaleta() {
  const doc = readFileSync(DOC, "utf8");

  const encabezado = /^\| Token \|([^|]+)\|([^|]+)\|/m.exec(doc);
  if (!encabezado) throw new Error("No se encuentra la tabla de la paleta");

  const titulos = [encabezado[1], encabezado[2]];
  const columnas = titulos.map((texto) =>
    /oscuro/i.test(texto) ? "oscuro" : /claro/i.test(texto) ? "claro" : null,
  );

  const tabla = { oscuro: new Map<string, string>(), claro: new Map<string, string>() };
  const fila = /^\|\s*`(--[\w-]+)`[^|]*\|\s*`(#[0-9a-fA-F]{3,8})`\s*\|\s*`(#[0-9a-fA-F]{3,8})`\s*\|/gm;

  for (const [, token, primera, segunda] of doc.matchAll(fila)) {
    const valores = [primera, segunda];
    columnas.forEach((modo, i) => {
      if (modo) tabla[modo].set(token, valores[i].toLowerCase());
    });
  }

  // Cuál columna dice ser la del modo por defecto. Es una afirmación del
  // documento sobre el sitio, y tiene que coincidir con qué paleta está en
  // `:root` — que es, por definición, la que se pinta sin que nadie elija.
  const porDefecto = columnas[titulos.findIndex((t) => /por defecto/i.test(t))];

  return { tabla, columnas, porDefecto };
}

describe("la tabla de la paleta", () => {
  const globals = readFileSync(GLOBALS, "utf8");
  const { tabla, columnas, porDefecto } = tablaDeLaPaleta();

  it("el encabezado dice de qué modo es cada columna", () => {
    // Sin orden: que la tabla ponga primero el claro o el oscuro es una
    // decisión de redacción. Lo que no puede pasar es que una columna no
    // diga de qué modo habla, porque entonces lo único que la identifica es
    // su posición — y la posición es lo que se cambia sin querer.
    expect([...columnas].sort()).toEqual(["claro", "oscuro"]);
  });

  it("la columna marcada «por defecto» es la que declara `:root`", () => {
    // El error de un rato antes: se cambió el encabezado y los valores se
    // quedaron donde estaban. La tabla se lee perfecta y afirma lo contrario
    // de lo que hace el sitio.
    const modoDeRoot = (Object.keys(BLOQUE_DE) as (keyof typeof BLOQUE_DE)[]).find(
      (modo) => BLOQUE_DE[modo] === ":root",
    );
    expect(porDefecto).toBe(modoDeRoot);
  });

  for (const modo of ["oscuro", "claro"] as const) {
    it(`dice los mismos valores que globals.css en ${modo}`, () => {
      // Objeto y no Map en la comparación: cuando falla, el diff de vitest
      // dice qué token se movió y a qué valor, que es la mitad útil del
      // aviso. Con dos Map dice "no son iguales" y hay que ir a mirar.
      expect(Object.fromEntries(tabla[modo])).toEqual(
        Object.fromEntries(tokensDelBloque(globals, BLOQUE_DE[modo])),
      );
    });
  }

  it("no deja fuera un color nuevo", () => {
    // El documento dice que un color que no está en la tabla es un color que
    // nadie midió — y el `--danger` que vivió como clase cruda de Tailwind
    // hasta el 2026-09-15 dio 2.60 de contraste sin que nadie lo notara. Un
    // token nuevo que no llegue a la tabla repite esa historia.
    const enLaApp = [...tokensDelBloque(globals, BLOQUE_DE.oscuro).keys()];
    expect([...tabla.oscuro.keys()].sort()).toEqual(enLaApp.sort());
  });
});
