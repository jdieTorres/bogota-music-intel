"""El geocodificador solo debe aceptar coordenadas dentro de Bogotá.

Un pin en el lugar equivocado es peor que un pin ausente: el mapa puede
mostrar "sin ubicación", pero no puede desmentir una coordenada plausible
que está mal.
"""
import httpx
import pytest

from bogota_music_intel.coordenadas_curadas import COORDENADAS_CURADAS
from bogota_music_intel.geocode import (
    en_bogota,
    es_suficientemente_preciso,
    geocodificar,
)


class TestLimitesDeBogota:
    def test_acepta_una_coordenada_real_de_bogota(self):
        # Movistar Arena, según OpenStreetMap.
        assert en_bogota(4.6492621, -74.0773213)

    def test_rechaza_otra_ciudad(self):
        assert not en_bogota(6.2442, -75.5812)  # Medellín
        assert not en_bogota(40.4168, -3.7038)  # Madrid

    def test_rechaza_latitud_y_longitud_invertidas(self):
        # El error clásico: mandar (lon, lat) en vez de (lat, lon).
        assert not en_bogota(-74.0773213, 4.6492621)

    def test_rechaza_el_origen(self):
        assert not en_bogota(0.0, 0.0)


class TestPrecisionDelResultado:
    """El chequeo de límites no alcanza: un match de calle cae dentro de
    Bogotá igual, pero a kilómetros del lugar real."""

    def test_rechaza_un_match_de_calle(self):
        # Caso real: "Carrera 13 #66-80" resolvía a un punto cualquiera de
        # la Carrera 13 en Usaquén, a más de 7 km del Royal Center.
        assert not es_suficientemente_preciso(
            {"addresstype": "road", "category": "highway", "type": "residential"}
        )

    def test_rechaza_barrios_y_ciudades(self):
        for tipo in ("suburb", "neighbourhood", "city", "state", "postcode"):
            assert not es_suficientemente_preciso({"addresstype": tipo, "category": "place"})

    def test_acepta_un_lugar_concreto(self):
        assert es_suficientemente_preciso(
            {"addresstype": "amenity", "category": "amenity", "type": "theatre"}
        )
        assert es_suficientemente_preciso(
            {"addresstype": "building", "category": "building", "type": "yes"}
        )
        assert es_suficientemente_preciso(
            {"addresstype": "leisure", "category": "leisure", "type": "stadium"}
        )


class TestCoordenadasCuradas:
    def test_todas_caen_dentro_de_bogota(self):
        for slug, coordenada in COORDENADAS_CURADAS.items():
            assert en_bogota(coordenada.latitude, coordenada.longitude), slug

    def test_todas_documentan_su_evidencia(self):
        # Sin evidencia no hay forma de auditar de dónde salió el pin.
        for slug, coordenada in COORDENADAS_CURADAS.items():
            assert len(coordenada.evidencia) > 40, slug


def _cliente_falso(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


class TestGeocodificar:
    def test_descarta_resultados_fuera_de_bogota(self):
        # Nominatim puede devolver una sala homónima de otra ciudad.
        def handler(request):
            return httpx.Response(
                200,
                json=[
                    {
                        "lat": "6.2442",
                        "lon": "-75.5812",
                        "display_name": "Medellín",
                        "addresstype": "amenity",
                    }
                ],
            )

        with _cliente_falso(handler) as cliente:
            assert geocodificar("Sala X", None, client=cliente) is None

    def test_toma_el_primer_resultado_dentro_de_bogota(self):
        def handler(request):
            return httpx.Response(
                200,
                json=[
                    {"lat": "6.2442", "lon": "-75.5812", "display_name": "Medellín"},
                    {"lat": "4.6492", "lon": "-74.0773", "display_name": "Bogotá, sala"},
                ],
            )

        with _cliente_falso(handler) as cliente:
            ubicacion = geocodificar("Sala X", None, client=cliente)

        assert ubicacion is not None
        assert ubicacion.latitude == pytest.approx(4.6492)
        assert ubicacion.display_name == "Bogotá, sala"

    def test_sin_resultados_devuelve_none(self):
        with _cliente_falso(lambda request: httpx.Response(200, json=[])) as cliente:
            assert geocodificar("Sala inexistente", None, client=cliente) is None

    def test_prueba_primero_la_direccion_y_despues_el_nombre(self):
        consultas: list[str] = []

        def handler(request):
            consultas.append(request.url.params["q"])
            # La dirección no resuelve; el nombre sí.
            if "Calle falsa" in request.url.params["q"]:
                return httpx.Response(200, json=[])
            return httpx.Response(
                200, json=[{"lat": "4.65", "lon": "-74.07", "display_name": "ok"}]
            )

        with _cliente_falso(handler) as cliente:
            ubicacion = geocodificar("Sala X", "Calle falsa 123", client=cliente)

        assert ubicacion is not None
        assert len(consultas) == 2
        assert consultas[0].startswith("Calle falsa 123")
        assert consultas[1].startswith("Sala X")

    def test_guarda_la_consulta_usada_para_poder_auditarla(self):
        def handler(request):
            return httpx.Response(
                200, json=[{"lat": "4.65", "lon": "-74.07", "display_name": "OSM dice"}]
            )

        with _cliente_falso(handler) as cliente:
            ubicacion = geocodificar("Sala X", None, ciudad="Bogotá", client=cliente)

        assert ubicacion.query == "Sala X, Bogotá, Colombia"
        assert ubicacion.display_name == "OSM dice"
