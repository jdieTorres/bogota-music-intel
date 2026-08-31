"""geo.gettopartists trae popularidad real por país: el eje que a Deezer le
falta. La forma de la respuesta se verificó llamando a la API de verdad el
2026-08-28 (docs/investigacion-tecnica-plataforma-musical.md § 2.2)."""
import httpx
import pytest

from bogota_music_intel import lastfm
from bogota_music_intel.config import settings


@pytest.fixture(autouse=True)
def con_api_key(monkeypatch):
    monkeypatch.setattr(settings, "lastfm_api_key", "test-key")


def _cliente_falso(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_lee_nombre_rank_oyentes_e_imagen_grande():
    def handler(request):
        return httpx.Response(
            200,
            json={
                "topartists": {
                    "artist": [
                        {
                            "name": "Bad Bunny",
                            "listeners": "2171",
                            "@attr": {"rank": "1"},
                            "image": [
                                {"#text": "small.png", "size": "small"},
                                {"#text": "large.png", "size": "large"},
                            ],
                        }
                    ]
                }
            },
        )

    with _cliente_falso(handler) as cliente:
        artistas = lastfm.top_artistas_colombia(client=cliente)

    assert len(artistas) == 1
    assert artistas[0].name == "Bad Bunny"
    assert artistas[0].rank == 1
    assert artistas[0].listeners == 2171
    assert artistas[0].image_url == "large.png"


def test_filtra_la_imagen_generica_de_last_fm():
    # Last.fm dejó de servir fotos reales por su API y devuelve esta misma
    # estrella para todos. Verificado con una corrida real el 2026-08-28.
    def handler(request):
        return httpx.Response(
            200,
            json={
                "topartists": {
                    "artist": [
                        {
                            "name": "BTS",
                            "listeners": "1400",
                            "@attr": {"rank": "3"},
                            "image": [
                                {
                                    "#text": (
                                        "https://lastfm-img.freetls.fastly.net/i/u/174s/"
                                        "2a96cbd8b46e442fc41c2b86b821562f.png"
                                    ),
                                    "size": "large",
                                }
                            ],
                        }
                    ]
                }
            },
        )

    with _cliente_falso(handler) as cliente:
        artistas = lastfm.top_artistas_colombia(client=cliente)

    assert artistas[0].image_url is None


def test_sin_key_avisa_antes_de_llamar(monkeypatch):
    monkeypatch.setattr(settings, "lastfm_api_key", "")

    def handler(request):
        raise AssertionError("no debería llegar a pedir nada sin key")

    with pytest.raises(RuntimeError, match="lastfm_api_key"):
        lastfm.top_artistas_colombia(client=_cliente_falso(handler))


def test_error_de_la_api_no_se_confunde_con_lista_vacia():
    # Last.fm contesta 200 con un cuerpo de error para una key inválida, no
    # un código HTTP de error: hay que mirar el cuerpo.
    def handler(request):
        return httpx.Response(200, json={"error": 10, "message": "Invalid API key"})

    with _cliente_falso(handler) as cliente, pytest.raises(lastfm.LastfmNoDisponible):
        lastfm.top_artistas_colombia(client=cliente)
