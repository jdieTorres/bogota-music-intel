# Ingesta — scrapers, listas curadas y clasificación

El cron corre `python -m bogota_music_intel.scrape_cli [--dry-run] [--source X]`
y después `classify_cli`. Nada de lo que trae se publica solo: entra como
borrador a la cola (ver `context/moderacion/CLAUDE.md`).

`services/api/bogota_music_intel/scrapers/registry.py` es **la fuente de
verdad** de qué venues son automatizables y cuáles requieren carga manual, con
el motivo verificado de cada uno.

## Reglas de fuente

- **Guardar crudo, filtrar y clasificar en lectura.** La ingesta no descarta:
  el criterio editorial se aplica al leer. Así, cuando cambie el criterio, no
  hay que volver a scrapear el pasado.
- **La categoría que publica una fuente no siempre coincide con su propia
  ficha**, y cuál de las dos señales sirve **se mide fuente por fuente, no se
  hereda**. En Idartes manda la ruta de la ficha (la etiqueta del listado se
  contradice con la ficha); en visitbogota manda la etiqueta de la ficha
  ("Categoría del evento", 13 de 13 comprobadas).
- **Una señal que sirve para filtrar suele servir mejor para clasificar.**
  Antes de sacar una regla que dejó de hacer falta, preguntarse si el dato que
  usaba sirve un paso más adelante.
- ⚠️ **Si una ficha falla, falla la fuente entera, a propósito.**
  `_prune_missing_events` borra los eventos futuros que no vinieron en el
  lote, así que un lote incompleto no omite lo que falta: lo **borra**. Un día
  de atraso con reintento del cron cuesta menos que borrar eventos reales en
  silencio.
- **Ningún parser es genérico.** Casi ningún venue publica schema.org/Event —
  `visitbogota` es la excepción. Antes de tocar un parser, leer las "Trampas
  de datos" en `context/ingesta/fuentes-y-legalidad.md`: varias suposiciones
  razonables (la zona horaria que declara el sitio, la URL como identidad del
  evento) resultaron falsas y ya tienen tests de regresión.

## Las siete listas curadas

MusicBrainz resuelve bien al internacional consagrado y mal al local
emergente, que es lo contrario de lo que esta plataforma necesita. **No hay
API que reemplace estas listas**: se probaron Deezer, iTunes y Wikidata y
ninguna expone país del artista de forma útil. La lista curada es la
respuesta, no un parche.

Son siete archivos en `services/api/bogota_music_intel/`: `artistas_locales`,
`ciclos_curados`, `festivales_curados`, `coordenadas_curadas`,
`nombres_de_salas`, `fotos_curadas` y `titulos_curados`. **Crecen con cada
corrida del cron**: un evento nuevo con un artista que las bases globales no
conocen vuelve a caer en "sin origen", y quién entra lo decide Juan.

**Todas exigen un campo `evidencia`, y hay tests que lo verifican. La regla: la
nacionalidad, la coordenada o la grafía tiene que venir de una fuente
consultable, nunca de memoria ni de criterio propio.**

⚠️ **Antes de agregar una entrada, leer `context/ingesta/listas-curadas.md`.**
Cada lista tiene una regla de emparejamiento propia que no se puede adivinar:
el festival empareja por título completo y no por subcadena, los ciclos
ignoran el año, y `nombres_de_salas` corrige el nombre visible pero nunca el
slug.

## Normalización de títulos

Los títulos crudos se guardan formateados: **"Artista | Gira"**, con **" & "
entre varios artistas de cartel** (la barra es solo para lo que viene
*después* del artista).

⚠️ **Corre en la ingesta, no al mostrar.** Se aplica cuando el cron abre el
borrador, así que **el título guardado es el título publicado**: lo que el
admin ve en la cola es exactamente lo que sale, y su corrección no la pisa
ninguna transformación posterior. El frontend muestra `title` tal cual.

La regla que hay que tener en la cabeza antes de tocarlo: **solo se suben
mayúsculas, nunca se bajan**, salvo que la fuente esté gritando el título
entero. Una sala que escribió "Lucho Al Attaque" está diciendo algo; bajar esa
'A' a conector sería inventar.

Detalle en `context/ingesta/titulos.md`.

## Lo que no vuelve a entrar

`eventos_excluidos.py` filtra **antes de guardar**, por
`(source, source_event_id)`. Desde el 2026-08-31 **la lista vive en la base**
(`blocked_source_events`) y no en git: la escribe el botón de borrar de
`/admin`, y una lista que el admin tiene que poder escribir no puede estar en
el repo. El archivo quedó solo como el lector.

Por qué en la ingesta y no como bandera de "no mostrar": `save_events` hace
upsert de todo lo que el scraper encuentra, así que un `DELETE` dura hasta la
próxima corrida y el evento vuelve solo.

Es una excepción consciente a "guardar crudo, filtrar en lectura": esa regla
existe para no re-scrapear cuando cambia el **criterio editorial**, y acá no
se aplica un criterio sino una decisión puntual sobre un evento concreto.
**Cualquier cosa que se pueda expresar como regla —no es música, es fiesta, es
internacional— va al clasificador, no acá.**

⚠️ **El bloqueo es por `(fuente, id)`, así que una fuente nueva lo esquiva —
y ya pasó.** El bloqueo se anota sobre la fila cruda que se borró y no puede
saber de fuentes que todavía no existen. Consecuencia: **cada fuente nueva
reabre todo lo que Juan ya rechazó.** Es un argumento para preferir "No va"
(`descartado`) sobre "Borrar" cuando la razón es editorial — descartar deja el
canónico, así que la segunda fuente se le adjunta como duplicado.

## Límites de las APIs externas

**El límite de peticiones se respeta dentro del módulo que la consulta, nunca
en el llamador.** Dejarlo del lado del CLI parece más flexible y falla: la
primera versión del clasificador espaciaba desde el bucle, dejaba escapar dos
peticiones pegadas al arrancar y MusicBrainz devolvía 503 tumbando la corrida.
Con el control adentro de `musicbrainz.py`, las 52 consultas pasaron limpias.
Vale igual para Nominatim (1 req/s, User-Agent identificable).

⚠️ **MusicBrainz responde distinto desde CI que desde la máquina de Juan** —
ver `ESTADO.md`. Un 503 no se guarda como "artista desconocido": deja el
evento sin clasificar para reintentarlo.

## Ver también

- `context/ingesta/fuentes-y-legalidad.md` — legalidad del scraping, auditoría
  de `robots.txt`, auditoría de venues, trampas de datos, y las notas de
  cobertura del 2026-09-01.
- `context/ingesta/listas-curadas.md` — qué guarda cada lista y la regla de
  emparejamiento de cada una. **Leerlo antes de agregar una entrada.**
- `context/ingesta/titulos.md` — las reglas del normalizador y por qué cada
  una es estrecha.
- `context/archivo/apis-de-musica.md` — las APIs evaluadas y descartadas. No
  volver a evaluarlas sin leer esto.
