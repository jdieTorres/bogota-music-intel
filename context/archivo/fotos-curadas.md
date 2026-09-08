# Fotos de sala como lista curada — archivado

> `services/api/bogota_music_intel/fotos_curadas.py` y `fotos_cli.py`, escritos
> el 2026-08-29 y archivados el 2026-09-08 sin haber llegado a tener una sola
> entrada. Está todo en el historial de git. Las fotos ahora se pegan en
> `/admin` → Salas y se guardan directo en `venues.photo_url`.

## Qué eran

`fotos_curadas.py` era un `dict` de `slug → FotoCurada(url, evidencia)`, con
el mismo patrón que `coordenadas_curadas.py`, y `fotos_cli.py` lo aplicaba a
Supabase con un `update` por fila. La columna `venues.photo_url` es anterior y
**sigue viva**: lo que se archivó es el camino por el que se llenaba, no el
dato.

## Por qué no funcionaba

El diagnóstico del 2026-08-29 era correcto en su mitad: **ninguna fuente que
scrapeamos publica foto del venue** —los afiches que llegan son del show, no
del lugar— así que el dato tiene que entrar a mano. De ahí saltó a la
conclusión equivocada: que si entra a mano, va en una lista curada como las
otras seis.

**Las otras seis las alimenta la ingesta.** Un artista que MusicBrainz no
resuelve aparece corriendo el cron, se cura una vez y la entrada sirve para
todos sus eventos futuros; el archivo en git es el lugar correcto porque el
que lo consulta es el pipeline. La foto de una sala no la produce ningún
proceso: la busca una persona en el sitio de la sala o en Google Maps, y sirve
para una sola fila.

Con la lista, cargar una foto costaba **un commit, una corrida de CLI y un
despliegue** — más agregar el host a `images.remotePatterns`, sin lo cual
`next/image` no degrada: lanza y tumba la página. Cuatro pasos, tres de ellos
para un dato que ya se estaba escribiendo a mano. Terminó con cero entradas en
diez días y 0 de 18 salas con foto.

## La lección, que ya estaba escrita

Es literalmente el mismo caso que `eventos_excluidos.py`, que se mudó a la
tabla `blocked_source_events` el 2026-08-31 con este argumento: *"la lista
tiene que ser escribible desde el formulario, así que vive en la base y no en
git"*. La regla general quedó en `context/ingesta/CLAUDE.md`:

> Una lista curada es la respuesta cuando el dato lo produce la ingesta.
> Cuando lo produce una persona, el lugar es el formulario.

**Lo que sí sobrevivió de la lista es su criterio**, que era la parte valiosa:
la foto tiene que ser la fachada o el interior de la sala, de una fuente
verificable; un logo no sirve y el afiche de un evento tampoco. Estaba en el
docstring de `fotos_curadas.py` — o sea, donde no lo iba a leer quien llena el
formulario. Ahora está impreso en el campo de `/admin`.

## Y la evidencia, ¿dónde quedó?

La regla dura dice que **lo curado exige `evidencia`**, y la lista tenía un
campo para eso. La tabla `venues` no lo tiene, y no hace falta: **acá el dato
*es* su propia evidencia**. Una nacionalidad curada afirma algo que hay que
poder rastrear hasta una fuente; una URL de foto apunta a la página de donde
salió — abrirla es la verificación. No pasa lo mismo con las coordenadas ni
con el origen de un artista, así que esto no debilita la regla: la acota a los
datos que no traen su fuente puesta.
