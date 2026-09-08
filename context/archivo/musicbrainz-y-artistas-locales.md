# MusicBrainz y la lista de artistas locales (archivo)

> Dados de baja el **2026-09-08**, por decisión de Juan. Se conserva para no
> volver a construir lo mismo. El código está en el historial de git.

## Qué eran

- **`musicbrainz.py`** — cliente de la API de MusicBrainz. Partía el título en
  candidatos de artista (`candidatos_de_titulo`), consultaba cada uno, y si
  encontraba país lo traducía a `is_local` (`CO` → local). Traía todo un
  aparato: 1 petición por segundo respetada dentro del módulo, tres reintentos,
  espera de 5 s tras un 503, un guardia de parecido de 0.88 para no aceptar un
  match con nombre distinto, y `MusicBrainzNoDisponible` para distinguir "no se
  pudo preguntar" de "no se encontró".
- **`artistas_locales.py`** — 9 artistas curados a mano con evidencia, para
  cubrir lo que MusicBrainz no sabe. Seis locales (Todo Copas, Ancestral Beats,
  El Kalvo, Mukangu, Atake Mapalé, Los Yoryis) y tres no locales (pablopablo,
  El Plan de la Mariposa, Slaughter to Prevail).
- Los pasos 6 y 7 de `classify.py`, `FUENTE_ARTISTA_CURADO`,
  `FUENTE_MUSICBRAINZ`, el `conftest.py` que aceleraba las esperas, y todo el
  manejo de fallas de red en `classify_cli.py`.

## Por qué se cayeron

**La señal medía una cosa y la etiqueta decía otra.** MusicBrainz contesta
**nacionalidad**; en pantalla eso se imprimía como *«de la escena local»*, que
es una afirmación distinta. El día que se dio de baja, de los 12 eventos
publicados marcados como locales, **9 los había marcado MusicBrainz**: Carlos
Vives, Juanes, Aterciopelados, Jorge Celedón, Jhon Alex Castaño, Reykon,
LosPetitFellas, Jhonny Rivera y La Muchacha. Colombianos todos; escena local
ninguno. Los 3 correctos —Mukangu, Todo Copas, El Kalvo— venían de la lista
curada, no de la API.

No era un problema de umbral ni de fuente: **era la pregunta equivocada.** Un
clasificador que contesta bien "¿de qué país es?" no puede contestar "¿es de
esta escena?", porque la segunda no es un hecho registrado en ninguna base —
es un juicio editorial. Y los juicios editoriales los toma una persona, que es
donde terminó: `is_local` se escribe en el formulario de `/admin` y en ningún
otro lado.

Es la misma lección de `fotos-curadas.md` un nivel más arriba: **cuando el dato
lo produce un criterio y no una medición, el lugar es el formulario.**

## Lo que dejó bueno al irse

- **La clasificación ya no sale a la red.** No hay límite de peticiones que
  respetar, ni un 503 que pueda dejar eventos sin clasificar, ni una corrida
  del cron que dependa de un servicio ajeno. `classify_cli` pasó de ~50 s a
  milisegundos y no puede fallar por causas externas.
- **`classify.py` contesta una sola pregunta** (`event_type`) y su dataclass ya
  no tiene el campo `is_local` — que no exista es lo que garantiza que ningún
  automatismo lo escriba.
- Se sacó `is_local` de `CAMPOS_HEREDADOS` y de `CAMPOS_DE_CLASIFICACION` en
  `moderacion.py`. ⚠️ **No pueden volver:** las filas crudas viejas conservan
  el valor que les puso MusicBrainz, así que dejarlo en cualquiera de las dos
  listas seguiría bajándolo al canónico.

## Lo que hay que saber si alguien lo quiere reponer

- Las 9 entradas curadas y las constantes están en el historial de git; el
  commit que las quita las nombra.
- `classification_source` sigue teniendo `curated_artist` y `musicbrainz` en
  filas viejas: son valores válidos que ya no se producen, no basura.
- **Antes de reponerlo, leer arriba por qué se fue.** El problema no era la
  cobertura de MusicBrainz —eso se sabía desde el principio y por eso existía
  la lista curada—: era que la pregunta que contesta no es la que el producto
  necesita.
- `apis-de-musica.md` cierra la búsqueda de una API que sí conteste el origen
  del artista local emergente: se probaron Deezer, iTunes y Wikidata y ninguna
  lo tiene. No hay una fuente mejor esperando.
