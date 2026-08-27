---
name: actualizar-estado
description: Pone al día CLAUDE.md y docs/ con el estado real del proyecto — qué quedó a medias, cuál es el siguiente paso concreto y qué decisiones recientes no están documentadas. Usar cuando Juan pida actualizar el estado, documentar dónde vamos, registrar lo que llevamos, o al cerrar una fase o una sesión de trabajo.
---

# Actualizar el estado del proyecto

Deja `CLAUDE.md` reflejando la realidad para que la próxima sesión —o Juan
dentro de tres semanas— no tenga que reconstruirla. No es un resumen de lo que
se hizo: el historial de git ya lo cuenta. Es el registro de **lo que no se
puede deducir leyendo el código**.

Ejecutá esto de corrido y entregá el resultado. No preguntes por dónde empezar.

## 1. Reunir evidencia (no confiar en la memoria de la conversación)

La conversación tiene sesgo de recencia y olvida lo que se dejó pendiente hace
horas. Buscá los hechos:

- `git log --oneline <último-commit-que-tocó-CLAUDE.md>..HEAD` — todo lo que
  pasó desde la última actualización. Sacá el commit con
  `git log -1 --format=%H -- CLAUDE.md`.
- `git status` — lo que está sin commitear suele ser justamente lo que quedó a
  medias.
- `git grep -nE "TODO|FIXME|PENDIENTE|HACK|por ahora|de momento"` — decisiones
  provisionales que alguien pensaba volver a tocar.
- Comentarios largos en el código que expliquen un *porqué*: si una decisión
  vive solo en un comentario, no está documentada.
- ¿Los pipelines de CI/cron han llegado a ejecutarse de verdad, o solo pasan
  los tests? El repo es público: se consulta sin token con
  `curl -s "https://api.github.com/repos/jdieTorres/bogota-music-intel/actions/runs?per_page=5"`.
  (`gh` no está instalado en esta máquina.)
- Si hay datos en juego, contá los reales en vez de citar los de la última vez.

### Si la verificación contradice lo que está escrito

Pasa, y es el hallazgo más valioso de todos: significa que alguien viene
tomando decisiones sobre una foto vieja. Cuando ocurra:

- **Corregí el documento y decíselo a Juan explícitamente**, con las dos
  versiones —lo que decía, lo que resultó ser— y desde cuándo estaba mal si se
  puede saber. Nunca ajustes una cifra o un estado en silencio: el hecho de que
  la documentación se desviara es en sí mismo información sobre el proyecto.
- Preguntate **por qué se desvió**. Si un dato envejece solo (un conteo, una
  cobertura), la línea debería decir cómo recalcularlo o llevar su fecha, no
  solo el número. Si se desvió porque nadie actualizó tras un cambio, mirá si
  el resto de esa sección envejeció igual.
- Si lo escrito resultó ser **una suposición nunca comprobada** en vez de un
  hecho —cosa fácil de heredar de una sesión anterior—, marcá en el texto qué
  quedó verificado y en qué fecha, para que la próxima no lo vuelva a dar por
  bueno.
- Si la contradicción toca una decisión que Juan tomó, **no la revoques por tu
  cuenta**: corregí el hecho, dejá la decisión, y planteásela.

## 2. Encontrar lo que quedó a medias

Es la parte que más se escapa, porque nada falla. Buscá específicamente:

- **Funciona en la máquina de Juan pero nunca en CI ni en producción.** Un
  script que solo se ha corrido a mano no está probado.
- **Escrito pero nunca ejecutado**: un cron que nunca disparó, una migración
  aplicada a una sola base, un deploy que no se ha hecho.
- **Recomendado pero sin confirmar**: rotar una credencial, aplicar una
  migración. Si Juan no dijo que lo hizo, sigue pendiente — anotalo así, no lo
  des por hecho.
- **Cobertura parcial que se lee como completa**: "el mapa está hecho" con 5 de
  9 salas ubicadas. Poné el numerador y el denominador.
- **Verificado a medias**: distinguí "los tests pasan" de "lo miré funcionando".
  Un mapa puede estar en negro con CI verde, tests pasando, tsc limpio y build
  correcto.

## 3. Encontrar las decisiones no documentadas

No solo las que Juan tomó en voz alta. También las que se tomaron **dentro de
la implementación** y solo viven en un comentario o en el diff:

- Un criterio aplicado en varios sitios distintos sin haberle puesto nombre
  (ej. "nunca inventar un dato" resolviendo a la vez la geocodificación, la
  búsqueda por nombre y el formato de horas). Nombrarlo lo vuelve reutilizable.
- Deuda técnica aceptada a propósito, con la condición que la dispara ("esto
  vive en el frontend hasta que exista la API pública").
- Una trampa que costó un bug: si el mismo error se cometió dos veces, sube a
  regla dura, no se queda como anécdota.
- Algo que se evaluó y se descartó: sin registro, se vuelve a evaluar.
- Datos del stack que cambiaron en el camino y quedaron desactualizados arriba.

## 4. Escribir

Reglas de redacción, en español y en el tono del resto del archivo:

- **Fechas absolutas** ("2026-08-27"), nunca "ayer" ni "esta semana".
- **Rutas de archivo concretas** en vez de descripciones vagas.
- Decir **por qué**, no solo qué. "No relajar la búsqueda de Nominatim" es una
  orden que alguien desobedecerá; "porque buscar «Lourdes, Chapinero» devuelve
  con toda confianza la iglesia" es un argumento que se respeta.
- **No duplicar lo que el repo ya dice.** Si está en el código, en los tests o
  en el historial, no va en CLAUDE.md.
- **CLAUDE.md es índice y reglas; el detalle técnico va a `docs/`** con un
  puntero desde CLAUDE.md a la sección. Si un punto pasa de tres o cuatro
  líneas, casi siempre pertenece a `docs/`.
- Si un pendiente está bloqueado en una decisión de producto que solo Juan
  puede tomar, **escribí la pregunta pendiente en el documento**, no solo el
  pendiente. Así la próxima sesión sabe qué preguntar.

Secciones de `CLAUDE.md` que suelen tocarse:

| Sección | Qué va |
|---|---|
| `Stack técnico decidido` | Solo si cambió algo en la práctica |
| `Estado de implementación` | Fase por fase, con el grado de verificación |
| `Lo que quedó a medias` | El paso 2 |
| `Siguiente paso concreto` | Qué sigue y qué lo bloquea |
| `Pendientes activos` | Los de producto e investigación, no los operativos |
| `Decisiones transversales` | El paso 3 |
| `Reglas duras` | Lo que no se debe volver a intentar |

## 5. Cerrar

- Releé el archivo entero: la actualización tiene que dejarlo coherente, no
  solo tener párrafos nuevos. Quitá lo que quedó obsoleto — un "Siguiente:
  Fase 4" viejo desinforma más de lo que informa un párrafo que falte.
- Commiteá con un mensaje que diga **qué información se agregó**, no "actualiza
  docs".
- En la respuesta a Juan, contá qué quedó registrado y **por qué eso valía la
  pena escribirlo**. Si algo no lo pudiste verificar, decilo en vez de darlo
  por bueno, y si algo resultó estar mal escrito, decilo primero.
- Que el repo esté limpio y no haya cambios grandes no es motivo para no correr
  esto: verificar lo ya escrito vale por sí solo, y un informe corto y honesto
  es mejor que texto nuevo inventado para justificar la corrida.
