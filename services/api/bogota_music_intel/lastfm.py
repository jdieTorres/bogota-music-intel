"""Trae los artistas más escuchados en Colombia según Last.fm.

Es el eje que le falta a Deezer (`deezer.py`): `geo.gettopartists` contesta
"qué se escucha en Colombia" por scrobbles reales, no "qué es música
colombiana" —de hecho el top está dominado por Bad Bunny, Karol G y otros
internacionales, que es justamente el dato que Deezer no da—.

Requiere una key gratuita self-service (`bmi_lastfm_api_key`), sacada el
2026-08-28.
"""
from dataclasses import dataclass

import httpx

from bogota_music_intel.config import settings

LASTFM_URL = "http://ws.audioscrobbler.com/2.0/"

# Last.fm dejó de servir fotos reales de artista por su API hace años (tema
# de licencias) y devuelve esta misma imagen genérica —una estrella— para
# todos. Verificado el 2026-08-28: los 100 artistas de una corrida real
# traen exactamente esta URL. Se filtra para no mostrarla como si fuera la
# foto del artista.
IMAGEN_GENERICA_HASH = "2a96cbd8b46e442fc41c2b86b821562f"


class LastfmNoDisponible(RuntimeError):
    """La API respondió pero con un error (key inválida, parámetro malo,
    etc.), distinto de una lista vacía de artistas."""


@dataclass(frozen=True)
class ArtistaLastfm:
    name: str
    rank: int
    listeners: int
    image_url: str | None


def top_artistas_colombia(
    limit: int = 50, client: httpx.Client | None = None
) -> list[ArtistaLastfm]:
    if not settings.lastfm_api_key:
        raise RuntimeError(
            "Falta bmi_lastfm_api_key. Sacala en "
            "https://www.last.fm/api/account/create y definila en "
            "services/api/.env (local) o en el secret del repo (CI)."
        )

    propio = client is None
    if propio:
        client = httpx.Client(timeout=30)
    try:
        respuesta = client.get(
            LASTFM_URL,
            params={
                "method": "geo.gettopartists",
                "country": "colombia",
                "api_key": settings.lastfm_api_key,
                "format": "json",
                "limit": limit,
            },
        )
        respuesta.raise_for_status()
        data = respuesta.json()
        if "error" in data:
            raise LastfmNoDisponible(f"{data.get('error')}: {data.get('message')}")

        artistas = []
        for artista in data.get("topartists", {}).get("artist", []):
            imagenes = {img.get("size"): img.get("#text") for img in artista.get("image", [])}
            url = imagenes.get("large") or imagenes.get("medium") or None
            if url and IMAGEN_GENERICA_HASH in url:
                url = None
            artistas.append(
                ArtistaLastfm(
                    name=artista["name"],
                    rank=int(artista["@attr"]["rank"]),
                    listeners=int(artista["listeners"]),
                    image_url=url,
                )
            )
        return artistas
    finally:
        if propio:
            client.close()
