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

## Lo que se aprendió dibujándolos (2026-09-07)

Los tres íconos de categoría se rehicieron mirándolos **ampliados**, no en el
editor. Las dos lecciones no se deducen del código:

- **El confeti agrupado no es confeti.** La primera versión ponía las tiras
  abajo y los puntos arriba, y a 20px eso lee como dos manchas. Las piezas
  van repartidas por todo el disco y en ángulos distintos: si se ordenan,
  deja de ser confeti.
- **La curva arruinó la tarima dos veces.** Un techo curvo sobre una línea
  lee como campana o como sombrero — es una forma que el ojo ya tiene
  asignada. Lo que la vuelve un escenario son dos postes rectos, una viga
  recta y unas patas que la levantan del piso.

## El marcador del mapa es la excepción de color

`MARCA_SALA_SVG` es `BrandMark` dibujado dos veces, con colores **fijos** y
como cadena de texto. Las dos cosas son a propósito:

1. El marcador se crea con `document.createElement` porque MapLibre pide un
   elemento del DOM; renderizar el componente a texto obligaría a meter
   `react-dom/server` en el bundle del cliente para dibujar nueve puntos.
2. El mapa usa el estilo claro `liberty` y **no cambia con el toggle**. Con
   `var(--foreground)` el punto central se volvería casi blanco en modo
   oscuro y desaparecería sobre un mapa que sigue siendo claro. El aro,
   por la misma razón, usa `var(--popup-surface)` (ver `CLAUDE.md`).

Mide **26px y no 14** como el punto verde que reemplazó: a 14 el aro y el
trazo interior se empastan y no se distingue de un círculo cualquiera.
