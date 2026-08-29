"""Arma el radar de tendencias: trae los artistas de las dos fuentes
(`deezer.py`, `lastfm.py`) y ofrece cómo resolver de dónde es cada uno.

La editorial de Deezer mezcla nacionalidades a propósito —"Música
colombiana" trae también a Bad Bunny— y el top de Last.fm es directamente
lo más escuchado sin filtrar por origen. Las dos necesitan el mismo criterio
"no sé" vs. "confirmado que no" que ya tiene la cartelera (`classify.py`),
así que se resuelve con las mismas fuentes: primero la lista curada, porque
además de cubrir lo que MusicBrainz no tiene sirve para corregirlo cuando
se equivoca, y después MusicBrainz.

A diferencia de `classify.py`, acá no hay título de evento que trocear: el
nombre del artista ya viene limpio de la API, así que no hace falta
`candidatos_de_titulo`.

El llamador (`radar_cli.py`) es quien decide qué hacer si MusicBrainz no
responde, igual que `classify_cli.py` decide por los eventos: acá no se
atrapa `MusicBrainzNoDisponible`, para no confundir "no se pudo preguntar"
con "se preguntó y no se supo".
"""
from dataclasses import dataclass

import httpx

from bogota_music_intel.artistas_locales import artista_curado
from bogota_music_intel.deezer import ArtistaDeezer, top_artistas as deezer_top_artistas
from bogota_music_intel.lastfm import ArtistaLastfm, top_artistas_colombia
from bogota_music_intel.musicbrainz import resolver_artista
from bogota_music_intel.tipos_evento import FUENTE_ARTISTA_CURADO, FUENTE_MUSICBRAINZ

FUENTE_DEEZER = "deezer_editorial"
FUENTE_LASTFM = "lastfm_geo"


@dataclass(frozen=True)
class Candidato:
    """Un artista tal como llegó de la fuente, todavía sin resolver."""

    source: str
    rank: int
    artist_name: str
    external_id: str | None
    image_url: str | None
    metric: int | None


@dataclass(frozen=True)
class FilaTendencia:
    source: str
    rank: int
    artist_name: str
    external_id: str | None
    image_url: str | None
    metric: int | None
    is_local: bool | None
    classification_source: str | None


def obtener_candidatos(limit: int = 50) -> list[Candidato]:
    candidatos = [
        Candidato(
            source=FUENTE_DEEZER,
            rank=a.rank,
            artist_name=a.name,
            external_id=a.external_id,
            image_url=a.image_url,
            metric=None,
        )
        for a in deezer_top_artistas(limit=limit)
    ]
    candidatos += [
        Candidato(
            source=FUENTE_LASTFM,
            rank=a.rank,
            artist_name=a.name,
            external_id=None,
            image_url=a.image_url,
            metric=a.listeners,
        )
        for a in top_artistas_colombia(limit=limit)
    ]
    return candidatos


def resolver_origen(
    nombre: str, client: httpx.Client | None = None
) -> tuple[bool | None, str | None]:
    """(is_local, classification_source) para un nombre de artista ya
    limpio. (None, None) cuando ninguna fuente lo resuelve — no se adivina.

    Puede propagar `MusicBrainzNoDisponible`: es responsabilidad del
    llamador decidir si reintentar, saltar o cortar la corrida.
    """
    curado = artista_curado(nombre)
    if curado is not None:
        return curado.es_local, FUENTE_ARTISTA_CURADO

    artista = resolver_artista(nombre, client=client)
    if artista is not None and artista.es_local is not None:
        return artista.es_local, FUENTE_MUSICBRAINZ

    return None, None
