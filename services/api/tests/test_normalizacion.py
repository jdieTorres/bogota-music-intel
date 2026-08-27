from datetime import datetime
from zoneinfo import ZoneInfo

from bogota_music_intel.scrapers.identity import build_event_id
from bogota_music_intel.scrapers.models import ScrapedEvent, dedupe_events
from bogota_music_intel.scrapers.text import normalize_city, normalize_venue_name

TZ = ZoneInfo("America/Bogota")


def _evento(**kwargs) -> ScrapedEvent:
    base = {
        "source": "test",
        "source_event_id": "1",
        "venue_name_raw": "Sala X",
        "title": "Show",
        "source_url": "https://ejemplo.co",
    }
    return ScrapedEvent(**{**base, **kwargs})


class TestNormalizarCiudad:
    def test_sin_acento_se_canoniza(self):
        assert normalize_city("Bogota") == "Bogotá"

    def test_mayusculas_y_espacios(self):
        assert normalize_city("  BOGOTÁ ") == "Bogotá"

    def test_otra_ciudad_conocida(self):
        assert normalize_city("medellin") == "Medellín"

    def test_vacio_cae_a_bogota(self):
        assert normalize_city("") == "Bogotá"

    def test_ciudad_desconocida_se_respeta(self):
        assert normalize_city("Zipaquirá") == "Zipaquirá"


class TestNormalizarVenue:
    def test_todo_mayusculas_se_recompone(self):
        assert normalize_venue_name("ROYAL CENTER") == "Royal Center"
        assert normalize_venue_name("CAPITAL LIVE CONCERTS") == "Capital Live Concerts"

    def test_conectores_en_minuscula(self):
        assert normalize_venue_name("TEATRO DE LA CIUDAD") == "Teatro de la Ciudad"

    def test_capitalizacion_mixta_se_respeta(self):
        assert normalize_venue_name("Teatro Libre de Bogotá") == "Teatro Libre de Bogotá"

    def test_espacios_colapsados(self):
        assert normalize_venue_name("Sala   Roja ") == "Sala Roja"


class TestScrapedEvent:
    def test_ciudad_se_normaliza_al_construir(self):
        assert _evento(city="Bogota").city == "Bogotá"

    def test_sin_fecha_la_precision_es_unknown(self):
        # Varios scrapers dejan el default "day" aunque no parseen fecha.
        evento = _evento(starts_at=None, date_precision="day")
        assert evento.date_precision == "unknown"

    def test_con_fecha_se_respeta_la_precision(self):
        evento = _evento(starts_at=datetime(2026, 9, 5, tzinfo=TZ), date_precision="day")
        assert evento.date_precision == "day"


class TestDedupe:
    def test_quita_repetidos_conservando_orden(self):
        eventos = [
            _evento(source_event_id="a", title="Primero"),
            _evento(source_event_id="b"),
            _evento(source_event_id="a", title="Repetido"),
        ]
        resultado = dedupe_events(eventos)
        assert [e.source_event_id for e in resultado] == ["a", "b"]
        assert resultado[0].title == "Primero"

    def test_lista_vacia(self):
        assert dedupe_events([]) == []


class TestIdentidadDelEvento:
    def test_titulo_y_fecha(self):
        assert build_event_id("Blonde Redhead", datetime(2026, 10, 2, tzinfo=TZ)) == (
            "blonde-redhead-2026-10-02"
        )

    def test_sin_fecha_usa_solo_el_titulo(self):
        assert build_event_id("The Jazz Room", None) == "the-jazz-room"

    def test_es_estable_si_cambia_la_url_de_boleteria(self):
        # El punto del cambio: la identidad ya no depende del link de venta.
        fecha = datetime(2026, 9, 6, tzinfo=TZ)
        assert build_event_id("Bloodbath", fecha) == build_event_id("Bloodbath", fecha)

    def test_funciones_distintas_de_un_evento_recurrente_no_colisionan(self):
        uno = build_event_id("The Jazz Room", datetime(2026, 9, 4, tzinfo=TZ))
        dos = build_event_id("The Jazz Room", datetime(2026, 9, 11, tzinfo=TZ))
        assert uno != dos
