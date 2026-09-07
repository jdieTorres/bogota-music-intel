# Trampas del frontend

### Trampas del frontend encontradas al implementar el mapa (2026-08-27)
- **MapLibre GL 6 se queda sin worker bajo Turbopack, y falla en silencio.** La v6 dejó de inlinear su worker como blob: ahora lo resuelve con `new URL('./maplibre-gl-worker.mjs', import.meta.url)` y **descarta el resultado si `import.meta.url` no empieza por `http(s):`**. Turbopack no le da una URL http ni en `next dev` ni en `next build`, así que `getWorkerUrl()` devuelve `""`. El síntoma engaña: el canvas, los marcadores, los controles y la atribución se dibujan bien, no hay excepción ni advertencia en consola, y el estilo, el TileJSON y el sprite se descargan con 200 — pero **no se pide ni una sola tesela** y el mapa queda en negro. La pista que lo delata es esa: peticiones de estilo sí, de teselas ninguna. Se resuelve copiando `maplibre-gl-worker.mjs` y su hermano `maplibre-gl-shared.mjs` a `public/` (`apps/web/scripts/copiar-worker-maplibre.mjs`, enganchado a `predev`/`prebuild`) y llamando a `setWorkerUrl()`. Ojo: afecta también al build de producción, no es un problema solo de dev.
- **La hoja de estilos de MapLibre pisa la del sitio.** Se importa desde el componente cliente, así que Next la inyecta *después* de `globals.css`: con la misma especificidad gana ella. El popup viene con `background:#fff` fijo y sobre la paleta oscura dejaba texto blanco sobre blanco. Los overrides en `globals.css` llevan una clase de más (`.maplibregl-popup .maplibregl-popup-content`) para ganar sin `!important`.
- **Nominatim devuelve la calle cuando no encuentra el lugar.** "CARRERA 13 #66-80" resolvió a un punto de Usaquén a más de 7 km del Royal Center — dentro de Bogotá, así que el filtro por bounding box no lo detectaba. Hay que mirar `addresstype` y rechazar los resultados demasiado gruesos (`road`, `suburb`, `city`…). Ver `services/api/bogota_music_intel/geocode.py`.

---

### El script anti-parpadeo del tema no puede ir con `next/script` (2026-08-31)

Salió de un error de consola que vio Juan navegando: *"Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client"*, apuntando al `<Script strategy="beforeInteractive">` del `layout.tsx`.

El error de consola era el síntoma menor. **Mirando el HTML servido, el script nunca se emitía como etiqueta ejecutable**: Next lo empuja a una cola, `self.__next_s`, que procesa su propio runtime al arrancar. O sea que el tema guardado quedaba atado a que cargara el bundle de JS, y no podía aplicarse antes del primer pintado — exactamente lo contrario de lo que el comentario del código afirmaba desde el 2026-08-28.

La documentación de Next lo dice sin vueltas y contradice el nombre de la estrategia: los scripts `beforeInteractive` *"se precargan y se buscan antes que cualquier código propio, pero su ejecución **no bloquea la hidratación**"*. Para un anti-parpadeo eso no alcanza: hace falta que corra mientras el navegador parsea el HTML.

**En localhost no se ve el defecto**, y eso es lo que lo mantuvo escondido: medido en el navegador, el CSS y el primer chunk de JS terminan en el mismo milisegundo (902 ms los dos), así que la ventana de parpadeo es de 0 ms. En producción, con el bundle llegando por red después del CSS, la ventana existe.

Arreglado con un `<script dangerouslySetInnerHTML>` crudo en el `<head>`, que React renderiza en el HTML del servidor y el navegador ejecuta al parsear. Verificado en el HTML servido —la etiqueta está, la cola `__next_s` ya no— y en el navegador, sin errores de consola al navegar entre rutas.

**La lección, que ya es la tercera del mismo tipo en este proyecto:** el mapa en negro con CI verde, Deezer geolocalizando por IP, y ahora esto. Las tres se veían bien desde donde se estaba mirando. Acá ni siquiera el navegador alcanzaba: hubo que mirar el HTML que sale del servidor, porque en el DOM ya inspeccionado el `<script>` **sí aparece** — lo inyecta el runtime de Next después.

---

### El mapa que parecía roto y no lo estaba (2026-09-07)

Se anotó en rojo que `/mapa` "no pinta teselas". Era un **artefacto de la
verificación**: la pestaña estaba oculta (`document.visibilityState ===
"hidden"`) mientras se la miraba con la automatización del navegador, Chrome no
le da frames de `requestAnimationFrame` a una pestaña oculta, y las teselas se
piden **durante** el render — así que nunca se pedían. Lo único en pantalla era
el color de fondo del estilo en el primer frame. Forzando el render a mano:
seis teselas en `loaded`, `isStyleLoaded()` en `true`, cero errores, el mapa
completo con calles, cerros, etiquetas y los nueve marcadores.

**Las dos señales que despistaron, y que no son síntoma de nada:**

- **Las peticiones de tesela salen del worker y no aparecen en el panel de red
  de la extensión**, ni siquiera cuando todo funciona. O sea que "no pide ni
  una tesela" —la pista que en 2026-08-27 sí delató el bug del worker— **no se
  puede leer desde ahí**. Es la misma frase señalando dos cosas opuestas según
  dónde se mire.
- **La petición del propio worker se queda en `pending` para siempre**, por lo
  mismo.

La salida es no diagnosticar a ojo: `npm run capturas` levanta Chromium
headless, que siempre renderiza.

