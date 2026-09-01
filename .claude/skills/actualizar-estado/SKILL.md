---
name: actualizar-estado
description: Pone al día ESTADO.md, CLAUDE.md y los context/*/CLAUDE.md con el estado real del proyecto — qué quedó a medias, cuál es el siguiente paso concreto y qué decisiones recientes no están documentadas. Usar cuando Juan pida actualizar el estado, documentar dónde vamos, registrar lo que llevamos, o al cerrar una fase o una sesión de trabajo.
---

# Actualizar el estado del proyecto

Deja la documentación reflejando la realidad para que la próxima sesión —o
Juan dentro de tres semanas— no tenga que reconstruirla. No es un resumen de lo
que se hizo: el historial de git ya lo cuenta. Es el registro de **lo que no se
puede deducir leyendo el código**.

Ejecutá esto de corrido y entregá el resultado. No preguntes por dónde empezar.

## 0. Cómo está organizada la documentación

Desde el 2026-09-01 no hay un solo archivo. **Escribir en el lugar equivocado
es la forma en que esto se vuelve otra vez ilegible**, así que esta parte no es
opcional.

| Archivo | Qué va | Qué NO va |
|---|---|---|
| `ESTADO.md` | Todo lo que caduca: pendientes, cifras, lo que quedó a medias, el siguiente paso, las preguntas abiertas para Juan | Reglas, criterio, decisiones permanentes |
| `CLAUDE.md` | Índice, el principio editorial, el stack, y las **reglas duras** transversales | Cifras, pendientes, detalle de un área |
| `context/<área>/CLAUDE.md` | Las reglas y el criterio de esa área | Investigación larga, mediciones, relatos de bugs |
| `context/<área>/*.md` | La investigación, las mediciones, el relato de por qué algo falló | — |
| `context/archivo/` | Lo que dejó de estar vivo: módulos borrados, APIs muertas | Nada que esté en uso |

Las áreas son `producto`, `editorial`, `ingesta`, `moderacion`, `frontend`,
`infraestructura`, `look-and-feel` y `archivo`.

Tres reglas de ruteo que resuelven casi todos los casos:

- **Si tiene un número que va a cambiar, va a `ESTADO.md`.** Una cobertura, un
  conteo, "N de M". Siempre con numerador y denominador, y con la fecha en que
  se contó.
- **Si empieza con "nunca", "siempre" o "antes de", es una regla** y va a un
  `CLAUDE.md` — al del área si aplica a un área, al general si aplica a todo.
- **Si pasa de tres o cuatro líneas, casi seguro es detalle** y va a un `.md`
  de la carpeta, con un puntero de una línea desde el `CLAUDE.md` del área.

Y una regla de tamaño: **si el `CLAUDE.md` de un área pasa de ~150 líneas, hay
algo adentro que pertenece a un `.md` de detalle.** El archivo general llegó a
74 KB por acumulación, no por una decisión.

## 1. Reunir evidencia (no confiar en la memoria de la conversación)

La conversación tiene sesgo de recencia y olvida lo que se dejó pendiente hace
horas. Buscá los hechos:

- `git log --oneline <último-commit-que-tocó-ESTADO.md>..HEAD` — todo lo que
  pasó desde la última actualización. Sacá el commit con
  `git log -1 --format=%H -- ESTADO.md`.
- `git status` — lo que está sin commitear suele ser justamente lo que quedó a
  medias.
- `git grep -nE "TODO|FIXME|PENDIENTE|HACK|por ahora|de momento"` — decisiones
  provisionales que alguien pensaba volver a tocar.
- Comentarios largos en el código que expliquen un *porqué*: si una decisión
  vive solo en un comentario, no está documentada.
- ¿Los pipelines de CI/cron han llegado a ejecutarse de verdad, o solo pasan
  los tests? **Mirá los dos workflows**, `Tests` y `Scraper cron`: uno no dice
  nada del otro. El repo es público, se consulta sin token con
  `curl -s "https://api.github.com/repos/jdieTorres/bogota-music-intel/actions/runs?per_page=20"`
  y agrupando por `name`. (`gh` no está instalado en esta máquina.)
- **Recontá los datos reales** en vez de citar los de la última vez. Las cifras
  de `ESTADO.md` § 3 envejecen con cada corrida del cron y con cada sesión de
  triage de Juan.

### Si la verificación contradice lo que está escrito

Pasa, y es el hallazgo más valioso de todos: significa que alguien viene
tomando decisiones sobre una foto vieja. Cuando ocurra:

- **Corregí el documento y decíselo a Juan explícitamente**, con las dos
  versiones —lo que decía, lo que resultó ser— y desde cuándo estaba mal si se
  puede saber. Nunca ajustes una cifra o un estado en silencio: el hecho de que
  la documentación se desviara es en sí mismo información sobre el proyecto.
- Preguntate **por qué se desvió**. Si un dato envejece solo, la línea debería
  decir cómo recalcularlo o llevar su fecha, no solo el número — y
  probablemente estaba en el archivo equivocado: los números van a `ESTADO.md`.
- Si lo escrito resultó ser **una suposición nunca comprobada** en vez de un
  hecho, marcá en el texto qué quedó verificado y en qué fecha.
- Si la contradicción toca una decisión que Juan tomó, **no la revoques por tu
  cuenta**: corregí el hecho, dejá la decisión, y planteásela.

## 2. Encontrar lo que quedó a medias

Es la parte que más se escapa, porque nada falla. Va todo a `ESTADO.md` § 2.
Buscá específicamente:

- **Funciona en la máquina de Juan pero nunca en CI ni en producción.** Un
  script que solo se ha corrido a mano no está probado. Este proyecto ya se
  quemó dos veces con APIs que responden distinto desde CI.
- **Escrito pero nunca ejecutado**: un cron que nunca disparó, una migración
  entregada y sin aplicar, un deploy que no se ha hecho.
- **Recomendado pero sin confirmar**: rotar una credencial, aplicar una
  migración. Si Juan no dijo que lo hizo, sigue pendiente — anotalo así.
- **Cobertura parcial que se lee como completa**: "el mapa está hecho" con 9 de
  13 salas ubicadas. Poné el numerador y el denominador.
- **Verificado a medias**: distinguí "los tests pasan" de "lo miré
  funcionando". Un mapa puede estar en negro con CI verde, tests pasando, tsc
  limpio y build correcto.
- **Un denominador que creció y dejó al numerador quieto.** Aprobar cuatro
  salas nuevas convirtió un 9/9 en un 9/13 sin que nadie tocara nada.

Separá en `ESTADO.md` **lo que está bloqueado en Juan** (§ 1) de lo que
cualquiera puede destrabar (§ 2). Si un pendiente está bloqueado en una
decisión de producto que solo Juan puede tomar, **escribí la pregunta**, no
solo el pendiente.

## 3. Encontrar las decisiones no documentadas

No solo las que Juan tomó en voz alta. También las que se tomaron **dentro de
la implementación** y solo viven en un comentario o en el diff:

- Un criterio aplicado en varios sitios distintos sin haberle puesto nombre
  (ej. "nunca inventar un dato" resolviendo a la vez la geocodificación, la
  búsqueda por nombre y el formato de horas). Nombrarlo lo vuelve reutilizable
  — y lo asciende a regla dura en `CLAUDE.md`.
- Deuda técnica aceptada a propósito, con la condición que la dispara.
- Una trampa que costó un bug: si el mismo error se cometió dos veces, **sube a
  regla dura** en `CLAUDE.md`, no se queda como anécdota en el área.
- Algo que se evaluó y se descartó: sin registro, se vuelve a evaluar. Si el
  módulo o la fuente están muertos, va a `context/archivo/`.
- Datos del stack que cambiaron en el camino y quedaron desactualizados.

## 4. Escribir

Reglas de redacción, en español y en el tono del resto de los archivos:

- **Fechas absolutas** ("2026-08-27"), nunca "ayer" ni "esta semana".
- **Rutas de archivo concretas** en vez de descripciones vagas.
- Decir **por qué**, no solo qué. "No relajar la búsqueda de Nominatim" es una
  orden que alguien desobedecerá; "porque buscar «Lourdes, Chapinero» devuelve
  con toda confianza la iglesia" es un argumento que se respeta.
- **No duplicar lo que el repo ya dice.** Si está en el código, en los tests o
  en el historial, no va en ningún `.md`.
- **No duplicar entre archivos.** Un hecho vive en un solo lugar; los demás lo
  referencian con su ruta. Dos copias se desincronizan y la que alguien lea
  primero gana.
- Si agregás una carpeta nueva a `context/`, **añadí su fila a la tabla "Dónde
  está cada cosa" de `CLAUDE.md`**, o nadie la va a leer: esos archivos no se
  cargan solos.

## 5. Podar

Este paso es tan importante como escribir, y es el que se olvida.

- **Releé entero lo que tocaste**: la actualización tiene que dejarlo
  coherente, no solo tener párrafos nuevos. Un "Siguiente: Fase 4" viejo
  desinforma más de lo que informa un párrafo que falte.
- **Sacá lo que ya se resolvió.** Un pendiente cerrado se borra de
  `ESTADO.md`; no se tacha ni se deja con un "~~hecho~~" arrastrando su
  historia. Si lo que enseñó vale, ascendelo a regla; si no, se va.
- **Sacá lo que dejó de estar vivo.** Una API muerta, un módulo borrado, un
  bloqueo que ya no aplica: `context/archivo/`, o nada.
- **Sacá el detalle que ya no le cambia la decisión a nadie.** La aclaración de
  la nacionalidad de un artista vive en su lista curada con su `evidencia`, no
  en un `CLAUDE.md`.
- **Cuidado con la anécdota.** Un error que costó un bug deja **una regla de
  una línea** en el `CLAUDE.md` y **el relato en el `.md` de detalle**. Los dos
  juntos en el `CLAUDE.md` es lo que lo infla.

## 6. Cerrar

- Commiteá con un mensaje que diga **qué información se agregó**, no
  "actualiza docs".
- En la respuesta a Juan, contá qué quedó registrado y **por qué eso valía la
  pena escribirlo**. Si algo no lo pudiste verificar, decilo en vez de darlo
  por bueno, y si algo resultó estar mal escrito, decilo primero.
- Decí también **qué podaste**, no solo qué agregaste. Una corrida que solo
  suma líneas está haciendo la mitad del trabajo.
- Que el repo esté limpio y no haya cambios grandes no es motivo para no correr
  esto: verificar lo ya escrito vale por sí solo, y un informe corto y honesto
  es mejor que texto nuevo inventado para justificar la corrida.
