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

/** Concierto (`event_type` `music`): un micrófono. */
export function IconConcierto({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 42" fill="none" className={className} aria-hidden="true">
      <circle cx="21" cy="21" r="19" stroke="var(--accent)" strokeWidth="2.5" />
      <rect
        x="17.4"
        y="10.5"
        width="7.2"
        height="12.5"
        rx="3.6"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
      />
      <path
        d="M13.8 20.4a7.2 7.2 0 0 0 14.4 0"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M21 27.6v4"
        stroke="var(--foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Fiesta (`event_type` `fiesta`): confeti cayendo. */
export function IconFiesta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 42" fill="none" className={className} aria-hidden="true">
      <circle cx="21" cy="21" r="19" stroke="var(--accent)" strokeWidth="2.5" />
      {/* Las piezas van repartidas por todo el disco y en ángulos distintos.
          El primer intento las agrupaba —tiras abajo, puntos arriba— y a 20px
          eso no lee como confeti sino como dos manchas. Confeti es dispersión:
          si se ordenan, deja de serlo. */}
      <path
        d="M14.6 18.2l3.4-4.2"
        stroke="var(--accent-2)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M25.4 24.6l3.4-3.4"
        stroke="var(--accent-2)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M19.6 29.6l2.2-4.4"
        stroke="var(--accent-2)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="27.2" cy="15.4" r="1.9" fill="var(--foreground)" />
      <circle cx="14.6" cy="26.4" r="1.9" fill="var(--foreground)" />
    </svg>
  );
}

/** Festival (`event_type` `festival`): una tarima con su estructura. */
export function IconFestival({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 42" fill="none" className={className} aria-hidden="true">
      <circle cx="21" cy="21" r="19" stroke="var(--accent)" strokeWidth="2.5" />
      {/* Estructura recta, no arco. Se probaron dos versiones con el techo
          curvo y las dos leían como un sombrero o una campana: **la curva es
          lo que arruina el dibujo**, porque una cúpula sobre una línea es una
          forma que el ojo ya tiene asignada a otra cosa. Dos postes y una
          viga recta se leen como el andamio de una tarima. */}
      <path
        d="M13.6 26.2V16.4h14.8v9.8"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* La tarima sobresale de los postes por los dos lados, y las patas la
          levantan del piso: estar elevada es lo que la separa de un umbral. */}
      <path
        d="M10 26.6h22"
        stroke="var(--foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M14.8 26.6v3.6M27.2 26.6v3.6"
        stroke="var(--foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
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
 */
export const MARCA_SALA_SVG = `<svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="21" cy="21" r="20" fill="#f7faf4" />
  <circle cx="21" cy="21" r="19" stroke="#12760f" stroke-width="2.5" />
  <path d="M11 24c2-6 5-9 10-9s8 3 10 9" stroke="#0c7189" stroke-width="2.2" stroke-linecap="round" fill="none" />
  <circle cx="21" cy="21" r="2.6" fill="#10160f" />
</svg>`;
