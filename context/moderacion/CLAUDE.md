# Moderación — el scraping propone, el admin publica

Decidido el 2026-08-31. **Ningún evento se publica solo.** El cron sigue
corriendo igual, pero lo que trae entra como **borrador** a una cola de
revisión; Juan verifica, completa y publica.

**Por qué se hace:** no es un problema de calidad sino de **sesgo de
cobertura**. Las fuentes actuales tiran a salas grandes, donde tocan los
internacionales; el toque local en un bar chico, anunciado solo por Instagram,
es invisible para el pipeline — y promover ese toque es el propósito de la
plataforma.

## Las dos capas

- **`events`** es el crudo: una fila por fuente, que el cron reescribe libre y
  el admin nunca toca.
- **`canonical_events`** es el evento canónico: una fila por show real, con los
  valores aprobados, colgando de una o varias filas crudas. **Lo que se
  muestra sale del canónico** — la cartelera, el mapa y el detalle lo leen.

El canónico es la identidad que faltaba: el upsert garantiza unicidad solo
dentro de una fuente, por eso el mismo show llegaba dos veces. Revisar es
"publicar como nuevo" o "adjuntar a uno que ya existe".

## Reglas que no se negocian

- **Las ediciones del admin van en columnas propias, nunca encima de las
  scrapeadas.** El scraper reescribe `title`, `starts_at` y `price_text` en
  cada corrida; una corrección hecha en el mismo campo se pierde al día
  siguiente. Que sobrevivan no es una promesa: es lo que ya pasa, porque el
  upsert de `save_events` sube solo sus propias columnas.
- **Toda sobrescritura del origen pasa por aprobación.** Si la sala mueve el
  precio o la fecha de algo publicado, el evento vuelve a la cola etiquetado.
  Lo mismo si desaparece: avisa en vez de esfumarse.
- **Tanto aceptar como rechazar actualizan `source_snapshot`.** El snapshot es
  "lo que ya vi de la fuente", no "lo que muestro": sin actualizarlo al
  rechazar, el mismo cambio volvería a la cola en cada corrida para siempre.
- ⚠️ **Unificar un duplicado deja `source_snapshot` en null a propósito**, y
  `moderacion_cli` lo rearma en la corrida siguiente. El canónico acaba de
  sumar una fuente, así que la foto vieja marcaría un cambio falso; y sin el
  paso que la rearma, ese evento dejaría de vigilarse para siempre.
- **No hay política de DELETE sobre ninguna tabla.** La única forma de borrar
  es `borrar_evento()`.
- ⚠️ **Vaciar lo ya pasado NO va por `borrar_evento()`**, porque esa función
  bloquea `(source, source_event_id)` para siempre y **"ya pasó" es una fecha,
  no una decisión editorial**. Varios `source_event_id` no llevan año
  —`jorge-drexler`, `feria-eva`— así que bloquearlos mataría en silencio la
  edición siguiente. Se borran las filas crudas **primero** y el canónico
  después: `events.canonical_id` es `on delete set null`, así que al revés
  quedan crudas sueltas y el `moderacion_cli` les abre borrador nuevo. Lo que
  la fuente siga listando volverá a la cola, y eso es lo correcto: es la fuente
  diciendo que el evento sigue vivo.
- ⚠️ **Descartar una sala baja sus eventos de la cartelera, y va por RPC.**
  `descartar_sala()` pone la sala en `descartado` y devuelve sus eventos
  publicados a `borrador`, en una sola operación. Hasta el 2026-09-09 solo
  hacía lo primero, y como RLS no deja ver una sala descartada, esos eventos
  seguían públicos con el embed en null: la cartelera escribía **"Sala por
  confirmar" sobre una sala que sí se sabía**. Bajan a `borrador` y no a
  `descartado` porque a un evento sin lugar válido le falta un dato, no le
  sobra: descartarlo sería un juicio que nadie hizo. Y `/admin` **advierte
  antes, con la lista de los eventos que se lleva** — el conteo no alcanza,
  porque la decisión depende de cuáles son.
- **Una sala que dejó de valer se reasigna, no se pierde.** El formulario del
  evento tiene selector de sala desde el 2026-09-09: sin él, la regla de
  arriba dejaba los eventos en un callejón sin salida.

## `/admin`

Dos secciones separadas, **Eventos** y **Salas**, porque son dos ciclos de
vida distintos: un evento caduca y una sala no. Los módulos van igual de
separados (`lib/admin/eventos.ts`, `salas.ts`, `sesion.ts`, `slug.ts`).

Tres pestañas de eventos: *Por revisar* (la cola que caduca), *En la cartelera*
(lo publicado vigente) y *Ya pasaron*. Los mismos controles están en la página
de cada evento, para quien está mirando la cartelera y ve algo mal.

**El cartel —quién tocó— se arma solo desde la ficha del toque**, no desde
`/admin` (`components/CartelDeAdmin.tsx`, dentro del bloque de admin de la
ficha). Ahí es donde se sabe: uno está mirando el afiche y la descripción, que
es donde están los nombres. El campo busca entre los artistas que ya existen
—**incluidos los borradores**, o el segundo toque de alguien crearía un
duplicado— y crea el que falte.

- ⚠️ **Crear desde ahí también vincula, y esa es la mitad que importa.** Un
  artista suelto en el directorio no conecta nada: son los vínculos los que
  dan "compartieron cartel" y "también ha tocado en".
- **El artista nace en borrador y el vínculo no se ve en público hasta que se
  publique** — la política de lectura de `event_artists` solo muestra vínculos
  entre filas publicadas. Se anota cuando se sabe y se publica cuando la ficha
  está lista.
- **Quitar del cartel borra el vínculo y nada más.** Es lo que hace reversible
  equivocarse; ni el artista ni el evento se tocan.

### Dos listas de artistas, y no se colapsan

Desde el 2026-09-15 hay dos, y la diferencia es la de siempre —lo que dijo una
fuente contra lo que afirmó una persona—:

- **`canonical_events.artistas`** es lo que leyó la fuente o el afiche, en el
  orden en que venía. La llena la ingesta, la corrige el admin en el campo
  «Quiénes tocan», y **se pinta como texto sin enlace**: que un nombre coincida
  con una ficha no prueba que sea el mismo artista.
- **`event_artists`** es el cartel: fichas del directorio vinculadas a mano
  desde la ficha del toque. Es lo único que enlaza y lo único que alimenta las
  recomendaciones.

Cuando hay cartel, manda el cartel. Escribir en el campo no crea ninguna ficha
ni vincula a nadie — para eso está el cartel, donde se está mirando el afiche.

⚠️ **En un festival el bloque se llama «De la escena tocan», no «En el
cartel».** Rock al Parque tiene decenas de artistas y nadie va a vincularlos
todos; rotular cinco fichas como el cartel afirmaría por omisión un lineup que
nadie verificó. Es una selección editorial —lo que esta plataforma puede
aportar y el sitio del festival no— y el pie lo dice y remite al anuncio.

### El formulario de artistas

- **Lo que falta se dice en el campo que falta, no arriba de la página.** La
  base sigue siendo la garantía —`artista_publicado_necesita_evidencia` es una
  restricción de verdad— pero su mensaje es para quien lee logs. El formulario
  lo traduce antes de llamar (`lib/admin/validacion.ts`), pinta el aviso debajo
  del campo y **baja hasta él**: decir qué falta no sirve si el aviso queda
  fuera de pantalla en una ficha larga.
- **Guardar vuelve a la lista; publicar lleva a la ficha pública.** Lo que
  sigue después de publicar es ver cómo quedó, no volver a una lista donde ese
  artista ya no está.
- **Guardar va en azul y publicar en verde**, y no es decoración: el verde es
  el acento de la marca y se gasta en la acción que decide algo. Guardar se
  repite veinte veces mientras se escribe una ficha.
- **Las notas de contratapa se escriben con formato** y son el único campo del
  sitio que lo tiene: son el único texto que no salió de otra parte. Se guarda
  HTML contra una lista blanca (`lib/texto-rico.ts`), **lo pegado entra como
  texto plano** —sin la fuente ni el color de donde venga— y las notas
  escritas antes del editor se siguen pintando como texto plano, sin tocarlas.

**Quién puede escribir lo decide la tabla `admins` y RLS, no el frontend**
(`20260831020000_admin.sql`). Se hizo con lista y no con "cualquiera
autenticado" porque el registro público de Supabase Auth se configura en el
panel y no en el repo: si mañana quedara abierto, `to authenticated` dejaría
publicar a cualquiera que se registrara.

### Descartar, borrar y confirmar duplicados

- **`descartado` saca de la cartelera y es reversible.**
- **Borrar** elimina el canónico y sus filas crudas y anota
  `(source, source_event_id)` en `blocked_source_events`. Sin ese bloqueo el
  borrado no sirve: el cron abre un borrador nuevo en la corrida siguiente.
  Las tres cosas van en `borrar_evento()` para que ocurran juntas o ninguna, y
  **exige un motivo**: un borrado que no registra por qué no se puede
  auditar.
- ⚠️ **"Borrar" y "No va" están a un clic de distancia y hacen cosas muy
  distintas.** Ya se borró por error un evento que sí era música, arrastrado
  por la tanda de teatro que lo rodeaba. Si vuelve a pasar, conviene alejar el
  botón o pedir doble confirmación cuando el evento está clasificado como
  música. Se recupera quitando su fila de `blocked_source_events` y esperando
  al cron.
- **Confirmar duplicados**: `deduplicacion.py` anota `suggested_duplicate_of`
  y el admin decide. El panel **muestra el otro evento, no solo su id**: sin
  ver contra qué se compara, confirmar es adivinar. Al confirmar, las fuentes
  del borrador pasan al canónico y el borrador desaparece
  (`unificar_duplicado()`, en una transacción).

### Salas

Las salas también se moderan (`venues.status`). Antes una sala nacía sola en
cuanto un evento la nombraba, con el nombre que le pone la fuente. El scraper
no cambió: `upsert_venues` no manda `status`, así que la sala nueva toma el
default `borrador`.

- **No hay borrado de salas, a propósito**: sus eventos la referencian por
  `venue_id` y el scraper la recrearía. `descartado` es la respuesta.
- ⚠️ **El slug de una sala creada a mano tiene que coincidir con el que genera
  `python-slugify`** en la ingesta, o el día que un scraper publique esa sala
  la crearía de nuevo y los eventos quedarían repartidos entre las dos copias.
  `lib/admin/slug.ts` lo replica y `slug.test.ts` lo compara contra 17 salidas
  reales ("Ñoño's Pub" da `nono-s-pub`, no `nonos-pub`).
- **La foto de la sala se pega como URL, con vista previa** (desde el
  2026-09-08). Ninguna fuente que scrapeamos publica foto del venue, así que
  este es el único camino por el que entra. La vista previa no es adorno: una
  URL pegada falla callada de tres maneras —el sitio la sirve solo a quien
  viene de su propia página, la de Instagram caduca, o el enlace apunta a la
  página y no a la imagen— y las tres se guardan sin error. Que se vea antes
  de guardar es la diferencia entre enterarse ahí o cuando alguien abre el
  mapa. El criterio de qué foto sirve está en el propio formulario, que es
  donde hace falta.

### Carga manual

Evento nuevo (entra como borrador, a la misma cola, para que no haya un camino
que se salte la revisión) y sala nueva.

**La sala nace publicada si se crea desde su propia sección y en borrador si se
escribe al vuelo desde el formulario de un evento** (2026-09-15). La diferencia
es de información, no de confianza: quien entra a Salas se sentó a llenar
dirección, coordenada y foto; quien escribe el nombre en el formulario de un
evento tiene un nombre leído de un flyer y nada más, y pedirle la ficha entera
en ese momento lo obliga a abandonar el evento a medio cargar — que es lo que
esa opción viene a evitar. ⚠️ **Hay un orden que importa: se aprueba la sala
antes de publicar el evento**, o la ficha escribe "sala por confirmar" porque
RLS no deja ver una sala sin publicar.

⚠️ **Los formularios no piden un título: lo arman.** Desde el 2026-09-15 el
nombre de un toque sale de «Artista/s» más «Gira», y el campo de artistas
**no es opcional** — al desaparecer el título, un toque sin nadie que toque no
tiene nombre. En la cola, el título de los canónicos viejos se desestructura al
abrirlos, **campo por campo**: la lista solo si la columna viene vacía, la gira
solo si la suya lo está. Hacerlo todo o nada dejó dos eventos con la gira
todavía dentro del título, y al guardar se habría perdido en silencio.

⚠️ **Fiesta y festival conservan un campo de nombre**, y es la misma razón de
siempre: ahí no hay artista de cartel, así que el título *es* el nombre del
ciclo y no se puede armar con nadie. Al guardar uno se vacían `artistas` y
`gira` — si quedaran con dos nombres, la cartelera mostraría esa lista en vez
del nombre del ciclo, porque el encabezado mira cuántos artistas hay y no el
tipo.

⚠️ **El año que el afiche no imprime se infiere, y es una excepción deliberada
a no inventar datos.** La pidió Juan el 2026-09-15: los flyers de esta escena
casi nunca imprimen el año porque dan por hecho el que corre, y devolver `null`
estaba perdiendo la fecha entera de eventos cuyo día y mes sí se sabían. Se
elige el año que deja la fecha en el futuro próximo —"15 de enero" leído en
septiembre es del año entrante— con siete días de gracia hacia atrás, para el
caso de cargar el flyer del toque de anoche.

Lo que salva la regla y no es opcional: **queda dicho en las notas del
evento** ("El afiche no imprime el año: dice 09/12 y se asumió 2026"), así que
nadie lee después una fecha completa creyendo que el afiche la traía. Y a
diferencia del cron, esto pasa por los ojos de Juan antes de publicarse. El
modelo sigue sin deducir nada: devuelve `dia_y_mes` y el año lo pone el
formulario, que sí sabe en qué fecha se está cargando.

**La moderación no reabre el scraping prohibido.** Que el dato caiga en una
cola en vez de publicarse no cambia qué tenemos permitido pedir. Para Tuboleta,
Bandsintown, Songkick e Instagram la vía es **pegar, no traer**: si el admin
pega una URL y *nuestro servidor* la va a buscar, sigue siendo nuestro agente
entrando donde no lo dejan; si pega el contenido, no hay robot.

## El backfill del 2026-08-31

⚠️ **Los canónicos del backfill tienen `reviewed_at` en null y eso es
correcto: nadie los revisó.** Se publicaron para que la cartelera no se
vaciara al cambiar de modelo, y es lo único que se publicó sin pasar por una
persona. La página de detalle solo dice "revisados a mano" cuando
`reviewed_at` existe — decir lo contrario sería inventar un dato. El número
baja solo, a medida que Juan toca cada evento por otro motivo.

## Ver también

`context/moderacion/diseno.md` — el diseño completo, el estado de la base al
momento del backfill, y lo que enseñó la primera sesión de triage masivo.
