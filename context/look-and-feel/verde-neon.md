# Verde Neón — la primera ronda de identidad (2026-08-27 / 2026-08-28)

**Nada de acá está activo.** El rediseño del 2026-09-07 reemplazó esta
identidad entera; la paleta y la tipografía vivas están en
`context/look-and-feel/CLAUDE.md`.

Se conserva por dos razones concretas: explica **de dónde salen los colores
que sobrevivieron** —el verde de marca y el magenta de escena local siguen
siendo los de esta ronda, solo que ya no como fondo— y deja escrito qué se
evaluó, para que no se vuelva a evaluar.

## Referencias de partida

Juan envió 5 imágenes como norte visual: el mapa ilustrado `#ColombiaMeSuena`, una historia de Instagram de Bogotá Plan ("Planes en Bogotá"), el póster de gira "El Oro y los Espejos", el flyer "Fête de la Musique" de Bogotá Plan × Alliance Française, y el póster "Rock al Parque 30 años". La lectura común entre las cinco: paleta cálida y saturada (naranja/rojo/amarillo sobre un fondo oscuro o de papel), ilustración a mano por encima de foto o vector plano, tipografía con carácter como protagonista (burbuja, hand-lettering, stamped), grano/textura de papel, y convenciones de flyer independiente (sellos circulares, fila de auspiciantes). Es lenguaje de quien hace la gráfica del toque, no el de un dashboard.

El brief de Juan: una app amigable a la vista, "hasta desordenada y despreocupada", dirigida a jóvenes y a editoriales periodísticas independientes — pero sin aparentar ser "cool" a propósito. El caos tenía que sentirse fresco, no forzado.

El punto de partida y las preguntas abiertas originales están en
`context/producto/diseno-del-producto.md`, sección 8.

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
7. **Toggle real**: a diferencia de las demás decisiones de look & feel (que fijan un único modo), Juan pidió que claro/oscuro sea una función real del sitio, no solo un token fijo — ver `apps/web/src/components/ThemeToggle.tsx`. **Esto sigue vivo.**

El mockup interactivo completo (con las 3 paletas finalistas × 2 modos, más la hoja de tokens y el resumen de las 7 direcciones) queda publicado en Claude Design:
**https://claude.ai/code/artifact/6630d970-baba-4cd1-a337-2453e7bcbfa3**

## Por qué quedó a medias

La primera ronda quedó **commiteada, verificada en navegador y aceptada por
Juan** el 2026-08-28, pero congelada a propósito: él decidió ese mismo día
seguir con esa identidad tal cual y dejar la pasada de ajustes para el final,
dentro de la Fase 6. Esa pasada terminó siendo el rediseño del 2026-09-07, y
llegó antes de lo previsto porque Juan la pidió expresamente.

Lo que quedó de aquella decisión ya no es el calendario sino el modo de
trabajo, y está en `CLAUDE.md`: el look & feel no se rediseña por iniciativa
propia, y no se da por cerrado al llegar al deploy.
