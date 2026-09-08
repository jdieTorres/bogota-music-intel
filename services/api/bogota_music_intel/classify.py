"""Decide qué es un evento: música, fiesta, festival o ninguna de las tres.

**Contesta una sola pregunta, `event_type`.** Hasta el 2026-09-08 contestaba
dos: también resolvía el origen del artista (`is_local`) consultando
MusicBrainz y una lista curada. Eso se dio de baja por decisión de Juan —
`is_local` ahora lo escribe una persona en `/admin` y nada más.

Por qué se cayó: MusicBrainz contesta **nacionalidad**, y en pantalla eso se
imprimía como «de la escena local», que es otra afirmación. Carlos Vives y
Juanes son colombianos y no son escena local; El Kalvo lo es y MusicBrainz no
sabe de dónde es. La señal medía una cosa y la etiqueta decía otra, así que
no era un problema de umbral sino de pregunta equivocada. El detalle, en
`context/archivo/musicbrainz-y-artistas-locales.md`.

Efecto lateral bueno: la clasificación **ya no sale a la red**. No hay límite
de peticiones que respetar, ni un 503 que pueda dejar eventos sin clasificar,
ni una corrida del cron que dependa de un servicio ajeno.

Hay dos categorías más además de la música, y las dos comparten la misma
forma: **no hay un artista de cartel a quien identificar**, que no es lo
mismo que no haberlo podido identificar. La **fiesta** es la noche o el
ciclo que programa la sala; el **festival** son varios días y varios
artistas, casi siempre en un parque. Se separan entre sí porque ordenar una
noche de club junto a Rock al Parque no compara nada. Las dos se muestran
en la cartelera, cada una en su pestaña.

El orden de las señales va de la más confiable a la más frágil, y la
primera que contesta gana:

    1. lista curada de eventos (alguien lo verificó en la fuente)
    2. lista curada de ciclos  (fiestas, por nombre para que vuelvan solas)
    3. lista curada de festivales (por título completo, ver el módulo)
    4. categoría de la fuente  (la publicó la sala)
    5. patrón en el título     (heurística nuestra)

Si ninguna contesta, es música. Asumir que sí es lo correcto: el costo de
mostrar de más es un evento que sobra en una lista, y el de excluir de más
es un toque que desaparece sin que nadie se entere.

Nada de esto borra filas: la ingesta sigue guardando todo crudo y esto solo
marca. Si mañana cambia el criterio, se reclasifica sin volver a scrapear.
"""
from dataclasses import dataclass

from bogota_music_intel.ciclos_curados import ciclo_de
from bogota_music_intel.clasificacion_manual import CLASIFICACION_MANUAL
from bogota_music_intel.exclusion_patterns import (
    categoria_no_musical,
    patron_no_musical,
)
from bogota_music_intel.festivales_curados import festival_de
from bogota_music_intel.tipos_evento import (
    FESTIVAL,
    FIESTA,
    FUENTE_ASUMIDO,
    FUENTE_CATEGORIA,
    FUENTE_CICLO,
    FUENTE_FESTIVAL,
    FUENTE_MANUAL,
    FUENTE_PATRON,
    MUSICA,
    NO_MUSICA,
)


@dataclass(frozen=True)
class Clasificacion:
    event_type: str
    classification_source: str
    # Por qué quedó así, en castellano. Se imprime en el CLI: un evento que
    # desaparece de la cartelera sin explicación es imposible de auditar.
    detalle: str

    # ⚠️ **No hay `is_local` acá, y es a propósito.** Que el campo no exista
    # es lo que garantiza que nada automático lo escriba: el origen del
    # artista lo decide una persona en `/admin` desde el 2026-09-08.


def clasificar(evento: dict) -> Clasificacion:
    """Clasifica una fila de `events`. Necesita source, source_event_id,
    title y category (puede venir en None)."""
    clave = (evento["source"], evento["source_event_id"])
    curada = CLASIFICACION_MANUAL.get(clave)
    if curada is not None:
        return Clasificacion(
            event_type=curada.event_type,
            classification_source=FUENTE_MANUAL,
            detalle=f"curado a mano: {curada.evidencia}",
        )

    ciclo = ciclo_de(evento["title"])
    if ciclo is not None:
        return Clasificacion(
            event_type=FIESTA,
            classification_source=FUENTE_CICLO,
            detalle=f"ciclo «{ciclo.nombre}»: {ciclo.evidencia}",
        )

    festival = festival_de(evento["title"])
    if festival is not None:
        return Clasificacion(
            event_type=FESTIVAL,
            classification_source=FUENTE_FESTIVAL,
            detalle=f"festival «{festival.nombre}»: {festival.evidencia}",
        )

    motivo = categoria_no_musical(evento.get("category"))
    if motivo:
        return Clasificacion(
            event_type=NO_MUSICA,
            classification_source=FUENTE_CATEGORIA,
            detalle=motivo,
        )

    motivo = patron_no_musical(evento["title"])
    if motivo:
        return Clasificacion(
            event_type=NO_MUSICA,
            classification_source=FUENTE_PATRON,
            detalle=motivo,
        )

    # Nada lo excluye: es música. Antes de acá se preguntaba de dónde era el
    # artista; esa pregunta ya no la contesta el pipeline.
    return Clasificacion(
        event_type=MUSICA,
        classification_source=FUENTE_ASUMIDO,
        detalle="ninguna regla lo excluye",
    )
