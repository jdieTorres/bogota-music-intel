# `npm run capturas` — cómo se mira el sitio sin que mienta

```
npm run dev        # en otra terminal
npm run capturas
```

Deja 30 PNG en `apps/web/capturas/` (en `.gitignore`, se regeneran): las cinco
pantallas públicas × claro/oscuro × escritorio/móvil, más la página entera en
escritorio. Corre sobre Chromium headless con Playwright
(`apps/web/scripts/capturas.mjs`).

## Por qué existe, que no es comodidad

Mirar el sitio con la automatización sobre el Chrome de Juan tiene una trampa:
**la pestaña suele estar oculta**, y Chrome no le da frames de
`requestAnimationFrame` a una pestaña oculta. El mapa entonces no renderiza y
**parece roto sin estarlo** — el 2026-09-07 eso costó un pendiente en rojo por
un bug que no existía. Chromium headless siempre renderiza, así que estas
capturas no mienten sobre el canvas. El relato completo, con las dos señales
que despistaron, está en `context/frontend/trampas.md`.

## Tres cosas que el script hace a propósito

- **Fija el modo antes de que corra nada de la página**, igual que el script
  inline de `layout.tsx`, para no capturar el parpadeo del otro modo.
- **Espera al mapa aparte.** MapLibre dibuja canvas, marcadores y controles
  mucho antes de tener teselas; sin esa espera la captura sale con el
  rectángulo vacío y vuelve a parecer el bug que no era.
- **De la página completa solo genera la de escritorio.** La cartelera en
  móvil da una tira de más de 16.000px que al abrirla se reduce a algo
  ilegible. Se descubrió generándola.

## Lo que no cubren

Son Chromium headless a tamaño simulado: no dicen nada de un teléfono de
verdad ni de Safari. El paquete entra como dependencia de desarrollo, así que
`npm ci` lo instala en CI; **los navegadores no** — esos solo bajan con
`playwright install`.
