from datetime import datetime
from zoneinfo import ZoneInfo

from bogota_music_intel.scrapers.dateparse import (
    parse_spanish_date,
    parse_spanish_date_infer_year,
)

TZ = ZoneInfo("America/Bogota")
HOY = datetime(2026, 8, 27, 10, 0, tzinfo=TZ)


class TestParseSpanishDate:
    def test_formato_movistar(self):
        assert parse_spanish_date("sábado, 05 septiembre - 2026") == datetime(
            2026, 9, 5, tzinfo=TZ
        )

    def test_formato_lourdes(self):
        assert parse_spanish_date("22 de Agosto 2026") == datetime(2026, 8, 22, tzinfo=TZ)

    def test_mes_con_mayuscula_y_acento(self):
        assert parse_spanish_date("6 de Septiembre 2026") == datetime(2026, 9, 6, tzinfo=TZ)

    def test_texto_sin_fecha(self):
        assert parse_spanish_date("Próximamente") is None

    def test_mes_invalido(self):
        assert parse_spanish_date("12 de Brumario 2026") is None

    def test_dia_inexistente(self):
        assert parse_spanish_date("31 de Febrero 2026") is None


class TestInferirAnio:
    """Royal Center publica la fecha sin año."""

    def test_fecha_futura_de_este_anio(self):
        assert parse_spanish_date_infer_year("29 DE AGOSTO", HOY) == datetime(
            2026, 8, 29, tzinfo=TZ
        )

    def test_cartelera_desactualizada_conserva_el_anio(self):
        # Pasó hace 6 días: es una cartelera sin limpiar, no el próximo agosto.
        assert parse_spanish_date_infer_year("21 DE AGOSTO", HOY) == datetime(
            2026, 8, 21, tzinfo=TZ
        )

    def test_fecha_lejana_en_el_pasado_es_del_proximo_anio(self):
        # Enero ya pasó hace 7 meses: se refiere al enero que viene.
        assert parse_spanish_date_infer_year("15 DE ENERO", HOY) == datetime(
            2027, 1, 15, tzinfo=TZ
        )

    def test_ayer(self):
        assert parse_spanish_date_infer_year("26 DE AGOSTO", HOY) == datetime(
            2026, 8, 26, tzinfo=TZ
        )

    def test_sin_fecha_reconocible(self):
        assert parse_spanish_date_infer_year("PRÓXIMAMENTE", HOY) is None
