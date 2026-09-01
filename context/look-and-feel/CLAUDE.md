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

## Paleta activa: Verde Neón

| Token | Claro (por defecto) | Oscuro (`[data-theme="oscuro"]`) |
|---|---|---|
| `--background` | `#c8f0b8` | `#091d0d` |
| `--surface` | `#d9f6cc` | `#102a15` |
| `--surface-hover` | `#c0edae` | `#17351c` |
| `--border` | `#a9dd93` | `#1f4527` |
| `--foreground` | `#0d2a10` | `#eaf7e6` |
| `--muted` | `#3f5c3a` | `#8fb389` |
| `--accent` (marca) | `#128a0a` | `#3ddc2e` |
| `--accent-2` (salvaje, teal) | `#0e8fae` | `#3fd0ee` |
| `--accent-3` (salvaje, magenta) | `#d81b73` | `#ff4fae` |

Los valores oscuros no son los claros con el brillo invertido a lo bruto: el acento y los dos "salvajes" se aclaran para seguir contrastando sobre un fondo casi negro.

**El mapa y su popup no cambian con el toggle** — son la excepción deliberada que ya existía desde el 2026-08-27 (el mapa usa el estilo claro `liberty` de OpenFreeMap). Sus tokens (`--popup-surface`, `--popup-surface-hover`, `--popup-border`, `--popup-foreground`, `--popup-muted`) están fijos en `:root` y no se sobreescriben en modo oscuro:

| Token | Valor (fijo, los dos modos) |
|---|---|
| `--popup-surface` | `#eef9e6` |
| `--popup-surface-hover` | `#e0f2d4` |
| `--popup-border` | `#cdeab8` |
| `--popup-foreground` | `#123018` |
| `--popup-muted` | `#4a6a44` |

Ver `tokens.css` en esta carpeta para los valores en formato listo para copiar, y `apps/web/src/app/globals.css` para la implementación real.

## Tipografía

Pareja tipográfica, aplicada en `apps/web/src/app/layout.tsx` vía `next/font/google`:

- **Fredoka** (500/600/700) — titulares. Genera la utilidad `font-display` (convención de Tailwind 4: cualquier `--font-*` en `@theme` genera su `font-*`). Aplicada a los `<h1>` de cartelera, fiestas, evento y mapa, y al nombre de marca en el header.
- **Caveat** (600/700) — acentos manuscritos, uso puntual. Genera `font-hand`. Hoy solo en la etiqueta "escena en vivo" del header.
- **Work Sans** (400/500/600/700) — cuerpo de texto, reemplaza a Geist Sans. Mantiene fecha/sala/precio legibles sin competir con los titulares.
- **Geist Mono** — sin cambios, sigue en los datos tabulares (conteos, fechas de popup, horas).

Criterio de dónde aplicar cada una (acordado en esta sesión): el caos y el carácter viven en portada, headers y titulares; la lista densa de datos (tarjetas de evento, pestañas, popups del mapa) se queda en Work Sans para que fecha/hora/precio se lean sin fricción.

## Iconografía

Set propio en `apps/web/src/components/icons.tsx`: trazo simple (`stroke`, sin relleno), sobre una grilla de 20-24px, nunca emoji ni glifos de texto.

- `BrandMark` — el logo circular del header (círculo + trazo de "sonido" + punto central), toma sus colores de los tokens de marca (`--accent`, `--accent-2`, `--foreground`), así que se ve correcto en los dos modos sin props adicionales.
- `IconNota` — reemplaza el carácter `♪` que usaban las tarjetas de evento sin afiche.
- `IconSun` / `IconMoon` — el control del `ThemeToggle`.

## Qué quedó fuera de esta ronda

El mockup interactivo tiene un tratamiento ilustrado más fuerte que todavía no se llevó al código real: el marco del mapa con textura de grano, "cinta" decorativa en las esquinas, squiggles a mano alzada junto a los títulos, y chips con borde punteado estilo boleta. Se decidió aplicar primero paleta + tipografía + iconografía base (más seguro de verificar sin poder correr el build en la sesión que hizo el cambio) y dejar ese tratamiento más ilustrado para una próxima sesión, una vez que Juan confirme que lo anterior se ve bien en su navegador.

También sigue sin definirse: el nombre y la identidad de marca final del proyecto (placeholder `bogota-music-intel`).

## El estado: congelado a propósito, no terminado

La primera ronda quedó **commiteada, verificada en navegador y aceptada por
Juan** el 2026-08-28. Pero Juan decidió ese mismo día seguir adelante con esta
identidad tal como está y **hacer una pasada de ajustes al final, justo antes
de desplegar** — dentro de la Fase 6, no antes.

Dos consecuencias para quien retome, y las dos importan:

- **No rediseñar por iniciativa propia en el medio.**
- **No dar el look & feel por cerrado al llegar al deploy.** Lo que ya está
  identificado para esa pasada es lo de "Qué quedó fuera de esta ronda", más
  el nombre y la identidad de marca definitivos.

Juan lo quiere trabajar en conjunto y con calma: son varias sesiones, no un
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

## Ojo al implementar

Correr el dev server y mirarlo en **un navegador real**: el proyecto ya tiene
precedente de que el mapa se vea mal con CI en verde y build limpio. Los
tests, `tsc` y el linter no prueban nada de esto.
