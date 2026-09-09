# La rockola: qué reproductor sirve, y las dos trampas que costaron

Detalle de la implementación del 2026-09-09. Las reglas cortas que salieron de
acá están en `context/frontend/CLAUDE.md`; esto es el porqué.

## Por qué no alojamos audio

No hay fuente legal del audio de esta escena. Está verificado y archivado dos
veces —fue lo que mató el Motor de similitud sonora— y no se vuelve a evaluar:
`context/archivo/apis-de-musica.md`. La rockola **embebe reproductores de
terceros**.

## La comparación, hecha llamando y no leyendo documentación

Se midió el 2026-09-09 porque el diseño dependía de una restricción de YouTube
y valía preguntarse si otra plataforma la evitaba.

| | Cobertura del underground bogotano | Control por JS | Track completo sin sesión | Tamaño |
|---|---|---|---|---|
| **YouTube** | alta | completo, con evento de "terminó" | sí | **≥200×200 y sin tapar** |
| **SoundCloud** | media | completo (`play`, `pause`, `next`, `skip`, `load`) | sí | sin mínimo; el mini mide 20 px |
| **Bandcamp** | **la más alta** | **ninguno** | sí | reproductor pequeño |
| **Spotify** | alta en catálogo, no en escena | parcial | **no: 30 s** | compacto |

**YouTube** exige un viewport de al menos 200×200 y prohíbe tapar cualquier
parte del reproductor, atribución incluida
([Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality),
[Developer Policies](https://developers.google.com/youtube/terms/developer-policies)).
No hay forma legal de esconderlo detrás del disco, y este proyecto no evade
términos. Esa restricción **ordenó el diseño entero**: el video se ve, y como es
el registro de un toque en una sala de acá, es más de la escena que cualquier
arte de tapa.

**SoundCloud** ⚠️ **no está cerrado como dice `context/archivo/`.** Lo que está
cerrado desde hace años es el registro de apps de su **Data API**; el **Widget
API** se embebe con la dirección pública del track y no pide clave. Son dos
cosas distintas y la segunda sigue viva.

**Bandcamp** es donde el underground bogotano publica de verdad —El Kalvo,
Nicolás y los Fumadores, N.Hardem tienen página propia— pero no expone control
por JavaScript: no se puede encadenar. Por eso vive en `artists.bandcamp_url` y
sale en la ficha como el disco completo, no en la cola. Hay además una razón
editorial: **es donde el artista cobra**.

**Spotify queda descartado.** Sin sesión reproduce 30 segundos, y hay reportes
de que bloquea la reproducción en iframe desde dominios externos aunque el
usuario esté conectado. Una rockola que a veces suena no es una rockola.

## Las dos trampas, las dos mudas

Ninguna de las dos daba un error en consola, y las dos se veían del tamaño
correcto. Se documentan porque el modo de fallar es el mismo: **parecen bien**.

### 1. `YT.Player` reemplaza el nodo que recibe, no monta dentro de él

Si ese nodo es de React, los dos se pelean por el mismo elemento — y en
desarrollo, donde los efectos corren dos veces, el segundo montaje quedaba
colgado de un nodo que ya había salido del documento. El iframe existía, medía
lo que debía, estaba en su sitio y **no reproducía nada**.

Se encontró **comparando contra un iframe pelado con el mismo video**, que sí
cargaba: eso descartó el entorno y dejó el código como único sospechoso. Es la
técnica que sirve cuando no hay error: reproducir lo mismo por la vía más
simple posible.

La solución es darle a la librería un nodo creado a mano que React no maneje.

### 2. Ese nodo propio no hereda las clases del que reemplazó

Al arreglar lo anterior, el nodo nuevo salió sin clases, así que YouTube armó su
iframe con los **640×390 por defecto** y la caja de 200×200 con `overflow-hidden`
mostraba la esquina superior izquierda del video. **Medía lo correcto y le
faltaba media imagen.** Se arregla pasándole `width`/`height` al Player y
sosteniéndolo con una regla de CSS, porque el elemento no es nuestro.

La lección: al ceder un nodo a una librería externa **se cede también su
estilo**, y hay que devolvérselo por la API de la librería o por una regla que
no dependa de clases.

## El bug de fechas, que es el mismo de siempre con otra cara

El filtro de "qué toques están por venir" comparaba `starts_at` contra el
inicio del día **como cadenas**. Las dos son ISO pero con husos distintos
—`+00:00` la una, `-05:00` la otra—, así que la comparación responde por el
orden de los caracteres. Un show de anoche a las 11 p. m. —que se guarda como
las 04:00Z de hoy— aparecía como futuro, porque en texto `"04"` es mayor que
`"00"`.

Lo resuelve `siguePorVenir` en `src/lib/fechas.ts`, y su test de regresión se
comprobó al revés: **reintroduciendo el bug, falla**. Un test de fechas que pasa
con el bug puesto no es un test.
