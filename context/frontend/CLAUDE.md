# Frontend — `apps/web`

Next.js 16 (App Router, TypeScript), desplegado en Vercel. Lee Supabase
**directo** con la publishable key (RLS deja SELECT público); FastAPI queda
como capa de ingesta y base de la API pública futura, **no en el camino de
lectura**.

⚠️ **Next.js 16 cambió convenciones respecto a versiones anteriores**:
`params`/`searchParams` son Promises, existen los helpers globales
`PageProps<'/ruta'>` y `LayoutProps<'/ruta'>`, y Turbopack es el default.
Antes de escribir código de frontend, leer la guía correspondiente en
`apps/web/node_modules/next/dist/docs/` (así lo pide `apps/web/AGENTS.md`).

## Reglas

- **Verificar en un navegador de verdad, no solo en el HTML servido.** El mapa
  estuvo en negro con CI verde, tests pasando, `tsc` limpio, build correcto y
  HTML servido bien. Ninguna de esas señales lo detecta.
- **En pantalla no van nombres de archivo nuestros.** Al lector el nombre de
  un archivo del repo no le dice nada, y le pide entender cómo está hecho el
  sistema para interpretar lo que ve. La nota para quien mantiene el código va
  **en el código**. Vale para estados vacíos y mensajes de error, que es justo
  donde da la tentación de explicar de más.
- **El frontend no transforma datos editoriales.** La normalización de títulos
  y la deduplicación se mudaron a la ingesta; el criterio editorial se importa
  de `src/lib/editorial.ts`. Si aparece lógica de producto en un componente,
  está mal ubicada.
- **Nunca inventar un dato.** No mostrar "12:00 a. m." cuando la fuente solo
  publicó fecha; mostrar el hueco.

## El mapa

`/mapa` con **MapLibre GL 6 + tiles de OpenFreeMap** (sin API key ni límite de
uso). La atribución a OpenStreetMap **se agrega a mano**: el estilo no la trae.

⚠️ **Turbopack deja a MapLibre GL 6 sin su worker y el mapa queda en negro sin
un solo error en consola** (dev y build por igual). Resuelto con
`apps/web/scripts/copiar-worker-maplibre.mjs` + `setWorkerUrl()`. Si el mapa
vuelve a quedar en negro, lo primero a mirar es **si el navegador pide
teselas**, no si hay errores.

**El mapa no cuenta lo mismo que la cartelera y no es un error**: `getEscena`
filtra por `starts_at >= hoy` y suma conciertos, fiestas y festivales en un
solo número, mientras la cartelera los separa en tres pestañas. Los junta a
propósito: una sala con fiesta o con festival está tan activa como una con
concierto. Y un evento sin fecha no puede pasar ese filtro, así que el mapa
nunca lo muestra; la cartelera sí puede, porque tiene dónde ponerlo. Efecto
lateral aceptado: el mapa no avisa que una sala tiene eventos sin fecha.

**Una sala sin coordenada se lista bajo el mapa como "sin ubicar"**, no se le
pone un pin aproximado.

## El precio se escribe en lucas

240.000 se muestra como **`$240 lks`**, que es como se habla de plata acá. La
base guarda pesos enteros; la conversión es de presentación y vive en
`src/lib/precio.ts`.

- **El decimal se conserva**: 33.900 → `$33,9 lks`. Redondear a "34 lks"
  muestra un número que nadie va a pagar. Los redondos salen limpios, sin ",0".
- **Un rango lleva un solo `$` y un solo `lks`**: `$33,9 – 120 lks`. Repetirlos
  no entra en el ancho de una tarjeta.
- **Un piso sin techo dice que es un piso**: `Desde $77 lks`. Rockal Live
  publica `startingPrice`, y mostrarlo pelado afirmaría que el show cuesta eso.
- En la ficha del evento **la etiqueta es `$`**, no "Precio".

⚠️ **`Evento` no expone `price_kind`/`price_min`/`price_max`: expone `precio`,
ya escrito.** Mismo motivo que `category` — son tres campos que hay que leer
juntos para no afirmar de más, y ese razonamiento no puede estar repetido en
cada componente.

## Imágenes

`images.remotePatterns` de `apps/web/next.config.ts` es **explícita a
propósito** —el optimizador de Next descarga y sirve cualquier URL que se le
permita, así que abrirla con un comodín lo convertiría en un proxy de imágenes
para cualquiera—. `next/image` **no degrada** ante un host desconocido: lanza y
rompe la tarjeta.

Al sumar una fuente nueva **hay que agregar su host**. `moderacion_cli` compara
los hosts que llegan contra esa lista —leyéndola del propio `next.config.ts`,
para no mantener dos copias— y lo avisa en el log del cron.

## El tema claro/oscuro

`src/components/ThemeToggle.tsx` cambia `data-theme` en `<html>` y lo guarda en
`localStorage`. Por defecto arranca en claro.

- ⚠️ **Tiene que ser un `<script>` crudo en el `<head>` de `layout.tsx`, no
  `next/script`.** Next no lo emite como etiqueta ejecutable: lo encola en
  `self.__next_s` y lo corre su runtime al arrancar, así que el tema quedaba
  atado al bundle de JS y no podía aplicarse antes del primer pintado.
- El toggle lee el DOM con `useSyncExternalStore` + un `MutationObserver`
  sobre `<html>`, **sin copiar a `useState`**: el atributo es la fuente de
  verdad y no hay copia que pueda desfasarse.

## Ver también

- `context/frontend/trampas.md` — el detalle de las trampas encontradas al
  implementar el mapa y el script del tema.
- `context/look-and-feel/CLAUDE.md` — **leer antes de tocar `globals.css`,
  `layout.tsx` o cualquier componente de UI.**
