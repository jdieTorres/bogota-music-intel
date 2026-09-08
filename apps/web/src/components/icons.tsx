/**
 * Set de íconos del sitio: trazo simple, sin relleno, sobre una grilla de
 * 42px — nunca emoji.
 *
 * **El lenguaje sale de `BrandMark`**, que es el del masthead y el que Juan
 * eligió como norte el 2026-09-07: un aro exterior en `--accent`, el motivo
 * interior en `--accent-2`, y el detalle sólido en `--foreground`. Los cuatro
 * íconos de categoría lo repiten pieza por pieza, así que puestos en fila se
 * leen como una familia y no como cuatro dibujos sueltos.
 *
 * Toman los colores de los tokens, así que se ven bien en los dos modos sin
 * props adicionales. **La excepción es el mapa** — ver `MARCA_SALA_SVG` al
 * final del archivo.
 *
 * Las medidas compartidas, para que un ícono nuevo entre en la familia sin
 * tener que deducirlas: aro `r=19` con `strokeWidth 2.5`; motivo interior con
 * `strokeWidth 2.2` y `strokeLinecap="round"`; todo el contenido dentro de
 * un radio de 14 desde el centro (21,21), que es lo que evita que el trazo
 * toque el aro al reducirse a 20px.
 */

import type { TipoEvento } from "@/lib/events";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 42 42"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="21" cy="21" r="19" stroke="var(--accent)" strokeWidth="2.5" />
      <path
        d="M11 24c2-6 5-9 10-9s8 3 10 9"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="21" cy="21" r="2.6" fill="var(--foreground)" />
    </svg>
  );
}

/**
 * Abrir en otra pestaña.
 *
 * Acompaña a "Más info" y antes era una flecha de texto ("↗"). El set del
 * proyecto es de trazo y **nunca glifos**: un carácter no hereda el grosor
 * del resto de los íconos y se ve de un tamaño distinto en cada tipografía
 * del sistema.
 *
 * `aria-hidden` porque el texto del botón ya dice a dónde lleva; que se abra
 * en otra pestaña lo dice el dibujo a quien lo ve, y repetirlo en el nombre
 * accesible sería ruido.
 */
export function IconEnlaceExterno({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 5h5v5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 5l-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M18 14.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNota({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9 18V5.5L18 4v10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconSun({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M17 12.5A7 7 0 1 1 7.5 3a5.5 5.5 0 0 0 9.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Los íconos de categoría.
 *
 * `IconSala` no está acá porque la sala **es** `BrandMark`: Juan pidió
 * explícitamente que el ícono del masthead identificara a las salas, y
 * repetir el dibujo con otro nombre solo abriría la puerta a que los dos se
 * desincronicen.
 *
 * Falta la cuarta categoría del modelo editorial, `not_music` (comedia,
 * lucha libre, teatro, danza). No está dibujada a propósito: no sale en el
 * sitio público, así que su único lugar sería la fila de la cola de
 * `/admin`, que hoy la marca con una etiqueta de texto. Cuando se decida
 * ponerla, va ahí.
 *
 * ⚠️ Y **`event_type` en `null` no lleva el ícono de concierto**, aunque en
 * la cartelera se muestre junto a ellos. El ícono afirmaría "esto es un
 * concierto" sobre algo que nadie clasificó, que es exactamente colapsar
 * "no sé" con "confirmado". Si alguna vez hace falta distinguirlo, va con
 * un dibujo propio de "sin clasificar".
 */

/**
 * Concierto (`event_type` `music`): un micrófono de mano, con cable.
 *
 * La primera versión era la cápsula colgada de un arco con un pie corto: el
 * micrófono de diadema o de soporte que dibuja todo el mundo. Juan pidió el
 * clásico de cable (2026-09-08), y tiene razón en algo más que el gusto —
 * **el cable es lo que lo hace un micrófono y no una linterna**: la cápsula
 * sola, sin nada que salga de ella, es un rectángulo redondeado.
 *
 * Dibujado sobre la referencia que pasó Juan
 * (`context/look-and-feel/microphone.png`), que aporta las tres cosas que las
 * dos versiones anteriores no tenían:
 *
 * - **La cabeza es un círculo**, no una cápsula ni una rejilla con el corte
 *   recto. Es la forma que hace que se lea un micrófono de mano y no un
 *   objeto alargado cualquiera.
 * - **El cuerpo va en diagonal y sale de la cabeza**, no debajo de ella. Un
 *   mango vertical bajo una cabeza centrada es demasiado simétrico: parece un
 *   globo con hilo, que es exactamente lo que se vio al probarlo.
 * - **El cable es una S larga**, con dos curvas. Una sola vuelta corta se
 *   confunde con el pie de un soporte.
 *
 * Cabeza y cuerpo van en `--accent-2` y el cable en `--foreground`: el mismo
 * reparto de la familia, con el cable haciendo de detalle.
 */
export function IconConcierto({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 42" fill="none" className={className} aria-hidden="true">
      <circle cx="21" cy="21" r="19" stroke="var(--accent)" strokeWidth="2.5" />
      {/* La cabeza, **rellena**.

          ⚠️ Es la única excepción al "trazo simple, sin relleno" del set, y
          se pagó con dos intentos: un círculo hueco al final de un trazo
          diagonal es una lupa o una llave, no un micrófono. El ojo ya tiene
          esa forma asignada. Rellena, la bola pesa y el trazo pasa a ser su
          mango. La referencia de Juan también la tiene sólida, y por lo
          mismo. */}
      <circle cx="25.4" cy="16.6" r="5" fill="var(--accent-2)" />
      {/* El cuerpo: un trazo grueso a 45°, que arranca en la cabeza y baja
          hacia la izquierda. */}
      <path
        d="M22.2 19.8 15.4 26.6"
        stroke="var(--accent-2)"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      {/* El cable: dos curvas, no una. Una sola vuelta corta se confunde con
          el pie de un soporte. */}
      <path
        d="M15 28c-2.1 2-.4 4.8 2.3 4.3 2.4-.4 3.8.3 4.2 1.3"
        stroke="var(--foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Fiesta (`event_type` `fiesta`): un matasuegras disparando confeti.
 *
 * La primera versión eran cinco piezas sueltas repartidas por el disco. Leía
 * como confeti solo si uno ya sabía que lo era: sin nada que lo dispare, un
 * puñado de trazos en ángulos distintos es ruido. Juan pasó la referencia
 * (`context/look-and-feel/confetti.jpg`) y lo que la hace legible de un
 * vistazo es **el cono**: es la forma con silueta propia, y las piezas pasan
 * a ser su consecuencia en vez de el dibujo entero.
 *
 * Las piezas se quedan dispersas y en ángulos distintos —eso de la versión
 * anterior sigue valiendo— pero todas salen de la boca del cono hacia arriba
 * y a la derecha: es lo que las convierte en un disparo.
 */
export function IconFiesta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 42" fill="none" className={className} aria-hidden="true">
      <circle cx="21" cy="21" r="19" stroke="var(--accent)" strokeWidth="2.5" />
      {/* El cono, con la boca en diagonal hacia arriba a la derecha. Cerrado
          y recto: una punta y dos lados rectos se leen a 18px, que es donde
          este ícono vive ahora que sale en cada fila. */}
      <path
        d="M12.5 29.5 19.5 15.5 26.5 22.5Z"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Las piezas: dos tiras y dos puntos, todos por delante de la boca. */}
      <path
        d="M25.6 12.6 28.4 10.1"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M29.4 19.6 32 18.2"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="30.4" cy="14.2" r="1.8" fill="var(--foreground)" />
      <circle cx="21.6" cy="10.6" r="1.8" fill="var(--foreground)" />
    </svg>
  );
}

/**
 * Festival (`event_type` `festival`): una carpa.
 *
 * Reemplaza a la tarima el 2026-09-08, a pedido de Juan y con su referencia
 * (`context/look-and-feel/carpa.png`). La tarima era correcta y no se leía:
 * dos postes con una viga es el andamio de cualquier cosa, y sin escala ni
 * público alrededor no dice "festival". La carpa sí tiene silueta propia.
 *
 * ⚠️ Y no contradice la lección de la tarima —"la curva arruinó el dibujo
 * dos veces", en `iconografia.md`—: **acá el techo también va recto**, dos
 * diagonales que se juntan en punta. Un techo curvo sobre las patas volvería
 * a leer como campana o como sombrero, que es exactamente lo que costó dos
 * intentos descubrir.
 */
export function IconFestival({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 42" fill="none" className={className} aria-hidden="true">
      <circle cx="21" cy="21" r="19" stroke="var(--accent)" strokeWidth="2.5" />
      {/* El techo en punta, de alero a alero.

          ⚠️ Las proporciones no son libres: el primer intento tenía el techo
          más bajo y las patas más largas, y a 18px **leía como una casita**
          —tejado a dos aguas sobre paredes—. Lo que lo vuelve una carpa es
          que el techo domine: acá mide 13 de alto contra 6,5 de pata, y
          sobresale por los dos lados de las patas. Un techo plano sobre patas
          largas es una casa, y es el mismo tipo de error que la campana de la
          tarima. */}
      <path
        d="M8.6 22.6 21 9.6 33.4 22.6"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* El faldón corrido bajo los aleros y las tres patas. El faldón es lo
          que separa la carpa de un tejado suelto, y las patas la levantan
          del piso igual que las de la tarima. */}
      <path
        d="M8.8 23.9h24.4"
        stroke="var(--foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M11.4 23.9v6.5M21 23.9v6.5M30.6 23.9v6.5"
        stroke="var(--foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * El ícono que le corresponde a un evento, o nada.
 *
 * Existe para que la regla del `null` viva en un solo lugar: desde el
 * 2026-09-08 el ícono sale en la fila de la cartelera, en la ficha del
 * evento y en el panel de la sala, y repetir el `switch` en los tres
 * invitaba a que uno de ellos terminara dibujando un micrófono sobre algo
 * que nadie clasificó.
 *
 * ⚠️ **`null` no lleva ícono, y `not_music` tampoco.** El primero porque el
 * dibujo afirmaría "esto es un concierto" sobre algo sin clasificar —colapsar
 * "no sé" con "confirmado" es justo lo que el proyecto no hace—; el segundo
 * porque no sale en el sitio público.
 *
 * `conNombre` agrega el nombre del tipo para lectores de pantalla. Va donde
 * el tipo no se deduce del contexto —la ficha del evento, el panel de la
 * sala—; en la cartelera no, porque ahí la pestaña activa ya lo dijo y
 * repetirlo en cada una de las 36 filas es ruido.
 */
const ICONO_POR_TIPO = {
  music: { Icono: IconConcierto, nombre: "Toque" },
  fiesta: { Icono: IconFiesta, nombre: "Fiesta" },
  festival: { Icono: IconFestival, nombre: "Festival" },
} as const;

export function IconoDeTipo({
  tipo,
  className,
  conNombre = false,
}: {
  tipo: TipoEvento;
  className?: string;
  conNombre?: boolean;
}) {
  const entrada =
    tipo === null ? undefined : ICONO_POR_TIPO[tipo as keyof typeof ICONO_POR_TIPO];
  if (!entrada) return null;

  const { Icono, nombre } = entrada;
  return (
    <>
      <Icono className={className} />
      {conNombre && <span className="sr-only">{nombre}</span>}
    </>
  );
}

/**
 * El marcador de sala del mapa, como cadena de SVG.
 *
 * Es `BrandMark` dibujado dos veces, y la duplicación es a propósito por dos
 * motivos que no se pueden esquivar:
 *
 * 1. **El marcador se crea con `document.createElement`**, no con React:
 *    MapLibre pide un elemento del DOM. Renderizar el componente a texto
 *    obligaría a meter `react-dom/server` en el bundle del cliente para
 *    dibujar nueve puntos.
 * 2. **Los colores van fijos, no en tokens.** El mapa usa el estilo claro
 *    `liberty` y **no cambia con el toggle** (decisión del 2026-08-27). Con
 *    `var(--foreground)` el punto central se volvería casi blanco en modo
 *    oscuro y desaparecería sobre un mapa que sigue siendo claro. Es el mismo
 *    motivo por el que existe `--popup-surface`.
 *
 * El aro blanco exterior no está en `BrandMark`: acá hace falta para separar
 * el ícono de las calles y los parques, que traen sus propios verdes.
 *
 * **El disco va relleno y no hueco** (2026-09-08, a pedido de Juan). La marca
 * hueca sobre el papel del mapa era el mismo dibujo del masthead, pero un aro
 * delgado sobre un mapa lleno de líneas se pierde: el pin tiene que ganarle a
 * las calles, no acompañarlas. Relleno, es una mancha sólida antes de ser un
 * dibujo, y eso es lo que se ve al barrer el mapa con la vista.
 *
 * **Los colores salen de cuatro variables `--pin-*` que define `globals.css`**,
 * y eso NO contradice el punto 2 de arriba: no son los tokens del tema, son
 * variables propias del marcador, declaradas solo en `.marcador-sala` y **sin
 * una redefinición en `[data-theme="oscuro"]`**, así que el marcador sigue
 * viéndose igual tenga la página el modo que tenga. Existen porque el hover
 * los cambia a la vez, y hacerlo desde CSS es una línea contra reescribir el
 * SVG entero en JavaScript.
 *
 * ⚠️ **No convertirlas en tokens del tema.** Es el mismo error que el punto 2
 * describe, con otra ropa: en cuanto `--pin-fondo` dependa del modo, el
 * marcador cambia de color sobre un mapa que no cambió.
 */
export const MARCA_SALA_SVG = `<svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="21" cy="21" r="20.5" fill="var(--pin-aro)" />
  <circle cx="21" cy="21" r="18.5" fill="var(--pin-fondo)" />
  <path d="M11 24c2-6 5-9 10-9s8 3 10 9" stroke="var(--pin-motivo)" stroke-width="2.6" stroke-linecap="round" fill="none" />
  <circle cx="21" cy="21" r="2.8" fill="var(--pin-detalle)" />
</svg>`;
