"""resolver_origen reusa la misma lista curada y el mismo MusicBrainz que
la cartelera (classify.py), sobre un nombre de artista ya limpio: acá no
hace falta trocear un título de evento."""
import httpx

from bogota_music_intel.radar import resolver_origen
from bogota_music_intel.tipos_evento import FUENTE_ARTISTA_CURADO, FUENTE_MUSICBRAINZ


def _cliente_falso(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


class TestResolverOrigen:
    def test_la_lista_curada_gana_antes_de_salir_a_la_red(self):
        def handler(request):
            raise AssertionError("no debería consultar MusicBrainz")

        with _cliente_falso(handler) as cliente:
            is_local, fuente = resolver_origen("Todo Copas", client=cliente)

        assert is_local is True
        assert fuente == FUENTE_ARTISTA_CURADO

    def test_cae_a_musicbrainz_cuando_no_esta_curado(self):
        def handler(request):
            return httpx.Response(
                200,
                json={"artists": [{"name": "Robbie Williams", "score": 100, "country": "GB"}]},
            )

        with _cliente_falso(handler) as cliente:
            is_local, fuente = resolver_origen("Robbie Williams", client=cliente)

        assert is_local is False
        assert fuente == FUENTE_MUSICBRAINZ

    def test_sin_match_confiable_queda_sin_resolver(self):
        def handler(request):
            return httpx.Response(200, json={"artists": []})

        with _cliente_falso(handler) as cliente:
            is_local, fuente = resolver_origen("Un Artista Cualquiera Sin Match", client=cliente)

        assert is_local is None
        assert fuente is None
