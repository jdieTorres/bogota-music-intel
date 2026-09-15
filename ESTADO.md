# Estado del proyecto

Última actualización: **2026-09-15 por la tarde**, recontado contra la base con
el MCP. La sesión trajo el cartel de varios artistas, la primera pasada de
diseño con impeccable, el mapa completo, y la reestructuración de los dos
formularios de `/admin`.

**Y Juan hizo triage con las herramientas nuevas**: publicó un evento cargado a
mano con cinco bandas —el caso que originó todo esto—, sumó un artista al
directorio, vinculó el segundo cartel y aprobó una sala.

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

- 🔴 **El cron falla 5 de cada 6 días desde el 2026-09-09**, y eso es peor de
  lo que este archivo venía diciendo. Contado el 2026-09-15 sobre las corridas
  **agendadas** (`event=schedule`, las de `workflow_dispatch` no cuentan): 14
  verdes de 19 en total, pero **de las últimas seis solo pasó la del 13**. Del
  3 al 8 estaban todas en verde; el deterioro empieza el 9.

  El paso que cae es `Run event scrapers`. Desde `892b3c5` el rojo dice qué
  fuente cayó y por qué, y ese mensaje está en el log — que la API pública no
  deja leer sin token, así que **hay que abrirlo con sesión**:
  `github.com/jdieTorres/bogota-music-intel/actions/runs/34884325706`.

  ⚠️ **Y la hora programada no es la hora real.** El workflow dice `0 14 * * *`
  —las 9:00 de Bogotá— pero GitHub lo dispara con retraso: las últimas doce
  corridas salieron entre las 16:32 y las 19:01 UTC, o sea entre las 11:32 a. m.
  y las 2:01 p. m. de acá. Si a las 9:30 no hay corrida, no está roto.
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
  y **se ven en la página pública**. Las notas de contratapa son el material
  propio del proyecto —lo único que no salió de otra parte— así que son justo
  lo que no puede quedar así el día que esto se despliegue.
- **Hay dos carteles vinculados, y hacen falta muchos más.** El Kalvo con su
  toque del 17 de octubre y Kidchen con el suyo. Con dos, **las dos señales de
  recomendación que dependen de coincidencias siguen sin poder calcularse**
  ("compartieron cartel" y "también ha tocado en"): necesitan artistas que
  coincidan en carteles **distintos**, y estos dos están en toques separados.
  Se arma desde la ficha de cada toque (`context/moderacion/CLAUDE.md`).
- **8 de 21 salas publicadas sin foto.** Se pegan como URL en `/admin` → Salas,
  con vista previa. Es lo único que le falta al mapa: las 21 tienen coordenada,
  ninguna se lista como "sin ubicar", y desde el 2026-09-15 **todas salen como
  pin** aunque no tengan nada anunciado.
- **2 salas por aprobar**: Ágora Bogotá Centro de Convenciones y Museo de Arte
  Moderno de Bogotá MAMBO. Ninguna tiene eventos vigentes, así que no corre
  prisa.
- 🔥 **El género: 9 de 53 publicados lo tienen**, con 5 en uso —Rock, Hip
  Hop/Rap, Popular, Reggaeton, Vallenato—. Desde el 2026-09-08 **ninguna fuente
  lo escribe**: `generos` es columna propia (`text[]`, varios por evento) y la
  llena Juan en `/admin`. Ahora además **es la navegación del directorio**: los
  géneros del filtro salen de los eventos donde tocó cada artista, así que un
  directorio sin géneros se queda sin su único eje de exploración.
- **La escena local marcada: 4 de 53.** Mismo caso: desde que se dio de baja
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
- **El relleno de `artistas` sigue sin correr**, y ahora hay cuatro eventos con
  la columna llena porque Juan los tocó a mano. Ver el paso de abajo.
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
**2026-09-15 a las 10:50 de Bogotá** contra la base, con el MCP.

| | |
|---|---|
| Fuentes activas | **7** — movistar_arena, royal_center, lourdes, latino_power, rockal_live, idartes, ticketlive |
| Filas crudas | **130** — visitbogota 56 *(congeladas)*, movistar 16, royal 15, ticketlive 11, latino 10, lourdes 9, rockal 8, idartes 5 |
| Crudas sin clasificar | **0** |
| Canónicos | **114** — 53 publicados, 4 borradores, 57 descartados |
| En pantalla | **29 toques, 0 fiestas, 4 festivales** = 33 vigentes. La cartelera dice "29 toques en 11 salas" y el mapa "21 salas · 33 eventos": cuentan distinto **a propósito** — desde el 2026-09-15 el mapa muestra **todas** las salas publicadas, con eventos o sin ellos (`context/frontend/CLAUDE.md`) |
| Publicados ya pasados | **20** — 33 + 20 cierran los 53 |
| Sin revisar | **18 de 53** publicados |
| Salas | **40 filas** — 21 publicadas, 2 por aprobar, 17 descartadas |
| Coordenadas | **21 de 21** — ninguna sala publicada queda sin ubicar, y **las 21 salen en el mapa** aunque no tengan nada anunciado |
| Fotos de sala | **13 de 21** |
| Afiche | **52 de 53** publicados — es la imagen de la tarjeta de compartir |
| Precio | **19 de 53** publicados |
| Género | **9 de 53** publicados, 5 géneros en uso, ninguno compuesto |
| Escena local marcada | **4 de 53** — se marca a mano y nada la calcula |
| **Directorio** | **3 artistas publicados** — Kidchen entró el 2026-09-15 |
| **Carteles vinculados** | **2** — El Kalvo y Kidchen, los dos en toques |
| **Con lista de artistas** | **4 de 114** — los que Juan tocó el 2026-09-15; el relleno de los viejos sigue sin correr (§ 2) |
| Bloqueados | **37** `(fuente, id)` — visitbogota 26, idartes 7, movistar 3, ticketlive 1 |
| Duplicados sugeridos | **0** — Juan resolvió los dos que había el 2026-09-13 |
| Tests | **262 backend + 168 frontend**, verdes en local y en CI (`Tests` sobre `580dbf6`) |

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

⚠️ **Y desde el 2026-09-15 hay algo que compite con el orden de abajo:** el
cron falla 5 de cada 6 días desde el 9 (§ 1). Mientras no corra, la cartelera
**se vacía sola** —los eventos pasan de fecha y no entra nada nuevo— así que
desplegar un sitio que se está vaciando es desplegar un problema. Leer ese log
cuesta un minuto con sesión y decide si esto es la primera tarea o la última.

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
