"""Decide si un evento entra a la cartelera y con cuánta prioridad.

Traduce a código las dos decisiones editoriales que tomó Juan (2026-08-27):

1. **Lo que no es música en vivo se excluye.** Comedia, lucha libre, teatro.
2. **Los artistas internacionales no se excluyen**, van en segundo plano.
   Un show de Robbie Williams en el Movistar es parte de la escena en vivo
   de Bogotá aunque no sea un toque local.

Son dos preguntas distintas y se resuelven por separado: `event_type`
contesta la primera, `is_local` la segunda.

El orden de las señales va de la más confiable a la más frágil, y la
primera que contesta gana:

    1. lista curada a mano   (alguien lo verificó en la fuente)
    2. categoría de la fuente (la publicó la sala)
    3. patrón en el título    (heurística nuestra)
    4. MusicBrainz            (para el origen del artista)

Nada de esto borra filas: la ingesta sigue guardando todo crudo y esto solo
marca. Si mañana cambia el criterio, se reclasifica sin volver a scrapear.
"""
from dataclasses import dataclass

import httpx

from bogota_music_intel.clasificacion_manual import CLASIFICACION_MANUAL
from bogota_music_intel.exclusion_patterns import (
    categoria_no_musical,
    patron_no_musical,
)
from bogota_music_intel.musicbrainz import limpiar_titulo, resolver_artista
from bogota_music_intel.tipos_evento import (
    FUENTE_ASUMIDO,
    FUENTE_CATEGORIA,
    FUENTE_MANUAL,
    FUENTE_MUSICBRAINZ,
    FUENTE_PATRON,
    MUSICA,
    NO_MUSICA,
)


@dataclass(frozen=True)
class Clasificacion:
    event_type: str
    is_local: bool | None
    classification_source: str
    # Por qué quedó así, en castellano. Se imprime en el CLI: un evento que
    # desaparece de la cartelera sin explicación es imposible de auditar.
    detalle: str
    # Si se llegó a consultar MusicBrainz. El ritmo lo controla el propio
    # módulo; esto sirve para reportar y para verificar en los tests que las
    # exclusiones no gastan una petición.
    consulto_red: bool = False


def clasificar(evento: dict, client: httpx.Client | None = None) -> Clasificacion:
    """Clasifica una fila de `events`. Necesita source, source_event_id,
    title y category (puede venir en None)."""
    clave = (evento["source"], evento["source_event_id"])
    curada = CLASIFICACION_MANUAL.get(clave)
    if curada is not None:
        return Clasificacion(
            event_type=curada.event_type,
            is_local=curada.is_local,
            classification_source=FUENTE_MANUAL,
            detalle=f"curado a mano: {curada.evidencia}",
        )

    motivo = categoria_no_musical(evento.get("category"))
    if motivo:
        return Clasificacion(
            event_type=NO_MUSICA,
            is_local=None,
            classification_source=FUENTE_CATEGORIA,
            detalle=motivo,
        )

    motivo = patron_no_musical(evento["title"])
    if motivo:
        return Clasificacion(
            event_type=NO_MUSICA,
            is_local=None,
            classification_source=FUENTE_PATRON,
            detalle=motivo,
        )

    # Nada lo excluye: se asume música. El origen del artista es otra
    # pregunta, y no poder contestarla no cambia que el evento se muestre.
    nombre = limpiar_titulo(evento["title"])
    if not nombre:
        return Clasificacion(
            event_type=MUSICA,
            is_local=None,
            classification_source=FUENTE_ASUMIDO,
            detalle="del título no queda nada consultable; origen sin resolver",
        )

    artista = resolver_artista(nombre, client=client)
    if artista is None:
        return Clasificacion(
            event_type=MUSICA,
            is_local=None,
            classification_source=FUENTE_ASUMIDO,
            detalle=f"MusicBrainz no reconoce «{nombre}»; origen sin resolver",
            consulto_red=True,
        )

    if artista.es_local is None:
        return Clasificacion(
            event_type=MUSICA,
            is_local=None,
            classification_source=FUENTE_ASUMIDO,
            detalle=f"«{artista.nombre}» existe en MusicBrainz pero sin país",
            consulto_red=True,
        )

    origen = "local" if artista.es_local else f"internacional ({artista.pais})"
    return Clasificacion(
        event_type=MUSICA,
        is_local=artista.es_local,
        classification_source=FUENTE_MUSICBRAINZ,
        detalle=f"«{nombre}» -> {artista.nombre} [{artista.pais}] {origen}",
        consulto_red=True,
    )
