"""Trae los artistas de la editorial "Música colombiana" de Deezer.

No hay chart por país en Deezer (`/chart/{id}` es por género/editorial, no
por país — ver docs/investigacion-tecnica-plataforma-musical.md § 2.2), pero
la editorial 498 ("Música colombiana") funciona y devuelve artistas reales
de la escena: Systema Solar, Kraken, Junior Jein, Totó La Momposina, junto
con internacionales como KAROL G o Feid. Contesta "qué es música
colombiana" según Deezer, no "qué se escucha en Colombia" — ese eje lo
cubre Last.fm (`lastfm.py`).

Sin key: es un endpoint público.
"""
from dataclasses import dataclass

import httpx

EDITORIAL_MUSICA_COLOMBIANA = 498
DEEZER_URL = f"https://api.deezer.com/editorial/{EDITORIAL_MUSICA_COLOMBIANA}/charts"


@dataclass(frozen=True)
class ArtistaDeezer:
    external_id: str
    name: str
    rank: int
    image_url: str | None


def top_artistas(limit: int = 50, client: httpx.Client | None = None) -> list[ArtistaDeezer]:
    propio = client is None
    if propio:
        client = httpx.Client(timeout=30)
    try:
        respuesta = client.get(DEEZER_URL, params={"limit": limit})
        respuesta.raise_for_status()
        data = respuesta.json().get("artists", {}).get("data", [])
        return [
            ArtistaDeezer(
                external_id=str(artista["id"]),
                name=artista["name"],
                rank=artista["position"],
                image_url=artista.get("picture_medium") or None,
            )
            for artista in data
        ]
    finally:
        if propio:
            client.close()
