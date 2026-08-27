"""Origen de artistas que MusicBrainz no resuelve, verificado a mano.

Por qué existe: MusicBrainz cubre bien al internacional consagrado y mal al
local emergente, que es exactamente al revés de lo que esta plataforma
necesita. De los 58 eventos de la primera corrida, solo 3 quedaron
confirmados como locales, y los tres son de música popular con catálogo
comercial. Artistas colombianos reales —El Kalvo, PABLOPABLO, Todo Copas—
quedaron sin resolver; El Kalvo incluso figura en MusicBrainz **sin país**.

Esta lista se consulta **antes** que MusicBrainz, así que también sirve
para corregirlo cuando se equivoca.

Reglas para agregar una entrada:
1. La nacionalidad tiene que venir de una fuente verificable —la página del
   evento, el sitio del artista, una nota de prensa—, nunca de memoria ni
   deducida del nombre.
2. Dejar escrito en `evidencia` de dónde salió.
3. Si hay duda, no agregarla: el evento se muestra igual, solo que sin
   destacarse. Un "no sabemos" no le hace daño a nadie; un artista marcado
   como local sin serlo ensucia justamente lo que la cartelera promueve.
"""
import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class ArtistaCurado:
    nombre: str
    es_local: bool
    evidencia: str


ARTISTAS: list[ArtistaCurado] = [
    ArtistaCurado(
        nombre="Todo Copas",
        es_local=True,
        evidencia=(
            "Grupo de hip hop colombiano. La página del evento en "
            "tickets.latinopower.com.co lo describe textualmente como «una "
            "de las agrupaciones más representativas del hip hop "
            "colombiano», celebrando 20 años de trayectoria con la gira "
            "'Rap con Criterio'. El título del evento ('Todo copas en "
            "Latino Power Bogota 20 Años') hacía parecer que los 20 años "
            "eran de la sala. Verificado 2026-08-27."
        ),
    ),
]


def _normalizar(texto: str) -> str:
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", sin_acentos.casefold())).strip()


def artista_curado(nombre: str) -> ArtistaCurado | None:
    """Busca el nombre ya limpio contra la lista. Exige coincidencia exacta
    del nombre normalizado: acá no se hace la comparación tolerante que se
    usa con MusicBrainz, porque una entrada curada afirma algo y no conviene
    que se aplique a un artista parecido pero distinto."""
    objetivo = _normalizar(nombre)
    if not objetivo:
        return None
    for artista in ARTISTAS:
        if _normalizar(artista.nombre) == objetivo:
            return artista
    return None
