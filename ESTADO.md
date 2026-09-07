# Estado del proyecto

Última actualización: **2026-09-07**.

Acá van los pendientes, las cifras y lo que quedó a medias. **`CLAUDE.md` y los
`context/*/CLAUDE.md` son reglas y criterio; este archivo es la foto de hoy.**
Si algo de acá se vuelve permanente, sube a un `CLAUDE.md`; si algo de un
`CLAUDE.md` caduca, baja acá.

---

## 1. Bloqueado en Juan (nadie más lo puede destrabar)

- 🔥 **`Bogotá Music Market | BoMM 2026` es mañana (2026-09-08) y está en
  borrador.** De los ocho festivales en cola es el único que se vence ya; los
  otros van del 2026-09-12 al 2026-11-28.
- **`/festivales` sigue vacía, y ahora por otra razón.** El 2026-09-07 se
  publicaron dos —`Festival Internacional de Música Sacra` y `Tortazo Jazz`—
  pero los dos eran del 2026-09-05, o sea que ya habían pasado. La página
  filtra por `starts_at >= hoy`, así que publicarlos no la llenó. Lo que la
  llena son los 8 festivales que siguen en borrador.
- **50 borradores en cola** esperando triage. No bloquea escribir código, pero
  sí bloquea que la cartelera muestre lo que ya se trajo.
- **3 duplicados sugeridos esperando fusión** en `/admin`: `Festival Cordillera
  2026` con `Festival Cordillera`, `Carlos Vives | Tour Al Sol` con su gemelo
  ya publicado, y dos `Luis Alberto Posada` de título idéntico. El detector los
  marcó bien; falta que una persona decida.
- **Fotos de las salas: 0 de 18 publicadas.** `fotos_curadas.py` está vacío y
  todas salen con el ícono de respaldo. **Ninguna fuente que scrapeamos
  publica foto del venue**, así que no hay nada que automatizar: sirve el
  sitio oficial de la sala, su Instagram o Google Maps — una foto de la sala
  (fachada o interior), no un logo ni el afiche de un evento.
- **Coordenadas: 9 de 18 salas publicadas sin punto** — Coliseo Medplus,
  Parque El Country, Parque Metropolitano Simón Bolívar, Proyecto Kinder,
  Teatro Astor Plaza, Teatro Cafam, Teatro Colón de Bogotá, Teatro Mayor Julio
  Mario Santo Domingo y Teatro al Aire Libre La Media Torta. Eran 4: el
  denominador creció al aprobar salas nuevas el 2026-09-02 y nadie movió el
  numerador. Ya se nota — `/mapa` las lista debajo como "sin ubicar". Se
  arregla pegando el punto desde Google Maps en `/admin` → Salas.
- **4 salas por aprobar**: Parque de la 93, Teatro Panorama, Ágora Bogotá
  Centro de Convenciones y Museo de Arte Moderno de Bogotá MAMBO. Entraron
  solas al nombrarlas un evento scrapeado y esperan revisión. Ojo: aprobarlas
  vuelve a mover el denominador de las coordenadas.
- **El género: 9 de 51 publicados lo muestran.** Otros 7 tienen `category`
  pero es la taxonomía de la fuente —4 "Música", 2 "Conciertos", 1 "Otro"— y
  `generoVisible` la esconde a propósito. Ninguna fuente publica género real:
  o lo escribe Juan en `/admin` o el chip no existe.
- **11 borradores de música sin origen resuelto** (`is_local` en null). Se
  resuelven a mano en `/admin` o curando en `artistas_locales.py`. Dos de
  ellos, **`Expo Solar` y `ARTBo | Feria Internacional de Arte`, no son
  música** y están en la cola por el fallo de `Ferias MICE` que se describe
  abajo.

### Preguntas abiertas — hay que hacérselas a Juan, no resolverlas por cuenta propia

- **¿Se les devuelve el año al título de los festivales?** Ya no es una duda
  de estilo: **el año partido en dos creó un duplicado real.** `Festival
  Cordillera` (revisado el 2026-09-01, sin año porque el normalizador se lo
  quitó cuando todavía era `music`) y `Festival Cordillera 2026` (sin revisar)
  son hoy dos canónicos distintos con el mismo `starts_at`. Ahora que son
  `festival` la regla es la contraria —el año es la edición y se conserva—.
  **No se re-normalizaron porque 5 de los 6 de entonces tenían `reviewed_at`**:
  no hay forma de distinguir "Juan dejó ese título" de "Juan nunca lo miró", y
  pisar una edición del admin es lo que el modelo de moderación prohíbe. Si
  Juan confirma que el título no fue decisión suya, es una corrida y ya.
- **¿Se suelta la tabla `trending_artists`?** Sigue en la base con 215 filas.
  La migración está escrita (`20260831010000_baja_radar.sql`) y **sin
  aplicar**, porque borra datos irrecuperables que no le hacen daño a nadie:
  215 filas no pesan nada contra los 500 MB del plan gratuito.
- **¿Se borra el secret `BMI_LASTFM_API_KEY`?** Ya no lo usa nadie.
- **¿Se suelta `canonical_events.price_text`?** Desde el 2026-09-02 no la lee
  nadie: el precio sale de `price_kind`/`price_min`/`price_max`. Se conservó
  porque soltarla borra datos irrecuperables, que es decisión tuya y no de una
  migración. En `events` **sí se queda**: ahí es la evidencia cruda de lo que
  publicó la fuente.

---

## 2. Lo que quedó a medias

- 🟠 **Afinar el filtro de `visitbogota`: sigue llegando a la cola mucho que
  no es música.** Lo pidió Juan el 2026-09-02 después de otra sesión de
  triage, y una semana después la proporción no bajó: de los **31 bloqueos que
  existen, 23 son de visitbogota**, y **26 del total tienen motivo «no music»**
  — o sea que dos tercios del trabajo de borrado que ha hecho una persona lo
  genera una sola fuente.

  Dos pistas concretas, las dos verificadas contra fichas reales:

  1. **`Ferias MICE` no engancha, aunque `ferias` y `mice` están las dos en la
     lista.** `categoria_no_musical()` compara la cadena entera contra
     `CATEGORIAS_NO_MUSICALES`, así que una etiqueta compuesta se escapa. Hoy
     **`Expo Solar` y `ARTBo` siguen en la cola como música** por esto. Es el
     arreglo chico y seguro.
  2. **La ficha publica tres niveles de etiquetas y el scraper solo lee el
     primero.** El regex `_CATEGORIA` corta justo en «Categorías», que es el
     segundo bloque, y hay un tercero («Subcategorías»). Comparadas:

     | Ficha | Categoría del evento | Categorías | Subcategorías |
     |---|---|---|---|
     | Expo Solar | Ferias MICE | *(vacío)* | *(vacío)* |
     | Tortazo Jazz | Conciertos | Cultura | Teatros Museos Música y Arte |

     ⚠️ **Son dos fichas, no una muestra.** Antes de construir sobre esto hay
     que mirar bastantes más y ver si de verdad discrimina — es exactamente el
     error que ya se pagó dos veces en este proyecto, dar por buena una señal
     con pocos casos.

  El contexto que hace falta para no equivocarse: **`Categoría del evento` casi
  no discrimina en el corpus real** — 52 de las 55 fichas de entonces decían
  «Conciertos». Eso no contradice lo que dice `context/ingesta/CLAUDE.md` (la
  etiqueta *acierta* cuando dice algo distinto), pero sí matiza para qué sirve:
  es buena para descartar lo que ella misma marca como otra cosa, y no alcanza
  para lo que mete bajo «Conciertos».

  Y el aviso de siempre antes de tocar `PATRONES_NO_MUSICALES`: el archivo ya
  advierte que **la Feria de las Flores y la Feria de Cali SÍ son eventos con
  música**. Un patrón sobre «feria» o «festival» es justamente el que se lleva
  por delante lo que la plataforma existe para promover.
- **Nunca se ha desplegado a Vercel.** Todo se ha verificado en local, y eso
  incluye el rediseño entero del 2026-09-07. Hacen falta
  `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el
  proyecto de Vercel.
- **El rediseño no se ha visto en un dispositivo real.** Las 30 capturas de
  `npm run capturas` cubren escritorio y móvil en los dos modos, pero son
  Chromium headless a tamaño simulado: no dicen nada de un teléfono de verdad
  ni de Safari.
- **36 canónicos publicados sin revisar** (de 51). Son los del backfill del
  2026-08-31, publicados para que la cartelera no se vaciara al cambiar de
  modelo. Tienen `reviewed_at` en null y eso es correcto: nadie los revisó. El
  número baja solo a medida que Juan toca cada evento por otro motivo.
- **12 publicados ya pasaron de fecha** y siguen en `publicado`. No se ven —la
  cartelera filtra por `starts_at >= hoy`— así que no es un bug, pero explica
  por qué "51 publicados" y "38 en pantalla" no cuadran.
- **Sin verificar, porque no se ve desde fuera del dashboard:** si el proyecto
  de Supabase todavía expone las **claves legacy JWT** (`anon` /
  `service_role`). Son un juego de credenciales aparte que la rotación de las
  `sb_*` del 2026-08-28 no tocó.
- **Opcional:** añadir el secret `BMI_SUPABASE_PUBLISHABLE_KEY` al repo para
  que el CI prerenderice contra la base real en vez de contra placeholders.

---

## 3. Las cifras

⚠️ **Envejecen con cada corrida del cron y con cada sesión de triage:
recontarlas con una consulta, no citarlas de memoria.** Recontadas el
**2026-09-07** contra la base.

| | |
|---|---|
| Filas crudas | **116** — visitbogota 58, royal 14, movistar 13, lourdes 9, latino 8, rockal 8, idartes 6 |
| Crudas sin clasificar | **0** |
| Canónicos | **106** — 51 publicados, 50 borradores, 5 descartados |
| Publicados | 45 conciertos + 4 fiestas + 2 festivales; de los conciertos, **8 locales y 37 internacionales**, 0 sin origen |
| Borradores | 50 — 42 música, 8 festivales; **11 de música sin origen resuelto** |
| Salas | **35** — 18 publicadas, **4 por aprobar**, 13 descartadas |
| Coordenadas | **9 de 18 salas publicadas ubicadas** |
| Fotos de sala | **0 de 18** |
| Precio | **21 de 51 publicados** lo tienen |
| Género visible | **9 de 51 publicados** |
| Bloqueados | **31** `(fuente, id)` — visitbogota 23, idartes 5, movistar 3; 26 con motivo «no music» |
| Duplicados sugeridos | **3**, esperando fusión en `/admin` |
| En pantalla | **36 conciertos en 10 salas**, 2 fiestas (+1 sin fecha), **0 festivales**, 37 eventos en el mapa |
| Tests | 275 backend + 55 frontend, verdes en local y en CI (`b40ca71`) |

Cómo leerlas sin equivocarse:

- ⚠️ **Que las filas crudas suban o bajen no dice nada del scraping por sí
  solo.** El botón de borrar elimina la fila cruda además del canónico, así
  que un triage a fondo *reduce* el crudo. Antes de sospechar de una fuente,
  mirar `blocked_source_events`.
- **El salto entre canónicos y pantalla es la cola más los que ya pasaron de
  fecha**, no deduplicación. Es el modelo funcionando, no un atraso del
  pipeline.
- **No queda ningún publicado sin clasificar ni sin origen resuelto.** Pero
  **se llegó ahí curando artistas a mano**: cada evento nuevo puede volver a
  caer en "sin origen" —hoy hay 11 borradores así—, y los locales emergentes
  son los que más probablemente caigan.
- **Las fiestas y los festivales tienen `is_local = null` y eso es correcto.**
  Al contar "sin origen resuelto" hay que mirar solo los conciertos.
- **3 de los 31 bloqueos tienen como motivo «pq si».** La función exige un
  motivo pero no puede exigir que sirva. No es para arreglar con código: es
  para saber, cuando dentro de tres meses alguien se pregunte por qué no
  vuelve un evento, que en tres casos la respuesta no está escrita.

---

## 4. El siguiente paso

Hay dos caminos y no compiten:

1. **El directorio de la escena local** — es el único módulo del MVP que no ha
   arrancado, y el que cierra el alcance.
2. **Más fuentes** — es lo que sigue tapando el sesgo de cobertura. Quedan
   `ticketlive.com.co`, `mitaquilla.com.co` y `feverup.com` abiertas y sin
   explotar, más el pegado manual de texto o flyer.

**Después queda la Fase 6 (pulido y deploy).** El pulido de look & feel se hizo
el 2026-09-07 —el sitio se rediseñó entero— así que lo que queda de esa fase es
**desplegar a Vercel, que nunca se ha hecho**, y verlo en un dispositivo real.
