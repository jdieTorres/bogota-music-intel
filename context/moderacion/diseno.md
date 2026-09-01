# Moderación — diseño completo


Diseñada con Juan el 2026-08-31, al reemplazar el radar por el directorio. **La base está construida y corriendo desde ese mismo día**; falta el formulario de admin, la cobertura y el directorio.

**Ningún evento se publica solo.** El cron sigue corriendo igual, pero lo que trae entra como **borrador** a una cola de revisión; el admin verifica, completa y publica.

### Por qué, y por qué encaja

El problema que lo motivó no es de calidad sino de **sesgo de cobertura**: las seis fuentes actuales tiran a salas grandes, donde tocan los internacionales. El toque local en un bar chico, anunciado solo por historia de Instagram, es estructuralmente invisible para el pipeline — y el propósito de la plataforma es promover justamente ese toque.

⚠️ **Corrección de un dato que se llegó a proponer como titular editorial:** "de 44 conciertos anunciados en Bogotá, 7 son de artistas locales". Ese 16% **no mide la escena de Bogotá: mide qué salas scrapeamos.** Es honesto como "de lo que publican estas seis fuentes" y sería falso como afirmación sobre la ciudad. La moderación y la carga manual existen para que la plataforma deje de tener ese sesgo sin saberlo.

No es una arquitectura nueva: es **"guardar crudo, filtrar y clasificar en lectura"** una vuelta más, la misma forma que ya tiene el paso de clasificación.

### Las dos capas

- **`events` (crudo)** — una fila por fuente, como hoy. El admin nunca la toca; el cron la reescribe libremente en cada corrida.
- **Evento canónico (publicado)** — una fila por show real, con los valores aprobados, enlazada a **una o varias** filas crudas.

Al revisar un borrador el admin hace una de dos cosas: **publicar como nuevo** o **adjuntar a un canónico existente** ("es el mismo show que ya publiqué"). Un evento cargado a mano es un canónico sin fuente cruda; si mañana un scraper lo encuentra, se adjunta.

Esto resuelve tres cosas de una:

1. **Identidad única del evento.** Hoy el upsert garantiza unicidad solo *dentro* de una fuente (`source` + `source_event_id`), por eso el mismo show llega dos veces desde Royal Center y Rockal Live. El canónico es la identidad que faltaba, y cubre también el duplicado entre el cron y el admin.
2. **Salda la deuda de la dedupe.** Estaba anotado que `dedupe.ts` tenía que moverse del frontend a la ingesta cuando existiera la API pública. Acá se mueve, y mejor: deja de ser lógica de producto y pasa a ser **un sugeridor en la pantalla de revisión** ("esto se parece a X, ¿es el mismo?"), donde decide un humano y no una heurística.
3. **Mata el problema del título del duplicado** (§ 8, "Akriila pierde Tour Lucy"): el canónico puede tomar el título de una fuente y el precio de otra, porque las tiene todas colgando. La pregunta de producto que quedaba abierta ahí se responde sola.

### El scraper no puede pisar lo que decidió el admin

Verificado en el código el 2026-08-31, y **no es una promesa de diseño sino comportamiento ya en producción**: el upsert de `save_events` sube un diccionario con solo sus propias columnas, así que nunca toca `event_type`, `is_local` ni `classification_source`. Por eso la clasificación sobrevive a todas las corridas del cron desde el 27 de agosto. Las columnas del admin funcionan igual: el scraper no las menciona.

**La condición que hace que funcione:** las ediciones del admin van en **columnas propias, nunca encima de las scrapeadas**. El scraper sí reescribe `title`, `starts_at` y `price_text` en cada corrida; una corrección hecha en el mismo campo se pierde al día siguiente. Lo que se muestra = valor del admin si existe, si no el crudo.

### Toda sobrescritura del origen pasa por aprobación

Como el canónico guarda su propia copia de lo aprobado y el crudo se actualiza libre, comparar los dos detecta cuándo la fuente se movió después de la aprobación. Ese evento vuelve a la cola **etiquetado**, con el cambio a la vista (`precio: $102.000 → $118.000`), para que el admin apruebe o rechace. Aplica a cualquier campo: precio, sala, nombre, fecha.

Esto convierte la moderación de un filtro de entrada en **verificación continua**, que es lo que hoy no existe: un evento publicado se desactualiza en silencio.

Lo mismo con la desaparición: hoy `_prune_missing_events` borra sin avisar el evento futuro que salió de la cartelera. Un evento **publicado** que desaparece del origen debe avisarle al admin en vez de esfumarse — puede ser una cancelación real o que la sala rehizo su web.

### Qué pasa con los filtros de exclusión

- **`eventos_excluidos.py` (lista de eventos puntuales) se retira.** Existía porque borrar una fila no alcanzaba: el cron la devolvía. Con borradores, "no lo quiero" es simplemente no publicarlo — reversible y visible, sin la contrapartida de que sacar una entrada no recupera el pasado.
- **Las reglas (`classify.py`, `exclusion_patterns.py`) ascienden.** Dejan de filtrar la cartelera y pasan a **ordenar la cola**: lo que no es música cae en un cajón aparte en vez de mezclarse con los toques. Es más útil ahí que en la lectura.

**Y con eso una regla dura cambia de signo.** Estaba escrito que *"excluir es caro y silencioso: un evento que no aparece no deja rastro para nadie"*, y por eso las reglas se mantenían estrechas. Bajo moderación **eso deja de ser cierto**: un evento mal filtrado sigue siendo visible para el admin, en su cajón. Las reglas de exclusión pueden volverse **más agresivas, no menos** — lo contrario de lo que había que hacer hasta ahora.

### La cola es chica, medido

`scraped_at` no está en el upsert del scraper, así que marca cuándo entró un evento **por primera vez**. Al 2026-08-31:

    2026-08-27:  52   <- carga inicial
    2026-08-30:   1

**Un evento nuevo en cuatro días.** El riesgo razonable de este diseño —que el humano se vuelva el cuello de botella— no aplica con este volumen, así que no hace falta inventar excepciones de auto-publicación para fuentes "confiables": todo pasa por revisión. Si el volumen sube al sumar fuentes, se revisa.

### Alcance de la fase

| Parte | Qué |
|---|---|
| **Base** | Estado `borrador`/`publicado`, evento canónico con sus fuentes, columnas de edición del admin separadas de las del scraper, `evidencia` obligatoria a nivel de base para lo cargado a mano |
| **Superficie** | Formulario de admin sobre Supabase Auth: cola de revisión ordenada por fecha del evento, con todo prellenado, y "evento nuevo" como borrador vacío |
| **Cobertura** | Scrapers nuevos para las cuatro fuentes abiertas de § 3; pegado manual de texto o flyer para lo que no se puede traer |
| **Módulo** | Directorio de salas y artistas, alimentado por lo ya curado |

Dos consecuencias sobre el trabajo anterior, que conviene saber antes de construir:

- **La normalización de títulos (§ 8) cambia de trabajo**: deja de tener que *acertar* y pasa a *proponer un buen borrador* para que el admin edite menos. Las cinco entradas de `TITULOS` en `titulosCurados.ts` quedan sobrando —un humano corrigiendo el borrador es estrictamente mejor que curar por título exacto—; `GRAFIAS` sí sobrevive, porque se aplica sola a los shows futuros del mismo artista.
- **El formulario de admin sube de "cuando la fricción moleste" a prerequisito.** Lo necesitan la cola de revisión, la carga manual y el directorio. Y un evento tiene fecha: editar un `.py` y correr un CLI no sirve. Es una desviación consciente de la convención de "lo curado vive en git con evidencia y tests" — se compensa haciendo `evidencia` obligatoria en la base, que es la base exigiendo lo que allá exigía un test.

### Instagram como salida, no como fuente

Se evaluó y se descartó **scrapear una cuenta propia** (subir la info a Instagram o X y volver a bajarla). Es técnicamente posible —leer los posts de tu propia cuenta de Instagram no requiere app review, alcanza con modo desarrollo y rol de tester; X no tiene tier gratuito para cuentas nuevas desde febrero de 2026 y cobra por lectura— pero es un viaje de ida y vuelta a través de una base de datos peor: obligaría a escribir un parser de nuestros propios datos sobre un caption, que es peor fuente que la página de una sala.

**La dirección correcta es la inversa: la plataforma es la fuente, las redes son la salida.** El admin cura en la plataforma y la plataforma publica sola ("esta semana en Bogotá: 5 toques locales"). Mismo esfuerzo, los datos quedan estructurados, publicar es la dirección que las plataformas sí soportan, y la cuenta se vuelve distribución — que es un pendiente abierto del doc de producto (§ 7) y parte del pivote editorial de Juan. Queda anotado para después del MVP.

### Estado de la base (2026-08-31)

Hecho y verificado:

- Migración `supabase/migrations/20260831000000_moderacion.sql`, aplicada por Juan en el SQL editor.
- `deduplicacion.py` y `moderacion.py` (lógica pura, sin credenciales) + `moderacion_cli.py`, con 16 tests.
- Backfill corrido: **51 canónicos de 53 filas crudas**, todos `publicado`, 0 huérfanos, 0 crudos sin canónico. Se unieron los dos duplicados esperados —Akriila y MADE4RAP, que llegan por dos fuentes cada uno—, el mismo resultado que daba la dedupe del frontend.
- **Idempotencia comprobada contra datos reales**: una corrida normal inmediatamente después reporta `0 borradores nuevos, 0 con cambios en el origen, 0 publicados sin fuente`. Es la prueba de que el snapshot no inventa cambios.
- Paso `Moderation queue` en el cron, después de `Classify events`.
- La cartelera, el mapa y el detalle leen `canonical_events`. Verificado en navegador: 39 conciertos, 2 fiestas y 41 eventos en el mapa — **los mismos números que antes de la mudanza**, que es la señal de que no se perdió ni se duplicó nada.
- `apps/web/src/lib/dedupe.ts` borrado con sus 15 tests: la lógica vive ahora en Python, con los suyos.

⚠️ **Los 51 del backfill tienen `reviewed_at` en null, a propósito.** Nadie los revisó: se publicaron para que la cartelera no se vaciara al cambiar de modelo. Esto ya se cobró un error al escribir la página de detalle: el aviso de procedencia decía "y revisados a mano" para todos, lo cual era falso para los 51. Ahora esa frase solo aparece cuando `reviewed_at` existe. Vale como recordatorio de que la regla de no inventar datos también aplica a lo que el sitio dice **sobre sí mismo**, no solo a los datos de los eventos.

El aviso de procedencia además distingue tres casos, porque no puede afirmar lo mismo en los tres: una fuente ("la cartelera oficial de la sala"), varias (los dominios reales, no los slugs internos como `rockal_live`), y ninguna (evento cargado a mano, con su evidencia).

### Limpieza del 2026-08-31 (posterior al backfill)

- **Radar borrado del repo.** `radar.py`, `radar_cli.py`, `lastfm.py`, `deezer.py`, `/tendencias`, `trending.ts`, `TendenciaCard.tsx`, sus 9 tests, el link del nav, el paso del cron, `save_trending_snapshot` en `storage.py` y `lastfm_api_key` en `config.py`. Verificado que no queda ninguna referencia viva y que `/tendencias` da 404. La sección 7 de este documento queda como registro de lo que existió.
  - **La tabla `trending_artists` sigue en pie**, con 215 filas de `lastfm_geo`. La migración para soltarla está escrita y **sin aplicar** (`20260831010000_baja_radar.sql`): borra datos irrecuperables —cada fila era la foto de un momento— y no le hace daño a nadie quedarse. Es decisión de Juan.
- **Los tres `not_music` pasaron a `descartado`.** Estaban en `publicado` y a la vez filtrados por el criterio editorial, que es una contradicción: `status` contesta "¿va al sitio?" y `event_type` contesta "¿qué es?". Un `not_music` publicado dice "aprobado" sobre algo que nunca se muestra. Las filas crudas no se tocan: borrarlas las traería de vuelta en la corrida siguiente.
- **Defecto encontrado y corregido en el propio modelo de moderación**, un día después de escribirlo: la clasificación editorial se hereda del crudo **al crear el borrador**, así que un evento que MusicBrainz resolvía tarde —503, o el problema de CI de arriba— se quedaba con `event_type` en null en el canónico **para siempre**. El canónico ya existía cuando llegó la respuesta. Lo arregla un paso nuevo del CLI (`clasificacion_pendiente`) que **solo rellena huecos y nunca sobrescribe**: si el admin corrigió el tipo a mano, su decisión gana sobre lo que diga MusicBrainz mañana. Se detectó revisando la base, no con los tests — los tests probaban lo que el código hacía, no lo que faltaba que hiciera.

### La normalización se muda a la ingesta (2026-08-31)

Lo levantó Juan mirando la pantalla de moderación: **los títulos que aparecían para editar no eran los que veía el público.** La normalización era una capa de presentación (`apps/web/src/lib/tituloEvento.ts`), así que la base guardaba `AKRIILA EN BOGOTÁ` y el navegador dibujaba `Akriila`. El admin editaba una cosa y publicaba otra.

Su diagnóstico fue el correcto y va más lejos que el síntoma: **el título guardado tiene que ser el título publicado**. Con moderación de por medio, una transformación al mostrar puede pisar una corrección hecha a mano, que es exactamente lo contrario de para qué existe la cola.

Se movió el módulo entero a Python (`titulos.py` + `titulos_curados.py`) y se aplica en `borrador_desde()`, entre la llegada del cron y la cola de borradores. El frontend ya no transforma nada: muestra `canonical_events.title` tal cual, y `tituloEvento.ts`, `titulosCurados.ts` y sus 56 tests se borraron.

Cómo se verificó que el port no cambió comportamiento:

- Los 49 tests del frontend se portaron y pasaron **al primer intento**, más 7 de las listas curadas: 56 en Python.
- Se corrió el normalizador nuevo sobre los 53 títulos crudos reales y se comparó, entrada por entrada, contra lo que el TypeScript producía en el navegador. Idénticos.
- Después de migrar, la cartelera muestra los mismos 39 conciertos con los mismos títulos.

**La trampa que casi se pasa por alto:** `source_snapshot` guarda el título tal como se aprobó, y se compara contra lo que devuelve `borrador_desde()`. Al empezar a normalizar, el snapshot de los 51 canónicos —guardado en crudo— habría diferido del borrador nuevo, y el cron habría marcado **los 51 como "la fuente cambió el título"** sin que ninguna sala tocara nada. El paso único `moderacion_cli --normalizar-titulos` actualiza las dos cosas a la vez: 43 títulos puestos al día, y la corrida siguiente reporta 0 cambios.

**Consecuencia sobre la limitación conocida de la dedupe** (el caso Akriila perdiendo "Tour Lucy"): dejó de ser una pregunta de producto abierta. El canónico cuelga de todas sus fuentes y el admin edita el título antes de publicar, así que la respuesta ya no depende de una heurística.

---


---

### Lo que enseñó la primera sesión de triage masivo

Al entrar los 66 eventos de visitbogota y los 5 de Idartes, la cola pasó de 0 a más de 60 borradores de golpe. Dos cosas salieron de ahí:

- **La cola funciona**: en pantalla no apareció nada. Ni Gorillaz, ni Rock al Parque, ni el congreso de endodoncia. 13 salas nuevas quedaron esperando aprobación en vez de entrar solas al mapa.
- ⚠️ **"Borrar" y "No va" están demasiado cerca.** Descartar es reversible; borrar elimina las filas crudas y bloquea el evento para siempre. En esa misma sesión se borró con motivo "no music" un evento que sí era música —"Gaitán al Aire Vol. 57: Ancestral Beats"—, arrastrado por la tanda de teatro que lo rodeaba. Se recupera quitando su fila de `blocked_source_events` y esperando al cron. Si se repite, conviene alejar el botón o pedir doble confirmación cuando el evento está clasificado como música.


### Tres ajustes tras la primera revisión real de la cola (2026-09-01)

Juan revisó los 60 borradores a mano y pidió tres cosas. Las tres salieron de usar el sistema, no de leerlo.

**1. visitbogota sí publica su taxonomía.** El parámetro `?tipo=` del listado se ignora —por eso la sección de arriba la daba por perdida— pero **la ficha trae un bloque rotulado "Categoría del evento"**, y ahí el valor está y acierta. Comprobado contra 13 fichas de todas las clases, sin una sola contradicción:

| Categoría | Eventos |
|---|---|
| Conciertos | Drexler, Jazz al Parque, Festival Cordillera, Sara Landry |
| Teatro | las obras, y también la comedia (Bogotá ríe, Hassam) |
| Educativo | el congreso AEDEM |
| Deportivo | WWE |
| Otros | la feria de bodas |

Es **lo contrario de Idartes**, donde la etiqueta del listado miente y manda la ruta. La conclusión general: la confianza en una señal se mide fuente por fuente y no se hereda de otra.

Se sumaron a `CATEGORIAS_NO_MUSICALES`: `deportivo`, `educativo`, `ferias`, `gastronomia`, `mice`. **No** se sumaron dos, a propósito: `Otros` es el cajón de sastre de esta fuente —y además choca con el `Otro` de Rockal Live, que ahí significa "otro género"— y `Cultura` es demasiado ancho, porque un concierto dentro de una programación cultural sigue siendo un concierto.

**2. Lo ya reconocido como no musical nace descartado, no en la cola.** Si el sistema ya sabe que se va a descartar, hacérselo descartar a una persona es trabajo regalado. Nace `descartado` y no "sin crear", y la diferencia importa: sin canónico, su fila cruda volvería a pedir un borrador todos los días, y el evento desaparecería sin dejar rastro — que es justo lo que la cola vino a evitar.

**3. La sugerencia de duplicado comparaba contra el título equivocado.** Lenny Tavárez llegó por visitbogota y no disparó la ventana. La causa: se comparaba la fila cruda nueva contra el **título curado del canónico**, que ya no se parece a lo que publica ninguna fuente.

```
"Lenny Tavárez & Justin Quiles | Superarte"  vs  "Lenny Tavárez & J Quilles"  ->  0.29  ✗
"Lenny Tavarez – J quiles"                   vs  "Lenny Tavárez & J Quilles"  ->  0.60  ✓
```

Ahora se compara **crudo contra crudo**, que es para lo que la heurística fue escrita. Y como la sugerencia se calculaba una sola vez al abrir el borrador, un fallo quedaba para siempre: el CLI ganó un sexto paso que vuelve a revisar los borradores sin sugerencia. Al correrlo, cazó a Lenny Tavárez.

