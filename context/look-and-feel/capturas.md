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
- **Se hace pasar por un Chrome normal.** El User-Agent por defecto de
  Playwright dice `HeadlessChrome`, y hay servidores que con eso devuelven
  **403 con una página HTML donde iba la imagen**. Pasó el 2026-09-08 con la
  foto de Movistar Arena: perfecta en el navegador de Juan, rota en la
  captura, y el diagnóstico que se dio primero —"esa foto no sirve"— era
  falso. Las fotos de sala son URLs de sitios ajenos pegadas a mano, así que
  este caso es el esperable y no la excepción.

  ⚠️ La lección es más ancha que la línea de código: **la herramienta que
  existe para que el sitio no "parezca roto sin estarlo" puede ser la que lo
  haga parecer roto.** Antes de creerle a una captura que muestra algo caído
  afuera de nuestro dominio, comprobarlo en un navegador de verdad.

## Lo que no cubren

Son Chromium headless a tamaño simulado: no dicen nada de un teléfono de
verdad ni de Safari. El paquete entra como dependencia de desarrollo, así que
`npm ci` lo instala en CI; **los navegadores no** — esos solo bajan con
`playwright install`.
