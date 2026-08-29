"""La editorial de Deezer trae artistas ya rankeados; solo hay que leerlos
tal cual, sin la lógica de parseo de título que sí necesita MusicBrainz."""
import httpx

from bogota_music_intel.deezer import top_artistas


def _cliente_falso(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_lee_id_nombre_posicion_e_imagen():
    def handler(request):
        return httpx.Response(
            200,
            json={
                "artists": {
                    "data": [
                        {
                            "id": 472354,
                            "name": "Systema Solar",
                            "position": 1,
                            "picture_medium": "https://example.com/systema.jpg",
                        },
                        {"id": 16129, "name": "Kraken", "position": 2},
                    ]
                }
            },
        )

    with _cliente_falso(handler) as cliente:
        artistas = top_artistas(client=cliente)

    assert len(artistas) == 2
    assert artistas[0].external_id == "472354"
    assert artistas[0].name == "Systema Solar"
    assert artistas[0].rank == 1
    assert artistas[0].image_url == "https://example.com/systema.jpg"
    # Kraken no trae picture_medium en este fixture: no se inventa un valor.
    assert artistas[1].image_url is None


def test_lista_vacia_no_rompe():
    def handler(request):
        return httpx.Response(200, json={"artists": {"data": []}})

    with _cliente_falso(handler) as cliente:
        assert top_artistas(client=cliente) == []
