# Iconografía — medidas y lo que se aprendió dibujando

Detalle del set de `apps/web/src/components/icons.tsx`. El criterio —de dónde
sale el lenguaje, dónde va cada ícono— está en
`context/look-and-feel/CLAUDE.md`; acá están los números que hay que respetar
para que un ícono nuevo entre en la familia, y los errores que costó
descubrirlos.

## Las medidas compartidas

Para que un ícono nuevo entre sin tener que deducirlas mirando los que ya hay:

- Aro exterior `r=19` con `strokeWidth 2.5`.
- Motivo interior con `strokeWidth 2.2` y `strokeLinecap="round"`.
- **Todo el contenido dentro de un radio de 14 desde el centro.** Es lo que
  evita que el trazo toque el aro al reducirse a 20px.

Grilla de 42px, trazo simple, sin relleno.

## Lo que se aprendió dibujándolos (2026-09-07 y 2026-09-08)

Los íconos de categoría se rehicieron dos veces, siempre mirándolos
**ampliados** y luego a tamaño real en una captura, no en el editor. Las
lecciones no se deducen del código:

- **La curva arruinó la tarima dos veces.** Un techo curvo sobre una línea
  lee como campana o como sombrero — es una forma que el ojo ya tiene
  asignada. Lo que la volvía un escenario eran dos postes rectos, una viga
  recta y unas patas que la levantan del piso.
- **Y aun recta, la tarima no decía "festival".** Dos postes con una viga son
  el andamio de cualquier cosa. La reemplazó una carpa el 2026-09-08, con la
  referencia que pasó Juan (`carpa.png`), porque **la carpa tiene silueta
  propia** y eso es lo que se reconoce a 18px.
- **Una carpa con el techo bajo es una casa.** El primer intento tenía el
  techo de 10 de alto y las patas de 6,4, y leía como una casita con tejado a
  dos aguas. Lo que la vuelve carpa es que **el techo domine y sobresalga**:
  13 de alto contra 6,5 de pata, y los aleros por fuera de las patas. Es la
  misma trampa de la campana, con otra forma.
- **El confeti agrupado no es confeti** — pero disperso solo, tampoco era
  gran cosa. La versión del 2026-09-07 eran cinco piezas repartidas por el
  disco: leía como confeti únicamente si uno ya sabía que lo era. La
  referencia de Juan (`confetti.jpg`) tiene lo que faltaba, **el cono**: una
  forma con silueta propia que convierte las piezas en su consecuencia. Las
  piezas siguen dispersas y en ángulos distintos, pero todas salen de la boca
  del cono.
- **El micrófono de mano costó tres intentos, y cada uno chocó con una forma
  que el ojo ya tenía asignada.** Reemplazó al de diadema el 2026-09-08, a
  pedido de Juan. Derecho, con la cápsula centrada sobre un palo vertical:
  **globo con hilo**. Inclinado y con la rejilla hueca al final del trazo:
  **lupa o llave**. Lo que lo resolvió fue la referencia que pasó Juan
  (`microphone.png`) y **rellenar la cabeza**: sólida, la bola pesa y el
  trazo diagonal pasa a ser su mango.

  ⚠️ Ese relleno es **la única excepción al "trazo simple, sin relleno"** del
  set, y está bien que lo sea: el círculo hueco no era un problema de tamaño
  ni de grosor, era la forma equivocada. El resto del ícono sigue las reglas
  de la familia — cabeza y cuerpo en `--accent-2`, cable en `--foreground`.
- **La lección general de los tres**: a 18px gana la silueta, no el detalle,
  y **casi siempre el problema es que la silueta ya significa otra cosa** —
  campana, casita, globo, lupa. No se arregla afinando el trazo; se arregla
  cambiando la forma. Ninguno de los tres se resolvió en el editor: todos se
  vieron en una captura, a tamaño real.

## El marcador del mapa es la excepción de color

`MARCA_SALA_SVG` es `BrandMark` dibujado dos veces, con colores **fijos**,
**relleno** y como cadena de texto. Las tres cosas son a propósito:

1. El marcador se crea con `document.createElement` porque MapLibre pide un
   elemento del DOM; renderizar el componente a texto obligaría a meter
   `react-dom/server` en el bundle del cliente para dibujar nueve puntos.
2. El mapa usa el estilo claro `liberty` y **no cambia con el toggle**. Con
   `var(--foreground)` el punto central se volvería casi blanco en modo
   oscuro y desaparecería sobre un mapa que sigue siendo claro. El aro,
   por la misma razón, usa `var(--popup-surface)` (ver `CLAUDE.md`).

3. **El disco va relleno** desde el 2026-09-08, a pedido de Juan. La marca
   hueca era el mismo dibujo del masthead, y un aro delgado sobre un mapa
   lleno de líneas se pierde. Rellena, la marca se lee al revés que en la
   página —el verde pasa a ser el fondo— y por eso **los otros dos colores se
   miden contra él**, no contra el papel. El cian de `--accent-2` (`#0c7189`)
   da **1.03** sobre el verde: es literalmente invisible, y es el error que se
   habría cometido copiando los tokens de la página.

### El verde del pin: hasta dónde llega el azul

El relleno arrancó en `#12760f` —el `--accent` de la página— y Juan pidió
aclararlo. El compromiso, medido, es este:

| Relleno | Arco en `#4fd4ef` (el token) | Arco en `#9de9f8` | Punto en papel |
|---|---|---|---|
| `#12760f` (el de la página) | 3.31 ✅ | 4.09 ✅ | 5.50 ✅ |
| `#137d10` | 3.02 ✅ | 3.73 ✅ | 5.02 ✅ |
| `#178e13` | 2.44 ❌ | 3.14 ✅ | 4.06 ✅ |
| `#1fb21a` (**el vigente**) | 1.61 ❌ | 2.11 ❌ | 2.68 ❌ |

Se probó primero pasar el arco a blanco para poder aclarar el verde, y **Juan
lo señaló de inmediato**, con razón: el arco azul es lo que hermana al pin con
la marca de la barra de arriba, y sin él el pin vuelve a ser un punto verde —
justo lo que se reemplazó el 2026-09-07.

⚠️ **La combinación vigente la eligió Juan a ojo el 2026-09-08 y no pasa los
números**, que es la excepción a "los valores están medidos, no elegidos a
ojo". Está anotada, no corregida: es su decisión y la tomó sabiendo el dato.
Lo que sostiene la legibilidad es **el aro blanco y la sombra**, que separan
el pin del mapa aunque el relleno contraste poco con el papel. Si alguna vez
se quitan, el pin se cae y hay que volver a la tabla.

### El hover: crece y se pone rosa

Desde el 2026-09-08, apuntar un pin lo agranda a `scale(1.3)` y le cambia el
fondo a `#c2185b`, el aro a `#ffeaf2` y el punto a `#ffd9e6` (4.56 de
contraste). El arco se queda azul: da 3.36 sobre el rosa, y es lo que hace que
el pin siga siendo el mismo pin en los dos estados.

Cuatro cosas de implementación que no se ven en el diseño:

- ⚠️ **El `scale` va sobre el `<svg>`, nunca sobre `.marcador-sala`.**
  MapLibre posiciona cada marcador escribiéndole un `transform` **en línea**,
  y un estilo en línea le gana a la hoja de estilos: un `transform: scale()`
  sobre el botón no hace nada. Y no lo hizo — hubo un `scale(1.15)` escrito en
  `globals.css` desde el 2026-09-07 que **nunca corrió** y que nadie notó,
  porque a ojo un pin que no crece se ve igual que uno que crece poco. Lo
  levantó Juan el 2026-09-08 pidiendo "un scale que ya estaba".
- **Se comprueba midiendo, no mirando**: el ancho renderizado del `<svg>` pasa
  de 30 a 39px. ⚠️ Y hay que medir sobre **un pin aislado**: al apuntar uno
  que tiene un vecino encima, el `:hover` se lo lleva el vecino y la medición
  dice 30 → 30, que parece el bug y no lo es. Pasó en la misma sesión.
- **El hover lleva `z-index: 1`.** Sin eso, el pin que crece puede quedar
  debajo del vecino que lo tapa.
- **Por qué el rosa no rompe la regla del magenta** —que tiene un solo
  trabajo, la marca de escena local— está en `CLAUDE.md`, junto a la regla.

Mide **30px y no 14** como el punto verde que reemplazó: a 14 el aro y el
trazo interior se empastan y no se distingue de un círculo cualquiera. Estuvo
en 26 mientras fue hueca; con el disco relleno se subió a 30, porque la masa
de color es lo que hace que el pin se encuentre sin buscarlo.

⚠️ **Dos salas vecinas se tapan.** En Chapinero hay puntos a menos de 30px de
distancia y el de arriba oculta al de abajo — ya pasaba a 26px. No lo resuelve
achicar el pin: lo resuelve agrupar, y eso es trabajo aparte que nadie ha
pedido todavía.
