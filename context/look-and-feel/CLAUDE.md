# Look & feel — identidad visual

> **Leer esto antes de tocar `globals.css`, `layout.tsx` o cualquier
> componente de UI.** Los valores vivos están en `context/look-and-feel/tokens.css`
> y en `apps/web/src/app/globals.css`.

Registro del trabajo de identidad visual (paleta, tipografía, iconografía) acordado con Juan. Arrancó el 2026-08-27 (ver `context/producto/diseno-del-producto.md`, sección 8, para el punto de partida y las preguntas abiertas originales) y la paleta/tipografía se decidieron el 2026-08-28 en esta sesión.

## Referencias de partida

Juan envió 5 imágenes como norte visual: el mapa ilustrado `#ColombiaMeSuena`, una historia de Instagram de Bogotá Plan ("Planes en Bogotá"), el póster de gira "El Oro y los Espejos", el flyer "Fête de la Musique" de Bogotá Plan × Alliance Française, y el póster "Rock al Parque 30 años". La lectura común entre las cinco: paleta cálida y saturada (naranja/rojo/amarillo sobre un fondo oscuro o de papel), ilustración a mano por encima de foto o vector plano, tipografía con carácter como protagonista (burbuja, hand-lettering, stamped), grano/textura de papel, y convenciones de flyer independiente (sellos circulares, fila de auspiciantes). Es lenguaje de quien hace la gráfica del toque, no el de un dashboard.

El brief de Juan: una app amigable a la vista, "hasta desordenada y despreocupada", dirigida a jóvenes y a editoriales periodísticas independientes — pero sin aparentar ser "cool" a propósito. El caos tenía que sentirse fresco, no forzado.

## Cómo se llegó a Verde Neón

1. **Primera propuesta (mockup de `/mapa`)**: un canvas de diseño con el marco del mapa ilustrado (textura, "cinta" decorativa, squiggles) y una hoja de tokens extraídos de las 5 referencias. Sirvió para fijar el vocabulario visual, no la paleta final.
2. **7 direcciones de paleta**, para reaccionar contra opciones concretas en vez de en abstracto:
   - 4 monocromáticas de marca (un solo color hace identidad, como pidió Juan con ejemplos `#10a308` y `#cf720e`): **Verde Escena**, **Cobre Cálido**, **Azul Media Noche**, **Vinotinto**.
   - 1 ajuste fresco sobre el mockup original: **Mockup Fresco**.
   - 2 experimentos de caos exagerado: **Caos Naranja**, **Caos Ácido**.
3. **4 combinaciones mono + caos, 1:1**: Juan pidió cruzar cada mono con una paleta de caos, manteniendo fondo y color de marca de la mono y sumando 2 acentos "salvajes" literales de la paleta caos emparejada — **Cobre Punk**, **Vino Punk**, **Verde Neón**, **Medianoche Neón**.
4. **De oscuro a claro**: las 4 combinaciones estaban sobre fondo oscuro. Juan pidió explorar fondo claro, porque un fondo más claro potencia mejor la energía de escena local que buscaba. Los acentos "salvajes", pensados para fondo negro, rechinaban sobre papel claro (el cian `#2ee8ff` y el amarillo `#ffe600` puros pierden contraste) — se oscurecieron y desaturaron manteniendo la misma familia de color (cian → `#0e8fae`, amarillo → `#e0a900`, magenta → `#d81b73`).
5. **Mockup interactivo con tweaks**: en vez de construir 6 mockups sueltos (3 paletas × 2 modos), un solo artboard con dos controles (paleta / modo) que recolorea todo en vivo — la manera correcta de explorar esto en Claude Design.
6. **Elección final**: Juan eligió **Verde Neón** y ajustó a mano el verde claro a `#c8f0b8` y el oscuro a `#091d0d` (más saturados que la propuesta inicial).
7. **Toggle real**: a diferencia de las demás decisiones de look & feel (que fijan un único modo), Juan pidió que claro/oscuro sea una función real del sitio, no solo un token fijo — ver `apps/web/src/components/ThemeToggle.tsx`.

El mockup interactivo completo (con las 3 paletas finalistas × 2 modos, más la hoja de tokens y el resumen de las 7 direcciones) queda publicado en Claude Design:
**https://claude.ai/code/artifact/6630d970-baba-4cd1-a337-2453e7bcbfa3**

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

Las medidas compartidas, para que un ícono nuevo entre sin tener que
deducirlas: aro `r=19` con `strokeWidth 2.5`; motivo interior con
`strokeWidth 2.2` y `strokeLinecap="round"`; **todo el contenido dentro de un
radio de 14 desde el centro**, que es lo que evita que el trazo toque el aro
al reducirse a 20px.

| Ícono | Qué identifica | Dónde sale |
|---|---|---|
| `BrandMark` | el sitio, **y la sala** | masthead y marcador del mapa |
| `IconConcierto` | `event_type` `music` — un micrófono | pestaña Conciertos |
| `IconFiesta` | `event_type` `fiesta` — confeti | pestaña Fiestas |
| `IconFestival` | `event_type` `festival` — una tarima | pestaña Festivales |
| `IconNota` | evento sin afiche | fila de cartelera y ficha |
| `IconSun` / `IconMoon` | el `ThemeToggle` | masthead |

### Lo que se aprendió dibujándolos

Los tres de categoría se rehicieron mirándolos ampliados, no en el editor:

- **El confeti agrupado no es confeti.** La primera versión ponía las tiras
  abajo y los puntos arriba, y a 20px eso lee como dos manchas. Las piezas
  van repartidas por todo el disco y en ángulos distintos: si se ordenan,
  deja de ser confeti.
- **La curva arruinó la tarima dos veces.** Un techo curvo sobre una línea
  lee como campana o como sombrero — es una forma que el ojo ya tiene
  asignada. Lo que la vuelve un escenario son dos postes rectos, una viga
  recta y unas patas que la levantan del piso.

### Dos decisiones de fondo

- **El ícono de categoría va en la pestaña, no en cada fila.** Dentro de una
  pestaña todos los eventos son del mismo tipo, así que repetirlo por fila no
  informa nada. Donde sí decide es al elegir qué mirar.
- **La sala no tiene ícono propio: es `BrandMark`.** Repetir el dibujo con
  otro nombre solo abriría la puerta a que los dos se desincronicen.

### El marcador del mapa es la excepción de color

`MARCA_SALA_SVG` es `BrandMark` dibujado dos veces, con colores **fijos** y
como cadena de texto. Las dos cosas son a propósito:

1. El marcador se crea con `document.createElement` porque MapLibre pide un
   elemento del DOM; renderizar el componente a texto obligaría a meter
   `react-dom/server` en el bundle del cliente para dibujar nueve puntos.
2. El mapa usa el estilo claro `liberty` y **no cambia con el toggle**. Con
   `var(--foreground)` el punto central se volvería casi blanco en modo
   oscuro y desaparecería sobre un mapa que sigue siendo claro.

Mide 26px y no 14 como el punto verde que reemplazó: a 14 el aro y el trazo
interior se empastan y no se distingue de un círculo cualquiera.

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

## Por qué la primera ronda quedó a medias

La primera ronda quedó **commiteada, verificada en navegador y aceptada por
Juan** el 2026-08-28, pero congelada a propósito: él decidió ese mismo día
seguir con esa identidad tal cual y dejar la pasada de ajustes para el final,
dentro de la Fase 6. Esa pasada terminó siendo el rediseño del 2026-09-07, y
llegó antes de lo previsto porque Juan la pidió expresamente.

Lo que sigue vigente de aquella decisión es el modo de trabajo: **el look &
feel no se rediseña por iniciativa propia**, y no se da por cerrado al llegar
al deploy. Juan lo quiere trabajar en conjunto y con calma — son varias
sesiones, no un retoque puntual. Lo que queda para esa pasada está arriba, en
"Qué queda abierto".

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

## Ojo al implementar

Correr el dev server y mirarlo en **un navegador real**: el proyecto ya tiene
precedente de que el mapa se vea mal con CI en verde y build limpio. Los
tests, `tsc` y el linter no prueban nada de esto.
