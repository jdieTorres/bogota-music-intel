/**
 * Captura las pantallas públicas en los dos modos, para revisar look & feel.
 *
 * Por qué existe, y no es solo comodidad: hasta el 2026-09-07 la única forma
 * de mirar el sitio en un navegador de verdad era la automatización sobre el
 * Chrome de Juan, y ahí **la pestaña suele estar oculta**. Chrome no le da
 * frames de `requestAnimationFrame` a una pestaña oculta, así que el mapa no
 * renderiza y parece roto sin estarlo — eso ya costó un pendiente en rojo por
 * un bug que no existía. Chromium headless siempre renderiza, así que estas
 * capturas no mienten sobre el canvas.
 *
 * Uso:
 *   npm run dev          (en otra terminal)
 *   npm run capturas
 *
 * Deja los PNG en `capturas/`, que está en .gitignore.
 */
import { chromium } from "@playwright/test";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.BMI_CAPTURAS_URL ?? "http://localhost:3000";
const DESTINO = join(import.meta.dirname, "..", "capturas");

const PANTALLAS = [
  { nombre: "cartelera", ruta: "/" },
  { nombre: "fiestas", ruta: "/fiestas" },
  { nombre: "festivales", ruta: "/festivales" },
  { nombre: "mapa", ruta: "/mapa" },
];

const MODOS = ["claro", "oscuro"];

// 1280 es el ancho donde se decide el diseño de escritorio; 390 es un iPhone
// de los comunes. Las dos, porque el sitio se abre sobre todo en el celular
// pero se diseña en el monitor, y es justo ahí donde se cuelan los errores.
const VISTAS = [
  { nombre: "escritorio", ancho: 1280, alto: 900 },
  { nombre: "movil", ancho: 390, alto: 844 },
];

/** El detalle de evento necesita un id real, y sale de la propia cartelera. */
async function primerEvento(pagina) {
  await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const href = await pagina
    .locator('a[href^="/evento/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  return href;
}

const navegador = await chromium.launch();
await rm(DESTINO, { recursive: true, force: true });
await mkdir(DESTINO, { recursive: true });

let capturadas = 0;

for (const vista of VISTAS) {
  for (const modo of MODOS) {
    const contexto = await navegador.newContext({
      viewport: { width: vista.ancho, height: vista.alto },
      deviceScaleFactor: 2,
      locale: "es-CO",
      timezoneId: "America/Bogota",
      // ⚠️ El User-Agent por defecto de Playwright dice "HeadlessChrome", y
      // hay sitios que con eso responden 403 con una página HTML donde
      // debería ir una imagen. Pasa hoy con la foto de Movistar Arena: se ve
      // perfecta en un navegador de verdad y salía rota en estas capturas.
      //
      // Las fotos de sala son URLs de sitios ajenos que pega Juan a mano, así
      // que este caso no es raro: es el esperable. Sin esta línea, la
      // herramienta que existe para que el sitio no "parezca roto sin estarlo"
      // era justamente la que lo hacía parecer roto.
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    });

    // El modo se fija antes de que corra nada de la página, igual que hace el
    // script inline de `layout.tsx`: así se captura el modo pedido desde el
    // primer frame y no un parpadeo del otro.
    await contexto.addInitScript((valor) => {
      try {
        window.localStorage.setItem("bmi-theme", valor);
      } catch {
        // Storage bloqueado: el atributo de abajo alcanza para la captura.
      }
      document.documentElement.setAttribute("data-theme", valor);
    }, modo);

    const pagina = await contexto.newPage();

    const rutas = [...PANTALLAS];
    const evento = await primerEvento(pagina);
    if (evento) rutas.push({ nombre: "evento", ruta: evento });

    for (const { nombre, ruta } of rutas) {
      await pagina.goto(`${BASE}${ruta}`, { waitUntil: "networkidle" });

      // El mapa dibuja el canvas y los marcadores mucho antes de tener las
      // teselas: sin esperar, la captura sale con el rectángulo vacío y
      // vuelve a parecer el bug que no era.
      if (nombre === "mapa") {
        await pagina
          .waitForFunction(
            () => {
              const mapa = document.querySelector(".maplibregl-canvas");
              return Boolean(mapa) && document.visibilityState === "visible";
            },
            { timeout: 15_000 },
          )
          .catch(() => {});
        await pagina.waitForTimeout(3_000);
      }

      // Lo que se ve al abrir, que es donde se juega el look & feel.
      await pagina.screenshot({
        path: join(DESTINO, `${vista.nombre}-${modo}-${nombre}.png`),
      });
      capturadas += 1;

      // La página entera sirve para juzgar el ritmo, pero solo en
      // escritorio: la cartelera en móvil da una tira de 16.000px que al
      // abrirla se reduce a algo ilegible, así que no se genera.
      if (vista.nombre === "escritorio") {
        await pagina.screenshot({
          path: join(DESTINO, `${vista.nombre}-${modo}-${nombre}-completa.png`),
          fullPage: true,
        });
        capturadas += 1;
      }
    }

    await contexto.close();
  }
}

await navegador.close();
console.log(`capturas: ${capturadas} archivos en apps/web/capturas/`);
