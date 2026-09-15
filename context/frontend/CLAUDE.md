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
`apps/web/scripts/copiar-worker-maplibre.mjs` + `setWorkerUrl()`.

Si vuelve a verse en negro, **el primer paso es `npm run capturas`, no
diagnosticar**: el 2026-09-07 el mapa estaba sano y parecía roto porque se lo
miraba en una pestaña oculta. Y ojo con la señal que lo delató en su día —"no
pide ni una tesela"—, porque **desde el navegador no se puede leer**: las
teselas las pide el worker y esas peticiones no aparecen en el panel de red de
la extensión, ni siquiera cuando todo funciona. Detalle en
`context/frontend/trampas.md`.

**El mapa muestra todas las salas publicadas, tengan o no algo anunciado**
(2026-09-15, pedido de Juan). Antes descartaba la que no tuviera eventos
próximos, con el argumento de que no aporta a un mapa de escena activa; el
efecto real era que **mostraba 11 de 20** y las otras nueve no salían en ningún
lado —ni como pin ni en "sin ubicar"— porque el descarte ocurría antes de mirar
la coordenada. El criterio que queda: **el mapa es de salas, no de fechas.** Que
una sala esté vacía esta semana es información, no motivo para borrarla de la
ciudad.

La sin nada anunciado lleva el mismo pin **atenuado**, y su panel lo dice. Si
fuera idéntico, tocarla y encontrar el panel vacío se sentiría roto.

**El conteo cuenta dos cosas distintas y no es un error**: las salas son todas
las publicadas y los eventos solo los vigentes, así que hay salas que no aportan
ninguno. Y `getEscena` suma conciertos, fiestas y festivales en un solo número
mientras la cartelera los separa en tres pestañas, a propósito: una sala con
fiesta está tan activa como una con concierto. Un evento sin fecha no pasa el
filtro de `starts_at >= hoy`, así que el mapa nunca lo muestra; la cartelera sí
puede, porque tiene dónde ponerlo. Efecto lateral aceptado: el mapa no avisa que
una sala tiene eventos sin fecha.

**Una sala sin coordenada se lista bajo el mapa como "sin ubicar"**, no se le
pone un pin aproximado.

## El directorio y la rockola

`/directorio` lista a los artistas y `/artista/[slug]` es su ficha, con forma de
contratapa de LP. La bandeja que suena es `components/rockola/Tornamesa.tsx`.

- ⚠️ **El reproductor vive en el layout raíz, no en una página.** Es lo que hace
  que la música siga sonando al recorrer el mapa y la cartelera. Montado dentro
  de una página, cambiar de ruta corta la canción.
- ⚠️ **Pero la cola no se guarda en ningún lado.** Vive en memoria: recorrer el
  sitio la conserva —el proveedor no se vuelve a montar—, y recargar o cerrar
  se la lleva, como apagar una rockola de bar. Se intentaron las dos formas de
  guardarla y las dos estaban mal: en `localStorage` la cola era del sitio
  entero y aparecía en cada pestaña nueva; en `sessionStorage` el alcance era
  correcto pero la bandeja resucitaba sola tras un F5. **El tema sí se guarda**,
  y ese contraste es la regla: *una preferencia es del lector; una sesión de
  escucha es de acá y de ahora.*
- **El reproductor de YouTube se ve, y no es una decisión de diseño.** Sus
  políticas exigen 200 px de lado como mínimo y prohíben taparlo con nada,
  atribución incluida. Los controles propios van **al lado**, que sí está
  permitido. Ese mínimo se fija dentro del componente que lo embebe, nunca del
  lado de quien lo usa.
- **La cola es de lo que se puede encadenar.** Solo entran plataformas que
  avisan cuando el track termina: YouTube y SoundCloud. Bandcamp tiene la mejor
  cobertura de esta escena y **ningún control por JavaScript**, así que va en la
  ficha como el disco completo. Por eso el track guarda `plataforma` +
  `id_externo` y no un id de una plataforma concreta.
- ⚠️ **Un nodo que va a manejar una librería externa no puede ser un nodo de
  React.** `YT.Player` no monta dentro del elemento que recibe: lo reemplaza. Y
  al cederlo se cede también su estilo, así que el tamaño hay que devolvérselo
  por la API de la librería o por una regla de CSS que no dependa de clases. Las
  dos mitades de esa lección costaron un bug cada una, y **ninguna daba error en
  consola**.
- **La rockola se emula por comportamiento, no por estética.** Se encola en vez
  de reemplazar, la cola se ve, el cambio de track es un relevo y el disco gira
  solo mientras suena — atada al estado, esa rotación es un indicador; suelta,
  es decoración. Nada de mueble, madera ni neón.

## Compartir un enlace

Lo que se ve al pegar una dirección del sitio en un chat. Para una plataforma
que existe para promover toques **es el caso de uso principal**, no un detalle
de SEO.

Todo sale de `src/lib/sitio.ts`: la URL pública, el nombre del sitio y
`metadatosDePagina`, que arma a la vez el título de la pestaña y el bloque de
compartir.

- ⚠️ **Ninguna página escribe su `openGraph` a mano, y no es estilo.** Next
  mezcla los metadatos en un solo nivel, así que una página que se lo salte
  comparte con el título del sitio en vez del suyo, **sin que se note mirando**
  (`context/frontend/trampas.md`). Un test recorre las páginas y falla si una
  nueva no usa el helper.
- **La imagen es el afiche o la foto del artista, y sin ellos no hay imagen.**
  Una de relleno afirmaría que el toque tiene afiche. No pasa por `next/image`,
  así que su host **no** necesita estar en `remotePatterns`: la descarga el
  chat de quien recibe el enlace, no nuestro servidor.
- **El sitio entero no tiene imagen de compartir**, porque tendría que llevar
  la marca y el nombre definitivo todavía no existe
  (`context/look-and-feel/CLAUDE.md`).
- **`/admin` se mantiene fuera de Google con `noindex`, no con el
  `robots.txt`.** Lo que sirve es que la página lo diga, y para leerlo el
  buscador tiene que poder entrar: bloquearla haría lo contrario de lo que se
  busca.
- **El sitemap solo lista lo que hoy está en cartelera**, y se poda solo porque
  sale de las mismas consultas que la arman. **Sin `lastModified`**: la base no
  guarda cuándo se editó cada ficha, y `starts_at` es la fecha del show.

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

### La excepción: las fotos de sala van `unoptimized`

Los afiches llegan de un puñado de fuentes conocidas y por eso la lista blanca
funciona con ellos. **Las fotos de sala no**: las pega Juan a mano en `/admin`,
una por una, desde el sitio de cada sala o su Instagram, así que el host es
distinto casi siempre y no se puede anticipar. Con la lista blanca, cada foto
nueva costaría editar `next.config.ts` y volver a desplegar — y hasta entonces
la página del mapa **se cae**, no se degrada.

Por eso la foto de sala se dibuja con `unoptimized`, que **saltea el
optimizador y con él la lista blanca**. Verificado llamando, no leyendo la
documentación: con una URL de un host que no está en la lista, la página
responde **200 con `unoptimized` y 500 sin él**, y el `src` que sale al HTML es
la URL de origen tal cual, sin pasar por `/_next/image`.

⚠️ **Y eso no abre el agujero que la lista blanca cierra**: el riesgo era que
nuestro servidor descargue y sirva cualquier URL. Acá no descarga nada — la
imagen la pide el navegador de quien mira, directo al sitio de la sala. El
costo es el otro: la foto se sirve sin optimizar y **depende de que ese sitio
la siga publicando**. Por eso el campo de `/admin` tiene vista previa: una URL
que no carga se ve antes de guardarla, no cuando alguien abre el mapa.

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
- `context/frontend/rockola.md` — por qué se eligieron esos dos reproductores
  y no otros, y el relato de las dos trampas mudas que costaron.
- `context/look-and-feel/CLAUDE.md` — **leer antes de tocar `globals.css`,
  `layout.tsx` o cualquier componente de UI.**
