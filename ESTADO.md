# Estado del proyecto

Última actualización: **2026-09-16 al cierre del día**, recontado contra la
base con el MCP.

🚀 **El sitio está desplegado: `https://bogota-music-intel.vercel.app`**, desde
el 2026-09-16. Era el 🎯 de este archivo desde hacía semanas y **ya no es un
pendiente**: hay un sitio público que alguien que no sea Juan puede abrir.

Lo que hizo falta, para que conste y no se vuelva a buscar: **Root Directory =
`apps/web`**. Sin eso Vercel mira la raíz, no encuentra `package.json` —no hay,
esto no es un monorepo con workspaces— y detecta el framework como `other`. Las
variables son tres, no cuatro: `NEXT_PUBLIC_SITIO_URL` **no se puso a
propósito**, ver § 2.

El 2026-09-15 trajo el cartel de varios artistas, la primera pasada de diseño
con impeccable, el mapa completo y la unificación del corte del día de Bogotá;
el 2026-09-16, el despliegue, la revisión de seguridad que lo precedió y el
cambio de contraseña del admin.

**Y Juan hizo triage con las herramientas nuevas**: publicó un evento cargado a
mano con cinco bandas —el caso que originó todo esto—, sumó un artista al
directorio, vinculó el segundo cartel y aprobó una sala.

⚠️ **Al cierre del día se vació la pestaña «Ya pasaron»**: se borraron 26
canónicos con fecha anterior al 2026-09-15 y sus 32 filas crudas, porque en
local no aportaban nada. **Eso movió casi todas las cifras de § 3 hacia abajo
sin que nadie tocara el producto** — el género y la escena local perdieron
cobertura porque buena parte de lo marcado a mano era justamente lo viejo. Se
decidió **no bloquearlos**.

**Y el 2026-09-16 se vio qué costaba eso: cuatro volvieron.** La corrida del
cron reabrió como borradores a Bloodbath, Miami Horror, Guaco y Macaco, los
cuatro de `lourdes_music_hall` y todos con fecha de agosto o principios de
septiembre. **Lourdes mantiene sus eventos pasados listados indefinidamente**,
así que iban a volver en cada corrida. Se borraron de nuevo, esta vez **con
bloqueo** — y ahí sí corresponde, porque su `source_event_id` lleva la fecha
(`guaco-2026-08-22`) y no puede colisionar con una edición futura del mismo
artista. Es justo lo contrario de `jorge-drexler` o `feria-eva`.

🔒 **Antes de desplegar se hizo una revisión de seguridad, y encontró una cosa
seria**: la tabla cruda era legible entera por cualquiera. Se arregló el mismo
día. Qué se miró y qué dio, en **§ 5**.

Acá van los pendientes, las cifras y lo que quedó a medias. **`CLAUDE.md` y los
`context/*/CLAUDE.md` son reglas y criterio; este archivo es la foto de hoy.**
Si algo de acá se vuelve permanente, sube a un `CLAUDE.md`; si algo de un
`CLAUDE.md` caduca, baja acá.

---

## 1. Bloqueado en Juan (nadie más lo puede destrabar)

🔥 **Desde el 2026-09-16 esto dejó de poder esperar.** Juan decidió el
2026-09-09 que el contenido se cargaba sobre el sitio ya en pie, y esa
condición **ya se cumplió**: el sitio está desplegado. Lo que hasta ayer era
"le falta al producto" ahora **se ve en una página pública**, y encabeza § 4.

La primera que urge no es una cifra: son las tres notas de artista que dicen
"test".

- **El directorio tiene tres artistas y los seis tracks son de uno solo.**
  Nicolás y los Fumadores (6), El Kalvo (0) y Kidchen (0, entró el 2026-09-15).
  Tres no son un directorio: **una plataforma que existe para dar a conocer la
  escena con tres fichas no da a conocer nada**, y esa parte no la puede hacer
  nadie más porque ninguna base global sabe quiénes son. ⚠️ Y **dos de las tres
  no tienen nada que sonar**, que es justo lo que la ficha de artista hace
  bien: la de Nicolás es la única donde el módulo se ve entero.
- 🔥 **Las tres fichas publicadas tienen notas de prueba, y el problema crece
  con cada artista nuevo.** Dicen "hola / prueba / test / avisos / bajo /
  tierra / formato?" y "test" las otras dos —Kidchen entró así el 2026-09-15—,
  y **se ven en la página pública** — que desde el 2026-09-16 quiere decir **en
  internet**, en `bogota-music-intel.vercel.app/directorio`, no en una pestaña
  de localhost. Las notas de contratapa son el material propio del proyecto
  —lo único que no salió de otra parte— así que son justo lo que no podía
  quedar así el día del despliegue, y quedó. Las tres sí tienen
  foto y ciudad de origen. Al pasar: **`Kidchen` tiene la ciudad como
  `"Bogotá "`, con un espacio al final**, que es del tipo de cosa que después
  parte un agrupamiento en dos.
- **Hay dos carteles vinculados, y hacen falta muchos más.** El Kalvo con su
  toque del 17 de octubre y Kidchen con el suyo. Con dos, **las dos señales de
  recomendación que dependen de coincidencias siguen sin poder calcularse**
  ("compartieron cartel" y "también ha tocado en"): necesitan artistas que
  coincidan en carteles **distintos**, y estos dos están en toques separados.
  Se arma desde la ficha de cada toque (`context/moderacion/CLAUDE.md`).
- **8 de 21 salas publicadas sin foto.** Se pegan como URL en `/admin` → Salas,
  con vista previa. Desde el 2026-09-15 **todas las que tienen coordenada salen
  como pin** aunque no tengan nada anunciado.
- ⚠️ **Una sala publicada no tiene coordenada, y este archivo decía que no
  había ninguna.** Es `Carrera 24 #72 - 31`, que Juan creó a mano el 2026-09-15
  a las 03:06 junto con el toque de las cinco bandas. Cuando se escribió "las
  21 tienen coordenada" eran 20 de 20 y era cierto; **la sala 21 entró después
  y el numerador se quedó quieto**.

  **Lo que hay que decidir es más que geocodificarla**: su `name` es una
  dirección y su `address` está en null, o sea que el dato existe y está en el
  campo equivocado. Mientras siga así no se puede geocodificar, porque lo que
  se geocodifica es `address`. Y ponerle un nombre es una decisión editorial de
  Juan, no un arreglo: **un toque en un local sin nombre público es
  exactamente el caso de la escena underground que esta plataforma existe para
  cubrir**, y "la dirección como nombre" puede ser la respuesta correcta.
  Mientras tanto se lista como "sin ubicar", que es lo que manda la regla de no
  poner un pin aproximado.
- **2 salas por aprobar**: ⚠️ **no son las que decía este archivo.** Son
  **Parque de la 93** y **Teatro Panorama**. Ágora Bogotá y el MAMBO, que es lo
  que estaba escrito acá, **Juan las descartó el 2026-09-09 a las 02:34** y la
  línea nunca se actualizó: llevaba seis días nombrando dos salas resueltas e
  ignorando dos que sí esperan.

  Ninguna de las dos tiene eventos vigentes —lo único que cuelga de Teatro
  Panorama es un Santiago Cruz del 16 de septiembre ya descartado—, así que
  sigue sin correr prisa. **Se desvió porque la cola de salas se mueve sola con
  el cron y acá había nombres propios en vez de un conteo**; los nombres van
  con su fecha de verificación o no van.
- 🔥 **El género: 5 de 33 vigentes lo tienen**, con 6 en uso —Rock (2), y Hip
  Hop/Rap, Math Rock, Midwest Emo, Screamo y Vallenato con 1 cada uno—. Desde
  el 2026-09-08 **ninguna fuente lo escribe**: `generos` es columna propia
  (`text[]`, varios por evento) y la llena Juan en `/admin`. Ahora además **es
  la navegación del directorio**: los géneros del filtro salen de los eventos
  donde tocó cada artista, así que un directorio sin géneros se queda sin su
  único eje de exploración.

  ⚠️ **El borrado de lo pasado se llevó cobertura, no solo filas.** Antes eran
  9 de 53 publicados; los que tenían género eran en buena parte los viejos, así
  que la proporción apenas se movió pero **el trabajo manual de clasificar se
  perdió con ellos**. Los tres géneros nuevos —Math Rock, Midwest Emo,
  Screamo— son del toque que Juan cargó a mano, y son la señal de que la
  taxonomía útil para la escena no se parece a la que traían las salas grandes.
- **La escena local marcada: 3 de 33 vigentes**, más 1 confirmado que *no* y 29
  sin saber. Mismo caso: desde que se dio de baja MusicBrainz nada la calcula.
  La marca rosa solo sale si Juan la pone. **Los tres estados siguen separados**
  y el ranking solo castiga al confirmado que no.
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
- **¿Qué estilo de pestaña gana en `/admin`?** Eventos y Salas repiten doce
  líneas idénticas de markup subrayado y Artistas usa otro estilo para lo
  mismo. Unificarlas es una línea después de extraerlas, pero **cuál de los dos
  gana es de Juan** — y no se puede comprobar en píxeles, porque `npm run
  capturas` no llega a `/admin`, que pide sesión.
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

- ⏱️ **El caché de las páginas está en 60 segundos a propósito, y hay que
  subirlo el día que haya tráfico.** Estaba en 1800 —media hora— y el 2026-09-16
  eso se sintió: Juan publicó un evento desde `/admin` en el sitio desplegado y
  no salía en la cartelera, aunque por URL directa sí. No era un bug sino el
  CDN sirviendo una copia vieja.

  **La condición que dispara volver a subirlo es que el sitio tenga visitantes
  de verdad.** Hoy el caché no protege de nada —hay un solo visitante, que es
  Juan— y sí rompe el ciclo de publicar y comprobar. Cuando haya tráfico el
  cálculo se invierte y 60 segundos pasa a ser regenerar de más. El número y el
  porqué viven en `apps/web/src/lib/cache.ts`; `cache.test.ts` falla si alguna
  de las ocho rutas se desvía.

  ⚠️ **Lo que no se hizo, y es lo correcto cuando eso pase**: revalidación bajo
  demanda, un endpoint que `/admin` llame al publicar. Se descartó hoy porque
  su precio es una lista de llamadas a mantener —publicar, editar, quitar de la
  cartelera, descartar una sala— y una que se olvide deja ese camino con el
  retraso viejo sin que nada avise.
- ⚠️ **`/evento/[id]` y `/artista/[slug]` no se cachean nunca**, así que **cada
  visita a una ficha consulta Supabase**. Se ve en el build —salen como
  `ƒ (Dynamic)`, sin columna de revalidate— y se confirmó en producción:
  `X-Vercel-Cache: MISS` tres veces seguidas. Declaran `revalidate` como las
  demás, pero algo las vuelve dinámicas y **no se investigó cuál es la causa**.

  Hoy no duele porque no hay tráfico, y de hecho es lo que hizo que el evento
  recién publicado sí se viera por URL directa. Pero es lo primero que hay que
  mirar el día que el plan gratuito de Supabase empiece a apretar.

- ⚠️ **Hay un evento con la fecha en el año 0026.** "Carlos Rivera - Vida México
  Tour 2026" de `visitbogota`, con `starts_at` en `0026-10-02`, entró así el
  2026-09-01. Está descartado, así que no se ve en ningún lado — pero es un
  fallo de parseo real y **nada avisó**: una fecha absurda pasa los mismos
  chequeos que una buena. No se sabe si es el único; hay que mirar si el parser
  de esa fuente puede volver a producirla.
- **Dos rutas del cron sin estrenar en CI.**

  1. 🟡 **Que el bloqueo de Ticketlive salga en verde** (`BLOQUEO_CONOCIDO`, del
     2026-09-15). Probado en local y con tres tests —el bloqueo no pinta rojo,
     otro fallo de la misma fuente sí, y un portero en una fuente nueva
     también—, pero **sin una corrida real que lo ejercite**.

     ⚠️ **Van dos corridas verdes y ninguna sirve de prueba.** La de a mano del
     2026-09-15 16:24 UTC y la programada de las **17:55 UTC** (`run`
     35004254563) salieron verdes con **cero anotaciones** las dos, y el código
     anota igual cuando calla el color —solo cambia "FALLÓ" por "bloqueada"—.
     Confirmado que el mecanismo funciona: la corrida roja del 2026-09-14 sí
     expone las suyas.

     ✅ **El método de comprobación sí sirve, y quedó validado contra un caso
     positivo conocido**: el mismo endpoint devuelve las dos anotaciones de la
     corrida roja del 2026-09-14. Así que **cero anotaciones significa que
     Ticketlive entró bien**, y no hay ninguna ambigüedad.

     ⚠️ Este archivo llegó a afirmar que la había, apoyándose en que
     `max(scraped_at)` de Ticketlive es del 09-11. **No prueba lo que se le
     pidió probar**: `scraped_at` no se reescribe en el upsert (ver § 3), así
     que ese 09-11 dice cuándo entró su última fila **nueva**, no cuándo entró
     la fuente. Una fuente puede entrar bien y no traer nada nuevo.

     Lo que falta, entonces, es solo que **ocurra**: que Ticketlive esté
     bloqueada en una corrida. Cuando pase, la anotación saldrá como **aviso
     amarillo** y no como error (`::warning::`, desde el 2026-09-16), así que el
     color ya dice cuál de los dos casos fue sin leer el texto.

     **La corrida del 2026-09-16 a las 17:58 UTC fue la primera por `schedule`
     con el cambio puesto** (sobre `2a29482`) y salió verde con cero
     anotaciones, o sea que Ticketlive entró bien otra vez. Sigue sin
     estrenarse; ya no por falta de método sino por falta de ocasión.

  2. **"Traer cero eventos es fallo"**: necesita que una fuente devuelva una
     lista vacía, y nunca ha ocurrido.

  **Lo que sí se estrenó**, y bien: el mensaje que nombra al portero anti-bots
  salió en el log del 2026-09-14 con todo lo que tenía que decir —qué fuente,
  qué la frenó, el código 202, el `content-type` que no era JSON y el principio
  del cuerpo—. `json_de` hizo su trabajo: el error dice **qué** pasó y no solo
  que pasó algo.
- **Hay un paso de relleno escrito y sin correr, y no corre prisa.** `python -m
  bogota_music_intel.moderacion_cli --rellenar-artistas [--dry-run]` recalcula
  `artistas` y `gira` de los canónicos que ya existían. Rellena solo donde el
  título publicado es exactamente el que produce el normalizador desde el crudo;
  si difiere, alguien lo editó a mano y se salta — por eso no necesita mirar
  `reviewed_at`, que nunca supo distinguir "Juan dejó ese título" de "Juan nunca
  lo miró".

  **Afecta a los publicados que tienen "&" en el título y la columna vacía.**
  También se pueden arreglar a mano desde el formulario, que es lo que Juan
  viene haciendo: el 2026-09-15 llenó cuatro así. Lo dejó para después. Cuando
  se corra, es un `update` masivo sobre la única copia de la base y lo autoriza
  él.
- **El bloque «De la escena tocan» no se ha estrenado.** Sale solo en fiestas y
  festivales, y **no hay ninguna con artistas vinculados**: los dos carteles que
  existen son de toques, donde el enlace va dentro del título. Se ve el día que
  se le arme el cartel a un festival.
- ⚠️ **Dos eventos tienen la gira dentro del `title` y la columna vacía**, de
  haber sido revisados con el formulario intermedio del 2026-09-15 —el que
  todavía pedía título aparte—: El Kalvo y Jorge Celedón. Abrirlos y guardar
  habría recompuesto el título **sin la gira**, perdiéndola en silencio. Se
  arregló el mismo día haciendo que la desestructuración vaya **campo por campo**
  y no todo o nada, así que la gira se recupera del título al abrirlos. Queda
  anotado porque el dato sigue así en la base hasta que alguien los guarde.
  Verificado el 2026-09-15: los dos siguen con `gira` en null, y **el de Jorge
  Celedón es el 17 de septiembre**, así que si se quiere arreglar antes de que
  se le pase la fecha quedan dos días.
- **El relleno de `artistas` sigue sin correr**, y ahora hay **cinco** eventos
  con la columna llena porque Juan los tocó a mano. Ver el paso de abajo.
- **Hay un cambio de look sin commitear**, en
  `apps/web/src/components/TituloDeEvento.tsx`: el enlace del artista dentro
  del título deja el subrayado y pasa a **brillo con halo** en hover
  (`brightness-110` más `text-shadow` del acento). Es una decisión de estilo a
  medio tomar —el comentario de encima todavía explica por qué iba subrayado—
  y **no se ha visto en el navegador**. Lo decide Juan: o se termina y se
  commitea con el comentario corregido, o se descarta.
- **El formulario de tracks de `/admin` no se ha usado.** Sin verificar:
  agregar un track pegando la dirección, **editarlo** (título, año, carátula) y
  quitarlo. `npm run capturas` no llega ahí porque `/admin` pide sesión.
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
- ⚠️ **La portada promete una imagen de compartir que no tiene.**
  `layout.tsx:67` declara `twitter: { card: "summary_large_image" }` para todo
  el sitio, y la portada no lleva `og:image` —la deuda de la marca, § 4—. Esa
  tarjeta anuncia una imagen grande y no hay ninguna, así que X la degrada;
  WhatsApp no se entera porque lee `og:*`. **La etiqueta está afirmando algo
  falso mientras tanto.** Dos salidas: bajar la portada a `summary` hasta que
  haya marca, o dejarlo. **Es decisión de Juan**, que es quien afina la voz y la
  marca. Las fichas de evento no tienen el problema: las verificadas el
  2026-09-16 traen `og:image` con su `alt` y la imagen responde 200.
- **El lector de afiches funciona y deja huecos.** Juan lo probó el 2026-09-08
  con saldo cargado: lee, y los campos que el afiche no dice quedan vacíos con
  su explicación en las notas. Queda sin ejercitar el caso extremo —un afiche
  sin año— pero el comportamiento de fondo está comprobado.
- **Ticketlive entra cada vez menos: de 3 de cada 8 corridas pasó a 1 de cada
  6.** El anti-bots de su hosting (SiteGround) le pone un CAPTCHA a la IP del
  runner —202 con `text/html` y un refresco a `/.well-known/sgcaptcha/`— y desde
  el 2026-09-09 casi siempre. No se evade —regla dura— y el log dice quién lo
  frenó, así que la fuente sigue en el cron aportando lo que alcanza; sus
  últimas filas nuevas son del 2026-09-11.

  **Sobre la fuente no hay nada que decidir**: si alguna vez se quiere cambiar,
  las únicas palancas legítimas están en
  `context/ingesta/fuentes-y-legalidad.md`. Y desde el 2026-09-15 **su bloqueo
  ya no pinta la corrida de rojo**, así que el rojo vuelve a querer decir algo
  (`context/ingesta/CLAUDE.md`).
- **10 eventos vigentes cuelgan solo de `visitbogota`, que ya no corre.** ⚠️
  **Este archivo decía 6 y decía que eran del Movistar; el 2026-09-13 se
  recontaron y son 10, en tres salas**: 6 del Movistar Arena, 3 del Parque
  Metropolitano Simón Bolívar (Rock, Hip Hop y Salsa al Parque) y 1 del Coliseo
  Medplus (La Pestilencia). Los seis del Movistar se reenganchan solos cuando su
  fecha entre en la ventana de un mes que publica la sala; **los otros cuatro
  no, porque ni el Simón Bolívar ni el Medplus tienen scraper**. Y el número
  crece solo: cada vez que una fuente viva deja de listar un evento, su fila
  cruda se poda y el canónico queda colgando de la congelada.
- **`NEXT_PUBLIC_SITIO_URL` sigue sin configurarse, y es deliberado.** El
  despliegue del 2026-09-16 **comprobó el punto 2 de `lib/sitio.ts`**, que
  llevaba desde el 2026-09-13 anotado como no comprobable fuera de producción:
  sin esa variable, `VERCEL_PROJECT_PRODUCTION_URL` resuelve bien y el sitio se
  anuncia entero con su dominio —`og:url`, los 41 `<loc>` del sitemap y el
  `Sitemap:` del robots.txt, todos verificados con `curl` contra el sitio vivo—.

  Ponerla ahora sería una segunda copia del dominio que hay que acordarse de
  actualizar, que es el problema que ya tiene `tokens.css` con los colores. **Se
  decide el día que haya dominio propio**, que es cuando hay que revisar esto de
  todos modos. ⚠️ **Sin verificar**: si Vercel reapunta
  `VERCEL_PROJECT_PRODUCTION_URL` a un dominio custom. Ese día se mira.
- **Falta probar el tope de 60 s del lector de afiches**, que es de las cosas
  que solo se prueban desplegado: el route handler declara `maxDuration = 60`,
  el tope del plan Hobby, y ese límite es del entorno y no del código. Se
  ejercita subiendo un afiche en `/admin` **en el sitio desplegado**, no en
  local.
- 🔒 **No hay pantalla que reciba el token de recuperación de contraseña**, así
  que **"olvidé mi contraseña" sigue sin funcionar**. El 2026-09-16 se cubrió el
  otro caso —cambiarla con la sesión abierta, `CambioDeClave.tsx`— y eso alcanza
  para el día a día, pero con **un solo admin** el caso de olvidarla es el que
  deja a alguien fuera para siempre.

  Se descubrió intentando usarlo: el dashboard de Supabase **no deja escribir
  una contraseña nueva** —sus únicas acciones sobre un usuario son mandar
  recuperación o magic link— y el enlace del correo aterriza donde diga la
  `Site URL` sin que nada lea el token. La `Site URL` ya apunta a producción
  desde el 2026-09-16; lo que falta es la pantalla.

  ⚠️ **Y `Redirect URLs` está vacío**, así que el día que exista esa pantalla y
  se quiera probar en local hay que añadir `http://localhost:3000/**`. Hoy no
  rompe nada porque ni `signInWithPassword` ni `updateUser` redirigen.
- **9 publicados sin revisar** (de 34). Tienen `reviewed_at` en null y eso es
  correcto: nadie los revisó. El número baja solo a medida que Juan toca cada
  evento por otro motivo.
- ⚠️ **Contar lo pasado con `starts_at < now()` da de más**: un show de hoy que
  empezó hace dos horas sigue en pantalla, porque el corte es el **inicio del
  día en Bogotá**, no el instante. Es `inicioDeHoyEnBogota()`, y desde el
  2026-09-15 **está escrita una sola vez**, en `apps/web/src/lib/fechas.ts`.
- **Sin verificar, porque no se ve desde fuera del dashboard:** si el proyecto
  de Supabase todavía expone las **claves legacy JWT** (`anon` /
  `service_role`). Son un juego de credenciales aparte que la rotación de las
  `sb_*` del 2026-08-28 no tocó.
- **Cuatro `context/*/CLAUDE.md` pasan de las ~150 líneas que su propia regla
  de tamaño fija**, y ⚠️ **los cuatro son más grandes de lo que este archivo
  decía**: look-and-feel **314** (decía 305), moderación **250** (decía 180),
  frontend **226** (decía 199), ingesta **216** (decía 188). Recontados con
  `wc -l` el 2026-09-15. Los otros cuatro están holgados: infraestructura 127,
  editorial 121, producto 52, archivo 51.

  No es un problema de hoy —crecen desde el 2026-09-07— pero es cómo esta
  documentación se volvió ilegible la primera vez, y **el que más creció es el
  que nadie estaba mirando**: moderación sumó 70 líneas desde la última
  medición. Lo que sobra es relato: el diagnóstico del rediseño y lo que se
  descartó de la primera ronda tienen su `.md` de detalle esperándolos
  (`verde-neon.md`). **Es una pasada propia, no un arreglo al pasar**, y por eso
  sigue acá en vez de hacerse a medias.
- **Opcional:** añadir el secret `BMI_SUPABASE_PUBLISHABLE_KEY` al repo para
  que el CI prerenderice contra la base real en vez de contra placeholders.

---

## 3. Las cifras

⚠️ **Envejecen con cada corrida del cron y con cada sesión de triage:
recontarlas con una consulta, no citarlas de memoria.** Recontadas el
**2026-09-15 al cierre del día** contra la base, con el MCP, **después del
borrado de lo pasado**.

⚠️ **Los denominadores cambiaron de "publicados" a "vigentes".** Antes los 53
publicados incluían 20 que ya habían pasado, así que "9 de 53" mezclaba lo que
se ve con lo que no. Ahora que lo pasado se borró, publicados (34) y vigentes
(33) casi coinciden — pero el denominador que importa para la cobertura es
siempre **lo que está en pantalla**.

| | |
|---|---|
| Fuentes activas | **7** — movistar_arena, royal_center, lourdes, latino_power, rockal_live, idartes, ticketlive |
| Filas crudas | **102** — visitbogota 43 *(congeladas)*, royal 13, movistar 11, ticketlive 10, rockal 8, latino 7, idartes 5, lourdes 5 |
| Crudas visibles para un anónimo | **36 de 102** — solo las de canónicos publicados, desde el 2026-09-16. Comprobado con la publishable key, no deducido de la política |
| Crudas sin clasificar | **0** |
| Crudas huérfanas | **0** — ninguna quedó sin canónico tras los dos borrados, que es lo que evita que el `moderacion_cli` les abra borrador nuevo |
| Canónicos | **93** — 34 publicados, 9 borradores, 50 descartados |
| **Dónde vive** | **`bogota-music-intel.vercel.app`** desde el 2026-09-16 · Vercel Hobby (⚠️ no comercial) · Root Directory `apps/web` · 3 variables, sin `NEXT_PUBLIC_SITIO_URL` (§ 2) |
| En pantalla | **29 toques, 0 fiestas, 4 festivales** = 33 vigentes, en **12 salas**. La cartelera y el mapa cuentan distinto **a propósito** — desde el 2026-09-15 el mapa muestra **todas** las salas publicadas, con eventos o sin ellos (`context/frontend/CLAUDE.md`) |
| Publicados ya pasados | **1** — `Casi`, el único que sobrevivió a los dos borrados por ser cargado a mano |
| Sin revisar | **9 de 34** publicados |
| Salas | **40 filas** — 21 publicadas, 2 por aprobar, 17 descartadas |
| Coordenadas | ⚠️ **20 de 21** — la que falta es `Carrera 24 #72 - 31`, y se lista como "sin ubicar" en vez de recibir un pin aproximado, que es lo correcto. Las otras 20 salen en el mapa aunque no tengan nada anunciado |
| Fotos de sala | **13 de 21** |
| Afiche | **33 de 33** vigentes — es la imagen de la tarjeta de compartir |
| Precio | **11 de 33** vigentes |
| Género | **5 de 33** vigentes, **6 géneros en uso**: Rock (2), y Hip Hop/Rap, Math Rock, Midwest Emo, Screamo y Vallenato con 1 cada uno |
| Escena local marcada | **3 de 33** vigentes — más 1 confirmado que *no*, y 29 sin saber. Se marca a mano y nada la calcula |
| **Directorio** | **3 artistas publicados**, **6 tracks concentrados en 1** — Kidchen entró el 2026-09-15 |
| **Carteles vinculados** | **2** — El Kalvo y Kidchen, los dos en toques |
| **Con lista de artistas** | **5 de 93** — los que Juan tocó el 2026-09-15; el relleno de los viejos sigue sin correr (§ 2) |
| Bloqueados | **41** `(fuente, id)` — visitbogota 26, idartes 7, lourdes 4, movistar 3, ticketlive 1. El borrado del 2026-09-15 no sumó ninguno a propósito; los 4 de lourdes entraron el 2026-09-16 y el motivo está escrito en la fila |
| Duplicados sugeridos | **0** — Juan resolvió los dos que había el 2026-09-13 |
| Tests | **267 backend + 198 frontend**, verdes en CI. Los 20 nuevos del frontend son de `lib/admin/clave.ts` y `lib/cache.ts` |

Cómo leerlas sin equivocarse:

- ⚠️ **El estado de un canónico es `status`, no `published_at`.** Hay
  descartados que conservan la fecha en la que estuvieron publicados, y es
  correcto que la conserven.
- ⚠️ **"Salas 40" es el total de filas, no lo que se ve.** Las 17 descartadas
  existen y no aparecen en ningún lado.
- **Las fiestas cayeron a 0 y los festivales de 6 a 4** entre el 2026-09-09 y
  el 2026-09-13, sin que nadie tocara nada: se les pasó la fecha. La cartelera
  se vacía sola si no entra nada nuevo, y por eso el conteo de "en pantalla" no
  se puede citar de memoria ni de la semana pasada.
- ⚠️ **Las 43 filas de visitbogota están congeladas, no vivas.** La fuente salió
  del registry el 2026-09-08; sus filas quedan como registro y no se actualizan.
- ⚠️ **`scraped_at` es "cuándo se vio por primera vez" y el upsert NO lo
  reescribe.** `save_events` sube solo las columnas que arma en `rows`, y
  `scraped_at` únicamente tiene `default now()`, que en Postgres aplica al
  insertar y no en el `do update`.

  **Esta línea llegó a decir lo contrario durante unas horas el 2026-09-15, y
  vale la pena registrar por qué**: se vio que `royal_center` tenía
  `max(scraped_at)` en la hora exacta de la corrida del cron y se concluyó que
  el upsert lo reescribía, cuando la explicación es que ese día **insertó una
  fila nueva**. Una correlación con la hora de la corrida y ninguna lectura del
  código. De ahí sale que `max(scraped_at)` de una fuente responde "cuándo
  entró su última fila **nueva**" y **no** "cuándo entró la fuente por última
  vez" — que era justo la pregunta que se le estaba haciendo.
- **Las filas crudas bajan además de subir**, y por tres motivos distintos: el
  cron poda las que su fuente dejó de listar **y todavía no han ocurrido**
  (`_prune_missing_events`), el cron trae nuevas, y el 2026-09-15 y el
  2026-09-16 se borraron a mano 32 y 4. El total no es un acumulado: 131 → 99
  el 15, y 106 → 102 el 16, con la corrida del cron de por medio. **Citarlo de
  memoria no sirve ni de un día para otro.**
- **Las fiestas y los festivales tienen `is_local = null` y eso es correcto.**
  No hay un artista de cartel a quien preguntarle.
- **Los canónicos bajan al unificar duplicados.** Pasaron de 115 a 113 el
  2026-09-13 sin que se borrara nada: Juan confirmó las dos sugerencias, y
  unificar funde el borrador con el canónico que ya existía.

---

## 4. El siguiente paso

**El 🎯 de este archivo era desplegar, y se cumplió el 2026-09-16.** Lo que
sigue no es técnico.

1. 🎯 **Llenar el directorio, y antes que nada borrar las notas de prueba.**
   Sube al primer puesto por una razón que no es de gusto: **lo decidió Juan el
   2026-09-09 y su condición ya se cumplió**. Dijo que el contenido se cargaba
   sobre el sitio ya en pie; el sitio está en pie. Y mientras tanto tres fichas
   que dicen "test" están en internet, no en una pestaña de localhost.

   El detalle de qué falta —tres artistas, dos sin tracks, 5 de 33 con género,
   3 de 33 marcados como escena— está en § 1. **Nada de eso lo puede hacer otro
   que Juan**: ninguna base global sabe quién es El Kalvo.

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
   marca, y la marca todavía no existe — y desde el despliegue eso además deja
   una etiqueta afirmando algo falso (§ 2).

---

## 5. La revisión de seguridad del 2026-09-16

Se hizo antes de desplegar y **encontró una cosa seria**, que se arregló el
mismo día. Queda acá porque es el registro de qué se miró: repetirla entera
cuesta una hora, y saber qué ya se revisó evita mirarlo dos veces.

- 🔒 **`events` tenía lectura pública sin filtro** —la única de las ocho tablas—
  y dejaba ver 70 de 106 filas: los borradores y lo descartado, que es el
  criterio editorial de Juan en bruto. Venía de la primera migración, de cuando
  esa tabla era lo que el frontend mostraba. Cerrado en
  `20260916180000_events_solo_lo_publicado.sql`.

  **Verificado por los dos lados, que es lo que lo cierra**: con la publishable
  key un anónimo pasa de 106 filas a 36 y los borradores devuelven `[]`; y en el
  navegador con la sesión de Juan, el bloque «Ver lo que publican las fuentes»
  de un evento con **dos** fuentes las sigue trayendo completas. Se eligió a
  propósito un publicado con dos fuentes y no un borrador de una: si la política
  de admin se hubiera roto, el contador habría dicho `(0)`.
- ✅ Build, `tsc`, ESLint y los tests, verdes.
- ✅ RLS activo en las ocho tablas.
- ✅ Las tres RPC destructivas —`borrar_evento`, `descartar_sala`,
  `unificar_duplicado`— están expuestas a `anon` vía REST, **pero las tres
  tienen `es_admin()` como primera línea**. El linter de Supabase las marca y no
  son un agujero: la defensa está dentro de la función, no en el permiso de
  `execute`.
- ✅ `admins` tiene RLS sin ninguna política, y es **correcto a propósito**: así
  nadie la lee, y `es_admin()` entra por ser `security definer`. El linter lo
  reporta como aviso y no hay nada que arreglar.
- ✅ `/api/afiche` —lo único que cuesta plata— exige `Authorization` y llama a
  `es_admin()`: 401 sin sesión, 403 si no es admin. Nadie gasta el saldo de
  Anthropic abriendo el sitio. Y `robots.txt` bloquea `/api/`.
- ✅ **La protección de contraseñas filtradas**, que estaba desactivada, la
  activó Juan el 2026-09-16.
- ⚠️ **Sin verificar**: si el proyecto todavía expone las claves legacy JWT.
  Sigue sin poderse mirar desde fuera del dashboard, y es lo único de esta lista
  que quedó abierto.
