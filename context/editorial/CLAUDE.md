# Criterio editorial — qué se publica y cómo se ordena

**Principio, definido por Juan el 2026-08-27:** la plataforma prioriza y
promueve **los toques de artistas locales**. No es una cartelera genérica de
eventos de la ciudad. Es criterio de diseño, no solo de filtrado: aplica al
scraping, al ranking y a cómo se presenta cada evento.

## Las cuatro categorías (`events.event_type`)

| Valor | Qué es | Dónde sale |
|---|---|---|
| `music` | concierto con un artista de cartel | `/` — locales primero |
| `fiesta` | noche o ciclo que programa la sala, sin cartel ("Noches Bomm") | `/fiestas` |
| `festival` | varios días, varios artistas, ninguno de cartel (Rock al Parque) | `/festivales` |
| `not_music` | comedia, lucha libre, teatro, danza | fuera de la cartelera |

Las tres primeras se muestran, cada una en su pestaña. **Ordenar una noche de
club junto a un show del Movistar no compara nada**, y tres días en el Simón
Bolívar tampoco: por eso son pestañas y no un filtro.

`fiesta` y `festival` comparten lo que las separa de `music`: **no hay un
artista de cartel a quien preguntarle de dónde es**. Su `is_local` en null es
la respuesta correcta, no un hueco — al contar "sin origen resuelto" hay que
mirar solo los conciertos.

## El origen del artista (`is_local`)

Tres estados y no dos: `null` (no sabemos), `true`, `false`. El ranking solo
castiga al `false`. Se resuelve con `artistas_locales.py` + MusicBrainz —
detalle en `context/ingesta/CLAUDE.md`.

Reclasificar todo cuesta nada: `python -m bogota_music_intel.classify_cli
[--dry-run] [--todas]`. Corre aparte del scraping y por defecto solo mira lo
que llegó sin clasificar.

El criterio que consume el frontend vive en `apps/web/src/lib/editorial.ts`, y
los tres consumidores lo importan de ahí.

## El género (`category`) — cerrado el 2026-09-01

La columna **cumple dos papeles a la vez**, y confundirlos costó dos arreglos
seguidos: alimenta al clasificador (`classify.py` la mira) y es lo que sale
como género en la cartelera. Como dato de clasificación sirve; como campo
rotulado "Género" es mentira en dos de las tres fuentes que lo llenan.

Tres piezas que hay que entender juntas:

- **Se guarda crudo y se filtra al leer.** `generoVisible()` en
  `editorial.ts` esconde las etiquetas que no dicen nada ("Conciertos",
  "Música", "Otro"). El tipo `Evento` **no expone `category`**: expone
  `genero`, ya filtrado. Si el valor crudo no llega a la vista, ningún
  componente puede equivocarse con él.
- **El admin lo puede escribir**, opcional, en los dos formularios de
  `/admin`. Escribe en `canonical_events.category`, así que sobrevive al cron.
- **El filtro es la red de seguridad, no el arreglo.** La respuesta a un
  evento sin chip es escribirle el género real, no ampliar la lista de
  palabras escondidas.

Vacío es el hueco honesto y el chip no sale. En pantalla el chip va **pegado
al título**, no en la fila de la hora y el precio: dice de qué es el toque, no
cómo llegar.

⚠️ **Ninguna fuente lo va a resolver.** Solo Rockal Live publica género de
verdad; el resto o no lo trae o escribe su taxonomía. Los que falten los
escribe Juan a mano o no existen. Las sugerencias del formulario están en
`apps/web/src/lib/admin/generos.ts` y son abiertas (`datalist`, no `select`):
existen para que no convivan "rock", "Rock" y "Rock/Punk/Metal".

## Excluir es caro y silencioso — y eso cambió con la moderación

Un evento que no aparece en la cartelera no deja rastro para nadie, y por eso
las reglas de exclusión se mantuvieron estrechas. **Con la cola de revisión
deja de ser cierto**: un evento mal filtrado sigue siendo visible para el
admin, en su cajón. Ahí las reglas pueden volverse *más* agresivas.

⚠️ **Cuidado con el titular fácil.** "De 44 conciertos en Bogotá, 7 son
locales" **no mide la escena, mide qué salas scrapeamos**. Es honesto como "de
lo que publican estas fuentes" y falso como afirmación sobre la ciudad.

## Ver también

- `context/editorial/filtrado-editorial.md` — cómo se implementó el filtrado
  en 2026-08-27, lo que se midió, y por qué la categoría de la fuente no
  alcanzaba.
- `context/editorial/genero-y-festival.md` — el detalle de los dos ajustes de
  vocabulario del 2026-09-01, incluido el contraejemplo que definió la regla
  de emparejamiento de festivales.
