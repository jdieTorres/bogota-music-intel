# Estado del proyecto

Última actualización: **2026-09-02**.

Acá van los pendientes, las cifras y lo que quedó a medias. **`CLAUDE.md` y los
`context/*/CLAUDE.md` son reglas y criterio; este archivo es la foto de hoy.**
Si algo de acá se vuelve permanente, sube a un `CLAUDE.md`; si algo de un
`CLAUDE.md` caduca, baja acá.

---

## 1. Bloqueado en Juan (nadie más lo puede destrabar)

- **Publicar los 6 festivales.** Están marcados pero en borrador, así que
  `/festivales` se ve vacía — es correcto, no un bug. Son seis clics en
  `/admin` → "Por revisar" → Publicar.
- **49 borradores en cola** esperando triage (eran 37; `moderacion_cli` abrió
  12 el 2026-09-02, 10 de visitbogota y 2 de Idartes). No bloquea escribir
  código, pero sí bloquea que la cartelera muestre lo que ya se trajo.
- **Fotos de las salas: 0 de 13 publicadas.** `fotos_curadas.py` está vacío y
  todas salen con el ícono de respaldo. **Ninguna fuente que scrapeamos
  publica foto del venue**, así que no hay nada que automatizar: sirve el
  sitio oficial de la sala, su Instagram o Google Maps — una foto de la sala
  (fachada o interior), no un logo ni el afiche de un evento.
- **Coordenadas de 4 salas: Coliseo Medplus, Parque el Country, Parque
  Metropolitano Simón Bolívar y Teatro Mayor Julio Mario Santo Domingo.** Ya
  se nota: se publicó un evento del Coliseo Medplus, así que `/mapa` lo lista
  bajo el mapa como "sin ubicar". Se arregla pegando el punto desde Google
  Maps en `/admin` → Salas.
- **El género de los eventos publicados: 40 de 49 sin él.** Ninguna fuente lo
  publica: o lo escribe Juan en `/admin` o el chip no existe.
- **El origen de 7 borradores de música**: Carteto de Nos, The Hayley Williams
  Show, HUMBE, Kris R, Laura & Brenda, Gorillaz y Expo Solar (este último
  probablemente ni siquiera sea música). Se resuelven a mano en `/admin` o
  curando en `artistas_locales.py`.

### Preguntas abiertas — hay que hacérselas a Juan, no resolverlas por cuenta propia

- **¿Se les devuelve el año al título de los festivales?** Los canónicos dicen
  "Rock al Parque" porque el normalizador les quitó el año cuando todavía eran
  `music`; los crudos dicen "Rock al Parque 2026". Ahora que son `festival` la
  regla es la contraria —el año es la edición y se conserva—. **No se
  re-normalizaron porque 5 de los 6 tienen `reviewed_at`**: no hay forma de
  distinguir "Juan dejó ese título" de "Juan nunca lo miró", y pisar una
  edición del admin es lo que el modelo de moderación prohíbe. Si Juan
  confirma que el título no fue decisión suya, es una corrida y ya.
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

- 🔴 **MusicBrainz no clasifica desde CI, y no está probado por qué.** El cron
  del 2026-08-30T17:54Z trajo `Carlos Vives & La Provincia Tour Al Sol`, el
  paso `Classify events` corrió 33 segundos, terminó **success** y el evento
  siguió sin clasificar. Local lo resuelve al instante. El "success" es el
  comportamiento diseñado (MusicBrainz falla → se deja sin clasificar para
  reintentar, no se tumba la corrida), pero **el resultado desde CI no es el
  mismo que desde acá**. No se leyeron los logs — hacen falta credenciales.
  La sospecha razonable es que MusicBrainz trate distinto a las IP de GitHub
  Actions, que es **el mismo patrón que ya se pagó con Deezer**. Segunda vez
  que aparece.
  - ✅ **La prueba volvió a estar disponible el 2026-09-02, y hay que no
    gastarla.** La corrida del scraper de ese día dejó **12 filas crudas con
    `event_type` en null** (10 de visitbogota, 2 de Idartes), así que el paso
    `Classify events` del próximo `Scraper cron` sí va a tener sobre qué
    trabajar. Se había gastado el 2026-09-01, cuando una corrida local
    clasificó 74 eventos y dejó la base sin nada pendiente.
  - 🚫 **No correr `classify_cli` local hasta que el cron haya corrido.** Es
    lo único que hay que hacer —o más bien no hacer— para que la prueba
    sirva. Después de la corrida de CI, consultar cuántas siguen en null: si
    siguen 12, MusicBrainz tampoco funciona desde CI esta vez; si bajaron,
    el problema era transitorio.
  - Lo único demostrado hoy: MusicBrainz responde bien desde la máquina de
    Juan (74 de 74, sin un solo 503, el 2026-09-01).
- ✅ **Cerrado el 2026-09-01: el CI vio todo lo del 2026-09-01.** Se pushearon
  los 6 commits del día —eran 6, no 5 como decía la nota anterior— y el
  workflow `Tests` quedó **verde en `e02bc5e`**. Con eso queda ejercitado por
  primera vez el paso **`npm run lint`**, que era lo que más preocupaba, y de
  paso se resuelve la duda que estaba anotada como "*no debería* no es *se
  verificó*": el linter corre **antes** de `npx next typegen` y no lo necesita.
  También pasaron por CI el festival y el género.
- **Nunca se ha desplegado a Vercel.** Todo se ha verificado en local. Hacen
  falta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en
  el proyecto de Vercel.
- **36 canónicos publicados sin revisar** (de 49). Son los del backfill del
  2026-08-31, publicados para que la cartelera no se vaciara al cambiar de
  modelo. Tienen `reviewed_at` en null y eso es correcto: nadie los revisó. El
  número baja solo a medida que Juan toca cada evento por otro motivo.
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
2026-09-02 contra la base, después de la corrida del scraper y de `moderacion_cli`.

| | |
|---|---|
| Filas crudas | **111** — visitbogota 61, royal 12, movistar 10, lourdes 9, latino 8, rockal 7, idartes 4 |
| Canónicos | **102** — 49 publicados, **49 borradores en cola**, 4 descartados |
| Publicados | 45 conciertos + 4 fiestas + **0 festivales**; de los conciertos, **8 locales y 37 internacionales** |
| Borradores | 49; **12 sin clasificar**, que son la prueba pendiente de MusicBrainz en CI |
| Salas | **22** — 13 publicadas, 9 descartadas, **0 por aprobar** |
| Coordenadas | **9 de 13 salas publicadas ubicadas** |
| Fotos de sala | **0 de 13** |
| Precio | **19 de 49 publicados** lo tienen |
| Bloqueados | 24 `(fuente, id)` que no vuelven a entrar |
| En pantalla | **40 conciertos en 10 salas**, 2 fiestas (+1 sin fecha), 42 eventos en el mapa |
| Tests | 275 backend + 53 frontend, verdes **en local**; el CI vio 249+42 (`e02bc5e`) |

Cómo leerlas sin equivocarse:

- ⚠️ **Las filas crudas bajaron de 114 a 102 y no es una falla del scraping:
  es el botón de borrar**, que elimina las filas crudas además del canónico.
  Un triage a fondo *reduce* el crudo. Si vuelve a bajar, mirar
  `blocked_source_events` —que subió de 13 a 24— antes de sospechar de una
  fuente.
- **El salto entre canónicos y pantalla es sobre todo la cola**, no
  deduplicación. Es el modelo funcionando, no un atraso del pipeline.
- **No queda ningún publicado sin clasificar ni sin origen resuelto**
  (0 canónicos con `event_type` en null, 0 conciertos publicados con
  `is_local` en null). Pero **se llegó ahí curando ocho artistas a mano, no
  porque MusicBrainz haya mejorado**: cada evento nuevo puede volver a caer en
  "sin origen", y los locales emergentes son los que más probablemente caigan.
- **Las fiestas y los festivales tienen `is_local = null` y eso es correcto.**
  Al contar "sin origen resuelto" hay que mirar solo los conciertos.
- **De los 24 bloqueos, 3 tienen como motivo «pq si».** La función exige un
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

**Después queda la Fase 6 (pulido y deploy):** desplegar a Vercel —que nunca
se ha hecho—, la pasada final de look & feel, y mirar si el cron llega a
clasificar solo lo que MusicBrainz le falló.
