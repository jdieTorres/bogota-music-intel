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

## `/admin`

Dos secciones separadas, **Eventos** y **Salas**, porque son dos ciclos de
vida distintos: un evento caduca y una sala no. Los módulos van igual de
separados (`lib/admin/eventos.ts`, `salas.ts`, `sesion.ts`, `slug.ts`).

Tres pestañas de eventos: *Por revisar* (la cola que caduca), *En la cartelera*
(lo publicado vigente) y *Ya pasaron*. Los mismos controles están en la página
de cada evento, para quien está mirando la cartelera y ve algo mal.

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

### Carga manual

Evento nuevo (entra como borrador, a la misma cola, para que no haya un camino
que se salte la revisión) y sala nueva (nace publicada: la crea quien aprobaría
el borrador).

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
