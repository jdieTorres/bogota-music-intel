---
name: nueva-fuente
description: Agrega un scraper de una sala o cartelera nueva al pipeline de ingesta, en el orden correcto — legalidad primero, parser después, y los tres registros que se olvidan al final. Usar cuando Juan pida sumar una fuente, un venue o una cartelera nueva.
---

# Sumar una fuente de eventos

Agregar un scraper son nueve pasos repartidos entre `context/ingesta/` y el
patrón de `services/api/bogota_music_intel/scrapers/`. Casi ninguno es difícil;
lo que cuesta es acordarse de los tres últimos, que son los que rompen cosas en
silencio.

**Andá en orden.** El paso 1 puede cancelar todo el resto, y hacerlo al final
significa haber escrito un parser que no se puede usar.

---

## 1. ¿Nos deja entrar? — antes de escribir una línea

Pedí el `robots.txt` de la fuente y mirá el bloque `User-agent: *` **y** los
agentes de IA nombrados uno por uno (ClaudeBot, GPTBot, CCBot,
Google-Extended).

**Si bloquea, se para acá.** Tuboleta, Bandsintown, Songkick e Instagram están
vedados y no se evaden: para esos la vía es **pegar, no traer** — el admin
copia el contenido en el formulario. Si el admin pega una URL y nuestro
servidor la va a buscar, sigue siendo nuestro agente entrando donde no lo
dejan; la distinción es real y no se difumina.

La auditoría del 2026-08-31 está en `context/ingesta/fuentes-y-legalidad.md`,
con el resultado de nueve sitios. Miralo primero: puede que la fuente ya esté
evaluada.

## 2. Llamarla, no leerla

A una API se le pregunta llamándola. Un `GET` contesta en un minuto lo que la
documentación contesta mal: la investigación documental de APIs de música dio
cuatro entradas falsas.

Mirá qué publica de verdad y anotá **qué campos trae y cuáles no**. En especial:
hora (¿o solo fecha?), precio, imagen, dirección de la sala, categoría.

## 3. El parser

Nuevo archivo en `services/api/bogota_music_intel/scrapers/<fuente>.py`, con
`SOURCE = "<fuente>"` y `def scrape() -> list[ScrapedEvent]`. Mirá
`latino_power.py` (API JSON) o `visitbogota.py` (HTML, el único con
schema.org/Event) como molde.

Reglas que se pagaron con un bug:

- **Guardar crudo.** El parser no descarta: no es acá donde se decide si un
  evento es música o fiesta. Eso lo hace el clasificador, al leer.
- **`price_text` guarda lo que publicó la fuente, tal cual**, y los tres campos
  de `precios.py` guardan el precio interpretado. Una fuente puede publicar el
  precio dos veces y tener una de las dos redondeada — Latino Power decía "$34"
  por una boleta de 33.900, y así estuvieron 7 eventos. Leé
  `context/ingesta/precios.md` antes de tocar el precio.
- **Sin hora no se inventa hora.** `date_precision` lo dice: `"day"` si solo
  hay fecha, `"unknown"` si no hay ni eso. Nunca las 12:00 a. m. de relleno.
- **La zona horaria se declara explícita** (`ZoneInfo("America/Bogota")`), no se
  hereda de la máquina ni se le cree a la que declara el sitio — esa suposición
  ya resultó falsa y tiene test.
- **Si consulta una API externa con límite, el espaciado va adentro de este
  módulo**, nunca en el CLI que lo llama.
- **`source_event_id` es la identidad del evento.** La URL no sirve: también
  resultó falsa y tiene test. Usá el id de la fuente.

Ojo con lo que hace fallar todo el lote: si una ficha falla, **falla la fuente
entera a propósito** (`_prune_missing_events` borra los futuros que no vinieron
en el lote, así que un lote incompleto no omite, borra). No envuelvas cada
ficha en un `try/except` que se la trague.

## 4. El registro

`services/api/bogota_music_intel/scrapers/registry.py`: importar el módulo y
sumar `<fuente>.SOURCE: <fuente>.scrape` al diccionario `SCRAPERS`. De ahí sale
`--source` del CLI, así que sin esto la fuente no existe.

## 5. El host de la imagen ⚠️

`apps/web/next.config.ts`, `images.remotePatterns`: agregar el hostname de
donde vengan las imágenes.

**Este es el que se olvida.** `next/image` no degrada con un host no permitido:
**lanza y rompe la tarjeta.** Al sumar visitbogota nadie lo agregó y la ingesta
estuvo un día guardando 51 imágenes de un host prohibido; se supo cuando Juan
abrió la página. La lista sigue siendo explícita y no un comodín a propósito
—abrirla convertiría al optimizador de Next en un proxy de imágenes para
cualquiera—, y `moderacion_cli` avisa en el log del cron cuando llega un host
que no está.

## 6. Los tests

`services/api/tests/`. Como mínimo, uno de precio en `test_precio_scrapers.py`
con un payload real recortado de la fuente. Si la fuente tiene una trampa —una
hora rara, un precio duplicado, un campo que miente— **el test es de esa
trampa**, no del camino feliz.

## 7. Correrla en seco

```
python -m bogota_music_intel.scrape_cli --dry-run --source <fuente>
```

Mirá los eventos que salen, no solo que no reviente. Y **preguntale a Juan
antes de correrla sin `--dry-run`**: eso escribe en la base.

## 8. Lo que la fuente nueva reabre ⚠️

El bloqueo de eventos es por `(source, source_event_id)`, así que **una fuente
nueva esquiva todo lo que Juan ya rechazó** — no puede saber de fuentes que no
existían. Avisale: la cola va a traer de vuelta cosas ya descartadas.

Y la escena: `is_local` **ya no lo calcula nada** desde el 2026-09-08 —se dio
de baja MusicBrainz junto con la lista de artistas curados—, así que todo lo
que traiga la fuente nueva entra sin marcar y lo decide Juan en `/admin`. No
hay lista que actualizar; hay eventos que mirar.

## 9. Dejarlo escrito

Qué publica la fuente y qué no, en `context/ingesta/fuentes-y-legalidad.md`
(cobertura y trampas de datos) y en `context/ingesta/precios.md` si el precio
tiene alguna vuelta. **Cuál de las dos señales de categoría sirve —la del
listado o la de la ficha— se mide fuente por fuente y no se hereda**, así que
anotá cuál usaste y cómo lo comprobaste.

Las cifras y lo que quede pendiente van a `ESTADO.md`, no acá.

---

## Al terminar

Preguntale a Juan si commitea (`/commitear`) y si corre el cron. Él decide el
momento.
