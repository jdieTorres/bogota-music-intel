# Look & feel — identidad visual

> **Leer esto antes de tocar `globals.css`, `layout.tsx` o cualquier
> componente de UI.** Los valores vivos están en `context/look-and-feel/tokens.css`
> y en `apps/web/src/app/globals.css`.

La identidad visual acordada con Juan: paleta, tipografía, estructura e
iconografía. **Lo que está acá es lo vigente**; el detalle y lo histórico
viven en los archivos de "Ver también", al final.

## De dónde viene esto

La identidad arrancó el 2026-08-27 con una primera ronda —**Verde Neón**— que
el rediseño del 2026-09-07 reemplazó entera. Las referencias que la
originaron, las 7 direcciones de paleta que se evaluaron y por qué quedó
congelada están en `context/look-and-feel/verde-neon.md`. **Leerlo solo si hay
que entender de dónde salió un color**; para trabajar hoy no hace falta.

Lo único de aquella ronda que sigue siendo una decisión viva: **claro/oscuro
es una función real del sitio**, no un token fijo
(`apps/web/src/components/ThemeToggle.tsx`).

## Segunda ronda: el rediseño del 2026-09-07

Juan pidió ir más lejos —"cercano pero profesional"— y **autorizó
explícitamente pasar por encima del brief de la primera ronda**. Lo que sigue
reemplaza a Verde Neón; el registro de cómo se llegó a Verde Neón se conserva
arriba porque explica de dónde salen los colores que sobrevivieron.

### El diagnóstico, que es lo que hay que entender

**Verde Neón usaba el verde como fondo.** La página entera era un campo de
menta saturada en claro y de verde botella en oscuro. Un color de marca
ocupando el 100% de la superficie deja de leerse como marca y pasa a leerse
como filtro, y **nada que se pose encima puede verse profesional**. Esa era
la causa raíz, no un problema de composición ni de espaciado.

La segunda causa era **Fredoka**: una geométrica redondeada de ascendentes
cortas. Daba lo "cercano" del brief original y peleaba de frente con lo
"profesional", y era la señal más fuerte de que el sitio parecía una app
juvenil.

### Paleta activa

El verde sigue siendo la identidad, pero ocupa **alrededor del 5% de la
superficie**: el suelo es papel en claro y casi negro en oscuro, los dos con
una sombra verde para no perder el ADN. El acento se gasta en el enlace, la
pestaña activa, el sello de hoy y el botón de boletería, y por eso vuelve a
gritar cuando aparece.

| Token | Claro (por defecto) | Oscuro (`[data-theme="oscuro"]`) |
|---|---|---|
| `--background` | `#f1f4ec` | `#0b0f0b` |
| `--surface` | `#fafcf7` | `#141a13` |
| `--surface-hover` | `#eaefe3` | `#1b2319` |
| `--border` | `#dbe2d3` | `#262f24` |
| `--foreground` | `#10160f` | `#eef2ea` |
| `--muted` | `#59654f` | `#94a08e` |
| `--accent` (marca) | `#12760f` | `#4ae63a` |
| `--accent-2` (dato frío) | `#0c7189` | `#4fd4ef` |
| `--accent-3` (escena local) | `#c2185b` | `#ff5fb0` |

**Los valores están medidos, no elegidos a ojo.** Toda la paleta pasa WCAG AA
en los dos modos; `--accent-2` bajó de `#0e7f9c` a `#0c7189` porque el
primero daba 4.17 sobre el papel y el género se escribe en tamaño de cuerpo.
Antes de tocar un color, volver a medirlo.

**El magenta tiene un solo trabajo y ninguno más: la marca de escena
local.** Estaba definido desde el 2026-08-28 y no lo usaba nadie.

### Tipografía

- **Bricolage Grotesque** (500/600/700/800) — titulares, `font-display`.
  Reemplaza a Fredoka. Grotesca contemporánea con irregularidades a
  propósito: tiene carácter sin perder autoridad.
- **Work Sans** — cuerpo. Se queda.
- **Caveat** — `font-hand`, y **solo dos usos en todo el sitio**: la etiqueta
  "escena en vivo" del masthead y la marca de escena local. Era la pieza que
  más rápido se volvía decorativa.
- **Geist Mono** — datos tabulares (hora, precio, conteos).

### Las decisiones de estructura

- **El riel de fechas.** La fecha dejó de ser un encabezado pegajoso encima de
  una pila de tarjetas y pasó a ser la columna izquierda de cada día. Uno
  viene a ver qué hay el sábado, no a leer de arriba abajo; en columna se
  barre con la vista sin leer. Es la estructura de una cartelera impresa, y
  es lo que separa esto de una lista de resultados.
- **Filas con filete, no tarjetas.** La tarjeta con borde y esquinas
  redondeadas hacía que cada toque leyera como un widget suelto.
- **Casi nada tiene esquinas redondeadas.** `rounded-sm` para afiches y
  bloques; `rounded-full` solo para lo que de verdad es pastilla.
- **El afiche va sin fondo.** Llegan en proporciones distintas de cada fuente,
  y una caja clara detrás de uno vertical se ve como un recuadro roto.
  `object-contain` siempre: recortar por el centro se come el nombre del
  artista y la fecha.
- **El hueco se dice en voz alta.** "Por confirmar" sonaba a que el dato viene
  en camino; casi nunca es así. Ahora dice "La fuente no publicó hora", que
  además le indica al lector dónde buscarlo.

### Qué se descartó de la primera ronda

El **trazo a mano bajo los titulares** llegó a existir el 2026-09-07 por la
mañana y salió esa misma tarde: era el elemento más decorativo de la página y
el que más peleaba con lo profesional.

El **chip punteado estilo boleta** también salió, y **volvió** el mismo día
porque a Juan le gustaba — pero con un trabajo distinto. Antes llevaba el
conteo de la página ("36 conciertos en 10 salas") y ahí no significaba nada;
ahora lleva **el precio**, que es literalmente lo que va impreso en un talón.
El borde punteado es la perforación de la boleta: cuando el elemento dice de
qué habla el dato que lleva adentro, deja de ser decoración. Lo cercano lo dan el afiche, la etiqueta manuscrita del masthead
y la marca de escena local — que además significan algo. El titular solo
necesita escala.

## Iconografía

Set propio en `apps/web/src/components/icons.tsx`: trazo simple, sin relleno,
sobre una grilla de 42px — **nunca emoji ni glifos de texto**.

**El lenguaje sale de `BrandMark`**, el ícono del masthead, que Juan eligió
como norte el 2026-09-07: aro exterior en `--accent`, motivo interior en
`--accent-2`, detalle sólido en `--foreground`. Los íconos de categoría lo
repiten pieza por pieza, así que en fila se leen como familia y no como
dibujos sueltos.

Las medidas compartidas del set —el radio del aro, los grosores de trazo y el
margen que evita que el motivo lo toque al reducirse— están en
`context/look-and-feel/iconografia.md`. **Mirarlas antes de dibujar uno
nuevo**, junto con lo que se aprendió rehaciendo los tres de categoría.

| Ícono | Qué identifica | Dónde sale |
|---|---|---|
| `BrandMark` | el sitio, **y la sala** | masthead y marcador del mapa |
| `IconConcierto` | `event_type` `music` — un micrófono | pestaña Conciertos |
| `IconFiesta` | `event_type` `fiesta` — confeti | pestaña Fiestas |
| `IconFestival` | `event_type` `festival` — una tarima | pestaña Festivales |
| `IconNota` | evento sin afiche | fila de cartelera y ficha |
| `IconSun` / `IconMoon` | el `ThemeToggle` | masthead |

### Dos decisiones de fondo

- **El ícono de categoría va en la pestaña, no en cada fila.** Dentro de una
  pestaña todos los eventos son del mismo tipo, así que repetirlo por fila no
  informa nada. Donde sí decide es al elegir qué mirar.
- **La sala no tiene ícono propio: es `BrandMark`.** Repetir el dibujo con
  otro nombre solo abriría la puerta a que los dos se desincronicen.

⚠️ **El marcador del mapa es la excepción de color**: sus colores van fijos
dentro del SVG y no en tokens, porque el mapa no cambia con el toggle. El
porqué, en `context/look-and-feel/iconografia.md`.

## Qué queda abierto

- **El nombre y la identidad de marca definitivos.** Sigue en el placeholder
  `bogota-music-intel`, y "Cartelera de Bogotá" es lo que se muestra en
  pantalla. Es lo más grande que falta.
- **El tratamiento ilustrado del mockup de la primera ronda** —marco con
  grano, cinta en las esquinas— **no se va a aplicar tal cual.** Va contra la
  dirección del rediseño: el sitio ahora se sostiene en escala tipográfica y
  filetes, no en decoración. Si vuelve algo de ahí, tiene que ganarse el
  lugar por sí solo.
- **El grano de papel sí sobrevivió** (`body::after` en `globals.css`), a una
  opacidad mucho más baja que la de la primera ronda.

## Cómo se trabaja el look & feel

- **No se rediseña por iniciativa propia.** La primera ronda se congeló a
  propósito y la segunda la pidió Juan expresamente; las dos veces la decisión
  fue suya.
- **No se da por cerrado al llegar al deploy.** Lo que falta está arriba, en
  "Qué queda abierto".
- Juan lo quiere trabajar en conjunto y con calma: son varias sesiones, no un
  retoque puntual.

## El mapa es la excepción deliberada

**El mapa no cambia con el toggle.** Usa el estilo claro `liberty` de
OpenFreeMap desde el 2026-08-27, elegido por Juan tras mirar cuatro en el
navegador (`dark`, `fiord`, `liberty`, `bright`): un mapa casi negro leía como
un hueco en la página.

Los tokens `--popup-*` (el mapa y su popup) **no se sobreescriben en
`[data-theme="oscuro"]`**, así que se quedan en su propio "papel" claro tenga
la página el modo que tenga. De ahí que el aro del marcador use
`var(--popup-surface)` y no `var(--background)`: con `--background` se vería
distinto en cada modo mientras el mapa se ve igual.

## Cómo se revisa: `npm run capturas`

```
npm run dev        # en otra terminal
npm run capturas
```

Deja 30 PNG en `apps/web/capturas/` (en `.gitignore`, se regeneran): las
cinco pantallas públicas × claro/oscuro × escritorio/móvil, más la página
entera en escritorio. Corre sobre Chromium headless con Playwright.

**No es solo comodidad, y por eso existe.** Mirar el sitio con la
automatización sobre el Chrome de Juan tiene una trampa: la pestaña suele
estar **oculta**, y Chrome no le da frames de `requestAnimationFrame` a una
pestaña oculta. El mapa entonces no renderiza y **parece roto sin estarlo**
— el 2026-09-07 eso costó un pendiente en rojo por un bug que no existía.
Chromium headless siempre renderiza, así que estas capturas no mienten sobre
el canvas.

Dos cosas que el script hace a propósito y conviene no deshacer:

- **Fija el modo antes de que corra nada de la página**, igual que el script
  inline de `layout.tsx`, para no capturar el parpadeo del otro modo.
- **Espera al mapa aparte.** MapLibre dibuja canvas, marcadores y controles
  mucho antes de tener teselas; sin esa espera la captura sale con el
  rectángulo vacío y vuelve a parecer el bug que no era.

De la página completa **solo se genera la de escritorio**: la cartelera en
móvil da una tira de más de 16.000px que al abrirla se reduce a algo
ilegible.

**Y esto no es opcional al implementar.** El proyecto ya tiene precedente de
que el mapa se vea mal con CI en verde y build limpio: los tests, `tsc` y el
linter no prueban nada de lo que se ve.

## Ver también

- `context/look-and-feel/verde-neon.md` — la primera ronda: referencias, las 7
  direcciones de paleta y por qué quedó a medias. Histórico.
- `context/look-and-feel/iconografia.md` — las medidas del set, lo que se
  aprendió dibujándolo y la excepción de color del marcador.
- `context/look-and-feel/tokens.css` — los valores vivos.
