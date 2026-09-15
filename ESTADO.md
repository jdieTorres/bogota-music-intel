# Estado del proyecto

Última actualización: **2026-09-15**, recontado contra la base con el MCP. La
sesión trajo el cartel de varios artistas, la primera pasada de diseño con
impeccable, y siete arreglos que salieron de ella.

⚠️ **Las cifras salieron idénticas a las del 2026-09-13, y eso es un dato**:
el cron lleva un día en rojo y no ha habido triage, así que la base no se movió.

Acá van los pendientes, las cifras y lo que quedó a medias. **`CLAUDE.md` y los
`context/*/CLAUDE.md` son reglas y criterio; este archivo es la foto de hoy.**
Si algo de acá se vuelve permanente, sube a un `CLAUDE.md`; si algo de un
`CLAUDE.md` caduca, baja acá.

---

## 1. Bloqueado en Juan (nadie más lo puede destrabar)

⚠️ **Los dos primeros van después del despliegue, no antes.** Lo decidió Juan
el 2026-09-09: primero se pule y se despliega, y el contenido se carga sobre el
sitio ya en pie. Siguen siendo lo que le falta al producto — no lo que bloquea
el siguiente paso.

- 🔴 **`Scraper cron` lleva en rojo desde el 2026-09-14 a las 19:01 UTC**, en
  el paso `Run event scrapers`. Desde el commit `892b3c5` el rojo dice qué
  fuente cayó y por qué, y ese mensaje está en el log — que la API pública no
  deja leer sin token. Hay que abrirlo:
  `github.com/jdieTorres/bogota-music-intel/actions/runs/34884325706`.
  **Si dice que fue el portero anti-bots de Ticketlive, estrena en CI una de
  las dos rutas que § 2 tiene anotadas como sin ocasión**, y eso cierra un
  pendiente. El historial alterna —falló el 12, pasó el 13, falló dos veces la
  madrugada del 14, pasó a las 00:38 y volvió a caer— que es el patrón que ya
  se le conoce a esa fuente.
- **El relleno de `artistas` no se ha corrido, y lo tiene que autorizar Juan.**
  Las 113 filas que ya existían tienen la lista vacía: el cartel de varias
  bandas solo se ve en lo que entre de ahora en adelante. El paso está escrito
  (`python -m bogota_music_intel.moderacion_cli --rellenar-artistas
  [--dry-run]`) y es un `update` masivo sobre la única copia de la base. Su
  criterio: rellena solo donde el título publicado es exactamente el que produce
  el normalizador desde el crudo; si difiere, alguien lo editó a mano y se
  salta.
- **El directorio tiene dos artistas**, y el segundo entró el 2026-09-13:
  Nicolás y los Fumadores (6 tracks) y El Kalvo (**ninguno**). Dos no son un
  directorio: **una plataforma que existe para dar a conocer la escena con dos
  fichas no da a conocer nada**, y esa parte no la puede hacer nadie más porque
  ninguna base global sabe quiénes son. Se cargan en `/admin` → Artistas.
- 🔥 **Las dos fichas publicadas tienen notas de prueba.** Dicen "hola / prueba
  / test / avisos / bajo / tierra / formato?" y "test", y **se ven en la página
  pública**. Las notas de contratapa son el material propio del proyecto —lo
  único que no salió de otra parte— así que son justo lo que no puede quedar
  así el día que esto se despliegue.
- **Hay un cartel vinculado, y hacen falta muchos más.** El Kalvo quedó unido a
  su toque del 17 de octubre el 2026-09-13, el primero desde que existe la
  tabla. Con uno solo, **dos de las tres señales de recomendación siguen sin
  poder calcularse** ("compartieron cartel" y "también ha tocado en"): las dos
  necesitan artistas que coincidan en carteles distintos. Se arma desde la
  ficha de cada toque (`context/moderacion/CLAUDE.md`).
- **7 de 20 salas publicadas sin foto.** Se pegan como URL en `/admin` → Salas,
  con vista previa. Es lo único que le falta al mapa: las 20 ya tienen
  coordenada y ninguna se lista como "sin ubicar".
- **2 salas por aprobar**: Ágora Bogotá Centro de Convenciones y Museo de Arte
  Moderno de Bogotá MAMBO. Ninguna tiene eventos vigentes, así que no corre
  prisa.
- 🔥 **El género: 9 de 52 publicados lo tienen**, con 5 en uso —Rock, Hip
  Hop/Rap, Popular, Reggaeton, Vallenato—. Desde el 2026-09-08 **ninguna fuente
  lo escribe**: `generos` es columna propia (`text[]`, varios por evento) y la
  llena Juan en `/admin`. Ahora además **es la navegación del directorio**: los
  géneros del filtro salen de los eventos donde tocó cada artista, así que un
  directorio sin géneros se queda sin su único eje de exploración.
- **La escena local marcada: 3 de 52.** Mismo caso: desde que se dio de baja
  MusicBrainz nada la calcula. La marca rosa solo sale si Juan la pone.
- **Tres tipos de Ticketlive sin mapear**: `destacado`, `dix-fm` y `externos`.
  Sus eventos entran igual —el aviso sale en el log de cada corrida del cron—
  pero nadie ha decidido a qué `event_type` van.
- **La fecha de vencimiento del token de Supabase hay que anotarla.** El
  2026-09-08 Juan generó uno nuevo con escritura en Database y Migrations, y
  reemplazó al de solo lectura que vencía el 2026-12-06. Los tokens scoped
  siempre vencen y el máximo del desplegable son 90 días; **si tomó el máximo
  vence alrededor del 2026-12-07**, pero eso no se verificó. Al vencer, el MCP
  responde `Unauthorized` sin decir que caducó.

### Preguntas abiertas — hay que hacérselas a Juan, no resolverlas por cuenta propia

- **¿Un fallo de una sola fuente tiene que pintar la corrida entera de rojo?**
  Hoy sí: el CLI sale con 1 si cualquiera falló. Desde el 2026-09-13 el rojo al
  menos dice cuál y por qué, pero sigue siendo el mismo rojo para un hipo de
  red y para un bloqueo de cuatro días. Distinguirlos pide **recordar las
  corridas anteriores** —una tabla nueva, migración incluida— y esa decisión no
  se tomó.
- **¿`geocode.py` también usa `json_de`?** Tiene el mismo `.json()` pelado
  contra Nominatim que costó cuatro corridas rojas del lado de los scrapers. Es
  una línea, pero no es el cron y no se tocó.
- **¿Se borra `context/look-and-feel/tokens.css`?** Tiene los valores de Verde
  Neón —`--background: #c8f0b8`, el verde menta que el rediseño del 2026-09-07
  reemplazó—, dice de sí mismo que es la copia de referencia que hay que
  sincronizar con `globals.css`, y el `CLAUDE.md` del área lo señala como "los
  valores vivos". Llevaba ocho días diciendo colores que ya no existen cuando
  se detectó el 2026-09-15. Se puede sincronizar o borrar; la recomendación es
  borrarlo y dejar la tabla del `CLAUDE.md` como única copia, porque una copia
  que hay que acordarse de sincronizar se vuelve a desincronizar. `verde-neon.md`
  ya conserva el registro histórico de esa ronda.
- **¿Los pines del mapa crecen a 44px?** Miden 30×30, contra los 44 de un
  objetivo táctil. Su tamaño es una decisión tomada —"a 30px es una mancha de
  color antes de ser un dibujo"— y agrandarlos cambia cómo se lee el mapa, no
  solo cómo se toca. Los controles de zoom a 29px y la atribución son de
  MapLibre y no se tocan.
- **¿La cartelera necesita filtro de fecha?** Es lo que peor salió del critique
  del 2026-09-15: 1 de 4 en "flexibilidad y eficiencia". Son 28 eventos del 17
  de septiembre al 16 de diciembre en un solo scroll, sin buscador ni forma de
  preguntar qué hay el viernes. **No es un defecto sino algo por diseñar**, y
  por eso no se hizo. Con los `id` de día que entraron ese mismo día, un riel de
  "esta semana / este mes" ya tiene a dónde anclar.
- **¿Se les devuelve el año al título de los festivales que ya están
  revisados?** A los festivales viejos el normalizador les quitó el año cuando
  todavía eran `music`, y **no se re-normalizaron porque tienen `reviewed_at`**
  — no hay forma de distinguir "Juan dejó ese título" de "Juan nunca lo miró",
  y pisar una edición del admin es lo que el modelo de moderación prohíbe. Si
  Juan confirma que esos títulos no fueron decisión suya, es una corrida y ya.
- **¿El riel de datos del artista también dice "Píllelo en"?** El encabezado de
  la agenda cambió el 2026-09-13, pero arriba, junto al origen, sigue la
  etiqueta "Toca en" con las salas. Es otro dato —dónde suele tocar, no
  cuándo— y cambiarlo dejaría la misma frase dos veces en una pantalla.
- **¿Se borra el secret `BMI_LASTFM_API_KEY`?** Ya no lo usa nadie.
- **¿Se suelta `canonical_events.price_text`?** Desde el 2026-09-02 no la lee
  nadie: el precio sale de `price_kind`/`price_min`/`price_max`. Se conservó
  porque soltarla borra datos irrecuperables. En `events` **sí se queda**: ahí
  es la evidencia cruda de lo que publicó la fuente.

---

## 2. Lo que quedó a medias

- **Dos rutas del cron no se han estrenado en CI, por falta de ocasión.** El
  mensaje que nombra al portero anti-bots y el "cero eventos es fallo": el
  primero necesita que alguien nos desafíe con el código nuevo puesto —la
  corrida 29 pasó entera—, y el segundo, que una fuente devuelva una lista
  vacía, que nunca ha ocurrido. Lo demás de esa tanda sí corrió: la anotación
  con la fuente y el motivo salió en la corrida 28.
- **El campo «Quiénes tocan» y el token `--danger` no se han visto
  renderizados.** Los dos viven en `/admin`, que pide sesión, y `npm run
  capturas` no entra ahí. Del token sí se comprobó lo que podía fallar callado:
  que `.text-danger` y `.bg-danger` existan en el CSS compilado, porque si
  Tailwind no hubiera reconocido el token la clase no generaría nada y el texto
  quedaría del color heredado **sin ningún error**.
- **La lista de artistas no se ha visto con datos reales en la cartelera.** Las
  113 filas tienen la columna vacía hasta que se corra el relleno (§ 1), así que
  hoy todo cae al camino de siempre. Lo verificado el 2026-09-15 es que **no hay
  regresión**, no que lo nuevo se vea bien.
- **El formulario de tracks de `/admin` no se ha usado.** Sin verificar:
  agregar un track pegando la dirección, **editarlo** (título, año, carátula) y
  quitarlo. `npm run capturas` no llega ahí porque `/admin` pide sesión.
- **Del `/admin` de eventos sigue sin verse el formulario.** El 2026-09-13 sí
  se miraron con sesión de admin la sección de Artistas, su ficha entera y el
  editor de notas; lo que no se ha visto renderizado desde los cambios del
  2026-09-08 es **el formulario de eventos**: el bloque de carga de afiche, los
  dos campos de fecha, y que guardar un evento al que se llegó con `?evento=`
  devuelva a su ficha pública.
- **Ninguna nota de contratapa está publicada con formato todavía**, así que
  el camino que pinta HTML en la ficha pública no se ha visto con datos reales.
  Las dos notas que hay son texto plano y se pintan por el otro camino. El CSS
  del bloque sí se comprobó el 2026-09-13 inyectando una nota de prueba en la
  página: viñetas, negrilla, itálica, párrafo centrado y enlace, los cinco
  bien.
- **El formulario de artistas no se ha probado guardando de verdad.** El
  2026-09-13 se verificó con sesión de admin que el aviso de lo que falta
  aparece y que la página baja hasta el campo, que la barra de formato produce
  `<strong>` y que lo pegado entra pelado — pero **sin apretar Guardar sobre
  los datos de Juan**. Que guardar vuelva a la lista y que publicar lleve a la
  ficha pública son dos caminos que solo se estrenan usándolos.
- **El módulo del directorio no se ha visto en un teléfono de verdad**, como el
  resto del sitio. Lo medible sí se cerró el 2026-09-15: la ficha de artista
  **se desplazaba 4 px en horizontal a 390 px** —dos `-mx-3` anidados contra los
  20 px de `px-5`— y se arregló. Vale como aviso: **eso lo encontró la medición
  y no lo vio la revisión visual**, porque una captura no muestra que la página
  se desplace. Un teléfono real y Safari siguen sin probarse.
- **Las tarjetas de compartir no se han visto como las ve WhatsApp.** Las
  etiquetas salen correctas en el HTML servido (verificado sobre `next start`
  el 2026-09-13, con afiche, sin afiche y sin descripción), pero un validador
  de Open Graph necesita una URL pública. **Se prueba al desplegar y no antes.**
- **El lector de afiches funciona y deja huecos.** Juan lo probó el 2026-09-08
  con saldo cargado: lee, y los campos que el afiche no dice quedan vacíos con
  su explicación en las notas. Queda sin ejercitar el caso extremo —un afiche
  sin año— pero el comportamiento de fondo está comprobado.
- **Ticketlive entra en 3 de cada 8 corridas, y así se queda.** El anti-bots de
  su hosting (SiteGround) le pone un CAPTCHA a la IP del runner en las demás.
  No se evade —regla dura— y el log ya dice quién lo frenó, así que la fuente
  sigue en el cron aportando lo que alcanza. **No hay nada que decidir acá**:
  si alguna vez se quiere cambiar, las únicas palancas legítimas están en
  `context/ingesta/fuentes-y-legalidad.md`.
- **10 eventos vigentes cuelgan solo de `visitbogota`, que ya no corre.** ⚠️
  **Este archivo decía 6 y decía que eran del Movistar; el 2026-09-13 se
  recontaron y son 10, en tres salas**: 6 del Movistar Arena, 3 del Parque
  Metropolitano Simón Bolívar (Rock, Hip Hop y Salsa al Parque) y 1 del Coliseo
  Medplus (La Pestilencia). Los seis del Movistar se reenganchan solos cuando su
  fecha entre en la ventana de un mes que publica la sala; **los otros cuatro
  no, porque ni el Simón Bolívar ni el Medplus tienen scraper**. Y el número
  crece solo: cada vez que una fuente viva deja de listar un evento, su fila
  cruda se poda y el canónico queda colgando de la congelada.
- **Nunca se ha desplegado a Vercel.** Es el siguiente paso — ver § 4. Hacen
  falta cuatro variables: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ANTHROPIC_API_KEY` y, desde el
  2026-09-13, **`NEXT_PUBLIC_SITIO_URL`** — de ella salen las direcciones
  absolutas de las tarjetas de compartir, el sitemap y el robots.txt. Sin ella
  se intenta el dominio que inyecta Vercel, y **eso no está comprobado**.
  ⚠️ Y hay algo más que **solo se prueba desplegado**: el route handler del
  afiche declara `maxDuration = 60`, el tope del plan Hobby, y ese límite es del
  entorno y no del código.
- **20 publicados sin revisar** (de 52). Tienen `reviewed_at` en null y eso es
  correcto: nadie los revisó. El número baja solo a medida que Juan toca cada
  evento por otro motivo.
- **20 publicados ya pasaron de fecha** y siguen en `publicado`. No se ven —la
  cartelera filtra por el inicio del día de hoy en Bogotá— así que no es un bug,
  y con los 32 vigentes cierran los 52. ⚠️ **Contarlos con `starts_at < now()`
  da de más**: un show de hoy que empezó hace dos horas sigue en pantalla,
  porque el corte es el **inicio del día**, no el instante.
- **Sin verificar, porque no se ve desde fuera del dashboard:** si el proyecto
  de Supabase todavía expone las **claves legacy JWT** (`anon` /
  `service_role`). Son un juego de credenciales aparte que la rotación de las
  `sb_*` del 2026-08-28 no tocó.
- **Cuatro `context/*/CLAUDE.md` pasaron de las ~150 líneas que su propia regla
  de tamaño fija**: look-and-feel 305, frontend 199, ingesta 188, moderación
  180. No es un problema de hoy —crecen desde el 2026-09-07— pero es cómo esta
  documentación se volvió ilegible la primera vez. Lo que sobra es relato: el
  diagnóstico del rediseño y lo que se descartó de la primera ronda tienen su
  `.md` de detalle esperándolos (`verde-neon.md`). **Es una pasada propia, no
  un arreglo al pasar**, y por eso sigue acá en vez de hacerse a medias.
- **Opcional:** añadir el secret `BMI_SUPABASE_PUBLISHABLE_KEY` al repo para
  que el CI prerenderice contra la base real en vez de contra placeholders.

---

## 3. Las cifras

⚠️ **Envejecen con cada corrida del cron y con cada sesión de triage:
recontarlas con una consulta, no citarlas de memoria.** Recontadas el
**2026-09-15 a las 01:50 de Bogotá** contra la base, con el MCP — **idénticas a
las del 2026-09-13**, porque el cron lleva un día en rojo y no ha habido
triage.

| | |
|---|---|
| Fuentes activas | **7** — movistar_arena, royal_center, lourdes, latino_power, rockal_live, idartes, ticketlive |
| Filas crudas | **130** — visitbogota 56 *(congeladas)*, movistar 16, royal 15, ticketlive 11, latino 10, lourdes 9, rockal 8, idartes 5 |
| Crudas sin clasificar | **0** |
| Canónicos | **113** — 52 publicados, 4 borradores, 57 descartados |
| En pantalla | **28 toques, 0 fiestas, 4 festivales** = 32 vigentes. La cartelera dice "28 toques en 10 salas" y el mapa "11 salas · 32 eventos": cuentan distinto **a propósito** (`context/frontend/CLAUDE.md`) |
| Publicados ya pasados | **20** — 32 + 20 cierran los 52 |
| Sin revisar | **20 de 52** publicados |
| Salas | **39 filas** — 20 publicadas, 2 por aprobar, 17 descartadas |
| Coordenadas | **20 de 20** — ninguna sala publicada queda sin ubicar |
| Fotos de sala | **13 de 20** |
| Afiche | **51 de 52** publicados — es la imagen de la tarjeta de compartir |
| Precio | **19 de 52** publicados |
| Género | **9 de 52** publicados, 5 géneros en uso, ninguno compuesto |
| Escena local marcada | **3 de 52** — se marca a mano y nada la calcula |
| **Directorio** | **2 artistas publicados**, 6 tracks entre los dos — El Kalvo entró el 2026-09-13 **sin ninguno** |
| **Carteles vinculados** | **1** — El Kalvo con su toque del 17 de octubre, el primero de todos |
| **Con lista de artistas** | **0 de 113** — la columna nació el 2026-09-15 y el relleno no se ha corrido |
| Bloqueados | **37** `(fuente, id)` — visitbogota 26, idartes 7, movistar 3, ticketlive 1 |
| Duplicados sugeridos | **0** — Juan resolvió los dos que había el 2026-09-13 |
| Tests | **262 backend + 142 frontend**, verdes en local y en CI (`Tests` sobre `3478d31`) |

Cómo leerlas sin equivocarse:

- ⚠️ **El estado de un canónico es `status`, no `published_at`.** Hay
  descartados que conservan la fecha en la que estuvieron publicados, y es
  correcto que la conserven.
- ⚠️ **"Salas 39" es el total de filas, no lo que se ve.** Las 17 descartadas
  existen y no aparecen en ningún lado.
- **Las fiestas cayeron a 0 y los festivales de 6 a 4** entre el 2026-09-09 y
  el 2026-09-13, sin que nadie tocara nada: se les pasó la fecha. La cartelera
  se vacía sola si no entra nada nuevo, y por eso el conteo de "en pantalla" no
  se puede citar de memoria ni de la semana pasada.
- ⚠️ **Las 56 filas de visitbogota están congeladas, no vivas.** La fuente salió
  del registry el 2026-09-08; sus filas quedan como registro y no se actualizan.
  Lo mismo vale para `scraped_at`, que es "cuándo se vio por primera vez" y no
  "última corrida": el upsert no lo reescribe.
- **Las filas crudas bajan además de subir.** El cron poda las que su fuente
  dejó de listar, así que el total no es un acumulado: entre el 2026-09-09 y
  hoy pasó de 126 a 130 después de haber tocado 131.
- **Las fiestas y los festivales tienen `is_local = null` y eso es correcto.**
  No hay un artista de cartel a quien preguntarle.
- **Los canónicos bajan al unificar duplicados.** Pasaron de 115 a 113 el
  2026-09-13 sin que se borrara nada: Juan confirmó las dos sugerencias, y
  unificar funde el borrador con el canónico que ya existía.

---

## 4. El siguiente paso

**Lo que había que resolver antes de desplegar quedó cerrado el 2026-09-13**:
`openGraph`, `robots.txt`, `sitemap.xml` y el `noindex` de `/admin`. Eran lo
que "se congela al desplegar y se nota en el primer enlace compartido", y ya no
bloquean nada.

1. 🎯 **Desplegar a Vercel.** **Nada de lo construido lo ha visto nadie más que
   Juan**, y hay cuatro cosas que **solo se prueban ahí**: el tope de 60 s del
   route handler del afiche, el sitio en un teléfono real, las tarjetas de
   compartir en un validador de Open Graph, y qué dominio resuelve
   `NEXT_PUBLIC_SITIO_URL` si no se configura. Las cuatro variables, en § 2.

2. **Más fuentes.** `mitaquilla.com.co` quedó confirmada abierta el 2026-09-08 —
   con el User-Agent correcto, ver `context/ingesta/fuentes-y-legalidad.md`— y
   `feverup.com` sigue sin explorar. Passline queda fuera: está detrás de una
   sala de espera virtual, y meter un cron ahí ocuparía puestos en una cola de
   compra.

3. **La pasada de identidad de la Fase 6.** El nombre definitivo y el look &
   feel final. Juan abrió el 2026-09-09 la vía de trabajar diseño en Figma con
   su MCP (plan gratis, servidor remoto): queda montada para esa pasada, sin
   usar todavía. ⚠️ **Arrastra una deuda desde el 2026-09-13**: la tarjeta de
   compartir del sitio entero no lleva imagen porque tendría que llevar la
   marca, y la marca todavía no existe.
