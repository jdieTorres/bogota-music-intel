# Look & feel — identidad visual

> **Leer esto antes de tocar `globals.css`, `layout.tsx` o cualquier
> componente de UI.** Los valores vivos están en
> `apps/web/src/app/globals.css` y **no hay una segunda copia que mantener**:
> la tabla de abajo es la única, y un test la obliga a coincidir.

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

| Token | Oscuro (por defecto) | Claro (`[data-theme="claro"]`) |
|---|---|---|
| `--background` | `#0b0f0b` | `#f1f4ec` |
| `--surface` | `#141a13` | `#fafcf7` |
| `--surface-hover` | `#1b2319` | `#eaefe3` |
| `--border` | `#262f24` | `#dbe2d3` |
| `--foreground` | `#eef2ea` | `#10160f` |
| `--muted` | `#94a08e` | `#59654f` |
| `--accent` (marca) | `#4ae63a` | `#12760f` |
| `--accent-2` (dato frío) | `#4fd4ef` | `#0c7189` |
| `--accent-3` (escena local) | `#ff5fb0` | `#c2185b` |
| `--danger` (error y borrado) | `#ff8a80` | `#b3261e` |

**Oscuro es el modo por defecto desde el 2026-09-16** (lo pidió Juan: es el
que más le gusta). El cambio es de cuál se sirve primero, no de la paleta:
los diez valores de cada columna son los mismos de antes. Lo que sí se movió
es dónde viven — el oscuro ahora está en `:root` y el claro en
`:root[data-theme="claro"]`, porque **el defecto tiene que estar declarado en
el CSS y no en el script del tema** (`context/frontend/CLAUDE.md`).

⚠️ **Esta tabla es la única copia de la paleta, y un test la sostiene.**
Hubo una segunda —`context/look-and-feel/tokens.css`, un CSS de referencia
para consultarla sin abrir la app— y **se borró el 2026-09-16**: había pasado
nueve días mostrando la paleta de Verde Neón, que el rediseño del 2026-09-07
reemplazó entera, sin que nadie lo notara. Ese es el modo de fallar de una
copia a mano: **equivocada se ve igual que correcta**, no rompe nada y solo
miente cuando alguien la consulta. La tabla se quedó porque acá es donde se
lee el criterio junto al valor, y `apps/web/src/lib/tokens.test.ts` la compara
con `globals.css` token por token —incluido qué columna dice ser la del modo
por defecto— y falla nombrando cuál se movió. **Si algún día vuelve a hacer
falta un tercer sitio con estos números, la respuesta es que no.**

**Los valores están medidos, no elegidos a ojo.** Toda la paleta pasa WCAG AA
en los dos modos; `--accent-2` bajó de `#0e7f9c` a `#0c7189` porque el
primero daba 4.17 sobre el papel y el género se escribe en tamaño de cuerpo.
Antes de tocar un color, volver a medirlo.

⚠️ **Y un color que no está en esta tabla es un color que nadie midió.** El
rojo de error y de borrado vivió como clase cruda de Tailwind hasta el
2026-09-15, fuera de la tabla y por lo tanto fuera de la medición:
`text-red-400` daba **2.60** sobre el papel y `text-red-300`, **1.73**. El
aviso de "qué falta" del formulario aparecía en el campo correcto y no se
leía. Es token desde entonces, y el botón que borra lleva `--background`
encima igual que el de boletería con el verde.

**El verde se gasta en la acción que decide.** En `/admin`, publicar va en
verde y guardar en el azul de `--accent-2` (2026-09-13): guardar se repite
veinte veces mientras se escribe una ficha y no cambia el estado de nada;
publicar pasa una vez y la pone en el directorio. Dos acciones que hacen cosas
distintas no pueden verse igual.

**El magenta tiene un solo trabajo: la marca de escena local.** Estaba
definido desde el 2026-08-28 y no lo usaba nadie.

Tiene **una sola excepción**, y conviene entender por qué no rompe la regla:
el **pin del mapa apuntado con el puntero** se pone rosa (2026-09-08, pedido
de Juan). Un estado de hover dura lo que dura el puntero encima: no etiqueta
al pin, lo señala. La regla existe para que el magenta no signifique dos
cosas a la vez, y en el mapa no hay nada que hoy diga "local". ⚠️ **Si algún
día el mapa distingue las salas de escena local, esa marca tiene que ser otra
cosa** — ahí sí serían dos significados peleando.

### Tipografía

- **Bricolage Grotesque** (500/600/700/800) — titulares, `font-display`.
  Reemplaza a Fredoka. Grotesca contemporánea con irregularidades a
  propósito: tiene carácter sin perder autoridad.
- **Work Sans** — cuerpo. Se queda.
- **Geist Mono** — datos tabulares (hora, precio, conteos) en 400, **y la
  etiqueta en 300**: "escena en vivo" del masthead, la marca de escena local y
  el sello de "hoy".
  - Los dos trabajos los separa el peso, y nada más. Es apretado a propósito:
    la alternativa era una cuarta familia, y **el peso alcanza mientras los
    dos usos no se toquen** — el dato va siempre en columna o al final de una
    línea, la etiqueta siempre suelta.
  - ⚠️ **Familia y peso viajan juntos en `font-etiqueta`** (una `@utility` de
    `globals.css`, no un token del tema). Un token generaría una clase que solo
    pone la familia, y esta letra sin su 300 es literalmente la del precio.
  - ⚠️ **El 300 necesita el archivo variable**: `Geist_Mono` se pide sin
    `weight` en `layout.tsx`. Con un peso fijo el navegador fingiría el 300
    estirando el 400, sin error y sin que se note en una captura.

**Caveat salió del sitio el 2026-09-16**, y con ella la cuarta familia que se
bajaba. Era la manuscrita de esos mismos tres textos y a Juan dejó de
gustarle; eligió el reemplazo mirando 36 candidatas en sus cuatro sitios
reales, agrupadas por mundo —rotulación de calle, fotocopia, carátula, manos,
condensadas— y el que le sirvió fue el de la fotocopia. La decisión de fondo
**no es qué letra: es que la etiqueta dejó de ser manuscrita.** Lo cercano ya
no lo da un trazo a mano sino una letra de máquina, que es igual de humana y
no se vuelve decorativa.

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
qué habla el dato que lleva adentro, deja de ser decoración. Lo cercano lo dan
el afiche, la etiqueta del masthead y la marca de escena local — que además
significan algo. El titular solo necesita escala.

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
| `IconConcierto` | `event_type` `music` — un micrófono de mano, con cable | pestaña, fila, ficha y panel de sala |
| `IconFiesta` | `event_type` `fiesta` — un matasuegras | igual |
| `IconFestival` | `event_type` `festival` — una carpa | igual |
| `IconNota` | evento sin afiche | fila de cartelera y ficha |
| `IconSun` / `IconMoon` | el `ThemeToggle` | masthead |

### Tres decisiones de fondo

- **El ícono de categoría acompaña al nombre del evento**, y no solo a la
  pestaña. Hasta el 2026-09-08 iba únicamente en la pestaña, con el argumento
  de que dentro de una pestaña todos los eventos son del mismo tipo. El
  argumento sigue siendo cierto y aun así Juan pidió lo contrario, con razón:
  el evento se lee **fuera de su lista** —en su ficha, en el panel de una
  sala, al volver de otra pestaña— y ahí no hay pestaña activa que lo diga.
  Sale a 18px en la fila, a 16 en el panel de la sala y a 28/32 en la ficha,
  que es lo que lo deja notorio sin volverse el primer elemento de la línea.
  Quien lo dibuja es `IconoDeTipo`, y ahí vive la regla de que **un `null` no
  lleva ícono**.
- **La sala no tiene ícono propio: es `BrandMark`.** Repetir el dibujo con
  otro nombre solo abriría la puerta a que los dos se desincronicen.
- **En el mapa esa marca va rellena de verde, no hueca** (2026-09-08). Sobre
  un mapa lleno de líneas un aro delgado se pierde: el pin tiene que ganarle
  a las calles. Relleno y a 30px es una mancha de color antes de ser un
  dibujo, que es lo que se ve al barrer el mapa con la vista. **Y el pin
  apuntado crece, se pone rosa y abre un globo con el nombre de la sala y su
  dirección** — el único lugar del sitio donde el magenta no es la marca de
  escena local; el porqué, abajo.

⚠️ **El marcador del mapa es la excepción de color**: sus colores van fijos
dentro del SVG y no en tokens, porque el mapa no cambia con el toggle — y por
eso mismo el motivo usa el cian **claro** y no `--accent-2`, que sobre el
verde da 1.03 de contraste. El porqué completo, en
`context/look-and-feel/iconografia.md`.

### El globo del pin apuntado

Volvió el 2026-09-08 con dos datos y nada más —**nombre de la sala y
dirección**— y **sin reemplazar al panel de abajo**: el panel sigue teniendo la
foto y los eventos, y el globo solo contesta "¿cuál es esta?" mientras el
puntero barre el mapa. No es el popup de MapLibre que se quitó el 2026-08-29.

Dos criterios que valen más allá del mapa:

- **Un hueco reservado no es un dato faltante disimulado.** La sala sin
  dirección deja la línea vacía —el globo mide igual en las dos— pero **no
  lleva texto de relleno**: un "sin dirección" afirmaría algo que nadie
  verificó.
- **Un estado que se muestra con `:hover` se muestra también con
  `:focus-visible`.** El mapa se recorre con Tab y el teclado no tiene
  puntero. Es lo que decidió que el globo fuera CSS sobre un hijo del marcador
  y no un `Popup` atado a `mouseenter`.

Los colores, las medidas y el recorte del borde superior, en
`context/look-and-feel/iconografia.md`.

## El movimiento, y la única paleta que no es del tema

Entró con el directorio el 2026-09-09.

**Las curvas son propias porque las de fábrica son flojas.** `ease` y `ease-out`
a secas arrancan y frenan sin carácter, y el movimiento se lee como un cambio de
estado en vez de como un gesto. Hay dos en `globals.css`: `--ease-salida` para
lo que entra o sale y `--ease-relevo` para lo que se mueve en pantalla.

⚠️ **`ease-in` no se usa nunca.** Arranca lento justo en el instante que el ojo
está mirando, así que una animación con `ease-in` *se siente* más lenta que la
misma con `ease-out` durando lo mismo.

**Toda animación tiene que contestar por qué anima.** El disco de la rockola
gira solo mientras suena: atado al estado es un indicador que se lee de un
vistazo, suelto sería decoración — y la decoración que se ve todo el rato cansa.
Si la única respuesta es "se ve bien" y se ve seguido, no va.

### Las etiquetas del vinilo son la excepción a la paleta

Cuatro colores ácidos —lima, cyan, amarillo y naranja— que **no son tokens del
tema y no cambian con el toggle**: van sobre un disco negro, que es negro en los
dos modos. Sobre un fondo de papel apagado o de casi negro, un sello impreso es
lo único de la pantalla que puede gritar.

- ⚠️ **Ninguno es magenta**, que sigue teniendo un solo trabajo. Un sello rosa
  en la bandeja diría "escena local" sobre cualquiera que suene.
- **Cuál le toca a cada track sale de su identificador, nunca al azar.** El
  sello de una canción tiene que ser el mismo cada vez que suena, o deja de ser
  una etiqueta y pasa a ser un parpadeo.
- **Por debajo de 140 px la etiqueta no lleva texto.** El sello mide el 48% del
  disco: en el de 64 px de la bandeja móvil son 30, donde un nombre de banda no
  entra ni recortado. Un sello de 45 rpm visto de lejos tampoco se lee.

### El masthead cede la navegación, no la marca

Desde el 2026-09-09 la barra tiene tres destinos y en 390 px ya no caben en una
línea. Lo que baja a su propia fila es la navegación; **el nombre de marca se
queda entero**. Es la misma decisión que ya se había tomado escondiendo
"Cartelera" en móvil: lo que no puede partirse en dos es la marca.

**Y desde el 2026-09-17 la marca es un bloque de dos líneas** (lo pidió Juan):
el nombre más grande —20 px en móvil, 24 en escritorio, contra los 16/18 de
antes— y "escena en vivo" debajo, como subtítulo. Tres consecuencias que
conviene tener a la vista:

- **La etiqueta dejó de ir ladeada.** El −3° venía de cuando era manuscrita y
  quería leerse como una nota al margen. Alineada bajo el nombre, la
  inclinación solo se leía como un renglón torcido.
- **Y aparece en móvil**, donde antes estaba escondida: no cabía *al lado* del
  nombre, que era el único motivo para ocultarla.
- **El ancho dejó de ser lo que limita el tamaño del nombre**, porque la marca
  ya no comparte línea con nada. Lo que lo limita ahora es la altura de la
  barra, que es lo que se debe mirar si algún día crece más.

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

Los tokens `--popup-*` (el mapa y su popup) **no se sobreescriben en el otro
modo**, así que se quedan en su propio "papel" claro tenga
la página el modo que tenga. De ahí que el aro del marcador use
`var(--popup-surface)` y no `var(--background)`: con `--background` se vería
distinto en cada modo mientras el mapa se ve igual.

## Cómo se revisa

**Con `npm run capturas`, no a ojo en el navegador.** Levanta Chromium
headless y deja 30 PNG con las cinco pantallas públicas en los dos modos y en
las dos vistas. No es comodidad: mirar el sitio en una pestaña oculta hace que
el mapa **parezca roto sin estarlo**, y eso ya costó un pendiente en rojo.

**Y no es opcional al implementar.** El proyecto ya tiene precedente de que el
mapa se vea mal con CI en verde y build limpio: los tests, `tsc` y el linter
no prueban nada de lo que se ve.

Cómo se corre y qué hace el script a propósito, en
`context/look-and-feel/capturas.md`.

## Ver también

- `context/look-and-feel/verde-neon.md` — la primera ronda: referencias, las 7
  direcciones de paleta y por qué quedó a medias. Histórico.
- `context/look-and-feel/iconografia.md` — las medidas del set, lo que se
  aprendió dibujándolo y la excepción de color del marcador.
- `context/frontend/rockola.md` — por qué el reproductor de YouTube se ve, que
  es la restricción que ordenó el diseño de la bandeja.
- `context/look-and-feel/capturas.md` — cómo se corre `npm run capturas`, qué
  hace el script a propósito y qué no cubre.
- `apps/web/src/lib/tokens.test.ts` — el chequeo que ata la tabla de arriba a
  `globals.css`. Leerlo antes de agregar un token o de reordenar las columnas.
