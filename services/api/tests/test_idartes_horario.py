"""Regresión del bug de zona horaria de Idartes.

La agenda publica el atributo como UTC ("2026-08-27T20:00:00Z") pero el valor
es hora local de Bogotá — la misma tarjeta muestra "8:00 pm". Interpretarlo
como UTC de verdad guardaba cada evento 5 horas antes de lo real.
"""
from zoneinfo import ZoneInfo

import pytest

from bogota_music_intel.scrapers.idartes_teatro_jeg import _parse_agenda_datetime

TZ = ZoneInfo("America/Bogota")


@pytest.mark.parametrize(
    ("atributo", "hora_visible_en_la_pagina"),
    [
        ("2026-08-27T20:00:00Z", 20),  # "8:00 pm"
        ("2026-09-09T18:00:00Z", 18),  # "6:00 pm"
        ("2026-09-11T19:00:00Z", 19),  # "7:00 pm"
        ("2026-10-02T20:00:00Z", 20),  # "8:00 pm"
    ],
)
def test_la_hora_guardada_coincide_con_la_que_muestra_la_pagina(
    atributo, hora_visible_en_la_pagina
):
    resultado = _parse_agenda_datetime(atributo)
    assert resultado is not None
    assert resultado.astimezone(TZ).hour == hora_visible_en_la_pagina


def test_valor_vacio():
    assert _parse_agenda_datetime(None) is None
    assert _parse_agenda_datetime("") is None


def test_valor_no_parseable():
    assert _parse_agenda_datetime("próximamente") is None


def test_offset_explicito_distinto_de_z_si_se_respeta():
    # Si algún día publican un offset real, se le cree en vez de forzar Bogotá.
    resultado = _parse_agenda_datetime("2026-08-27T20:00:00+02:00")
    assert resultado.astimezone(TZ).hour == 13
