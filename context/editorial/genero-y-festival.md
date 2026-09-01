# El género y el festival — dos ajustes de vocabulario (2026-09-01)

### El género: una columna con dos trabajos (2026-09-01)

`events.category` (y su copia en `canonical_events`) se llenó pensando en el clasificador, y de paso quedó siendo lo que la cartelera muestra como "Género". Los dos usos no piden lo mismo, y al sumar visitbogota se rompió la costura: la fuente escribe ahí su taxonomía, así que en la pestaña de conciertos aparecieron chips que decían "Conciertos".

Qué guarda cada fuente en `category`, que es el fondo del asunto:

| Fuente | Qué escribe | ¿Sirve como género? |
|---|---|---|
| `rockal_live` | un género — "Pop", "Rock/Punk/Metal", "Hip Hop/Rap" | sí |
| `visitbogota` | su taxonomía — "Conciertos", "Ferias MICE" | no |
| `idartes_teatro_jeg` | una disciplina — "Música", "Danza", "Teatro" | no, pero es la señal que clasifica |
| el resto | nada | — |

Se arregló en dos tiempos, y el primero solo a medias:

1. **Filtrar al mostrar** (`generoVisible` en `apps/web/src/lib/editorial.ts`). Se hizo primero en el chip de la tarjeta y se olvidó la página de detalle. Corregirlo sitio por sitio es jugar a los topos, así que el filtro se movió al punto de lectura: el tipo `Evento` **no expone `category`**, expone `genero` ya filtrado. Un componente no puede equivocarse con un valor que no recibe.
2. **Poder escribirlo.** Filtrar era todo lo que se podía hacer mientras no hubiera dónde corregir el dato — el género no sale de ninguna fuente. Desde el 2026-09-01 hay campo opcional en los dos formularios de `/admin`, escribiendo en `canonical_events.category`, que es la copia editable y por lo tanto sobrevive al cron.

**La cuenta que justifica el trabajo**: de 49 publicados, 7 traen un género usable —todos de Rockal Live—, 33 vienen en null y 8 traen la taxonomía de la fuente. El 86% de los chips, si van a existir, los escribe una persona.

Detalle que conviene no perder: `category` es un **campo vigilado** (`CAMPOS_VIGILADOS` en `moderacion.py`). Un género escrito a mano no se pierde —el snapshot guarda el valor crudo, no el editado— pero si la sala cambia su categoría, el evento vuelve a la cola con ese cambio a la vista. Es el comportamiento correcto y conviene saberlo antes de asustarse.

La lista de sugerencias (`apps/web/src/lib/admin/generos.ts`) es un `datalist`, no un `select`: sirve para que no convivan "rock", "Rock" y "Rock/Punk/Metal", no para cerrar el vocabulario. Un test verifica que ninguna sugerencia caiga en la lista de valores que `generoVisible` esconde — ofrecer un valor que después no se muestra sería mentirle al admin.


### El festival como cuarta categoría (2026-09-01)

`visitbogota` trajo, en su primer lote, seis eventos que el vocabulario existente no sabía nombrar: Rock al Parque, Salsa al Parque, Jazz al Parque, Hip Hop al Parque, Festival Cordillera y Todos Somos Ángeles Rock Fest. Caían en `music`, y ahí quedaban con `is_local` en null de forma permanente — no por una falla de MusicBrainz, sino porque **la pregunta no tiene respuesta**: un festival de cincuenta bandas no tiene un origen.

Es la misma forma que ya tenía la `fiesta`, y por un momento pareció que alcanzaba con reusarla. No alcanza, por el mismo motivo por el que las fiestas se separaron de los conciertos: una noche de club y tres días en el Simón Bolívar no se comparan en una misma lista. Reusar `fiesta` habría deshecho la separación que la creó.

#### El contraejemplo que definió la regla de emparejamiento

La primera versión iba a buscar el nombre del festival como subcadena, igual que `ciclos_curados.py`. La base tenía el caso que lo desmiente:

| Título | Qué es | Por qué |
|---|---|---|
| `Rock al Parque 2026` | festival | el título es el nombre del festival y nada más |
| `Festival Orígenes presenta Sara Curruchich y Humazapas` | **concierto** | nombra a quién toca, y MusicBrainz los resuelve |

El segundo lo publica el Teatro Jorge Eliécer Gaitán bajo `/agenda/concierto/`. Con emparejamiento por subcadena habría perdido su cartel —el normalizador deja de partir "Artista | Gira" cuando no hay cartel— y su origen, que ya estaba resuelto.

De ahí la regla, más estricta que la de los ciclos y por un motivo concreto: **es festival cuando el título completo es el nombre del festival**, ignorando el año final. En cuanto el título nombra a alguien, es un concierto — aunque ocurra dentro de un festival.

El año se ignora al comparar y se conserva al publicar. Son dos cosas distintas y las dos son deliberadas: ignorarlo hace que "Rock al Parque 2027" entre solo el año que viene; conservarlo mantiene la edición identificable, que es lo mismo que ya se hacía con "Que Chimba Puñeta Vol. 4".

#### Lo que tocó

- Migración `20260901000000_tipo_festival.sql`: amplía el `check` de `events.event_type` **y el de `canonical_events.event_type`**. Los dos, o el canónico rechaza lo que el crudo acepta.
- `festivales_curados.py`, con `evidencia` obligatoria. La evidencia sale de la descripción de cada ficha, que en estos casos lo dice con todas las letras («el festival gratuito de rock más grande de América Latina»).
- `classify.py`: la lista de festivales entra **después de los ciclos y antes de la categoría de la fuente**. Ese orden importa: visitbogota escribe "Conciertos" en todo lo suyo, así que si la categoría decidiera primero ningún festival suyo se marcaría.
- `titulos.py`: `fiesta` y `festival` comparten condición (`sin_cartel`) porque para el normalizador piden exactamente lo mismo — no hay artista que separar de una gira.
- Frontend: `SOLO_FESTIVALES`, `/festivales`, la tercera pestaña y la opción en los dos formularios de `/admin`. `EN_CARTELERA` (el mapa) los suma sin separar.
- De paso, el union `"music" | "fiesta" | "not_music" | null` estaba escrito a mano en cuatro archivos del frontend. Se unificó en `TipoEvento`: agregar la cuarta categoría en cuatro lugares distintos es exactamente cómo se olvida uno.

#### Detalle que no se resolvió, y por qué

La ficha de Jazz al Parque **se contradice sobre la sede**: el campo de lugar dice Parque el Country y el cuerpo del texto dice Parque Metropolitano Simón Bolívar. No se corrige desde la lista curada: la sala sale de la fuente, y esta lista responde qué tipo de evento es, no dónde ocurre. Queda anotado en la `evidencia` de esa entrada para que quien lo vea en el mapa sepa que ya se detectó.
