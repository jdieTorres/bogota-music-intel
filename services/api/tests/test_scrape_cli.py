"""Lo que el cron le dice a quien lo mira desde afuera.

El código de salida y las anotaciones son la única señal que llega sin abrir
el log, así que son parte del contrato del CLI y no un detalle de consola.
"""
import sys

import pytest

from bogota_music_intel import scrape_cli
from bogota_music_intel.scrapers.models import ScrapedEvent


def _evento(source: str) -> ScrapedEvent:
    return ScrapedEvent(
        source=source,
        source_event_id="1",
        venue_name_raw="Una sala",
        title="Un toque",
        source_url="https://ejemplo.co/toque",
    )


@pytest.fixture(autouse=True)
def _sin_credenciales(monkeypatch):
    # El dry-run intenta descontar los bloqueados y sigue sin ellos. Acá se
    # corta de entrada para que el test no salga a la red.
    monkeypatch.setattr(scrape_cli, "cargar_bloqueados", lambda _cliente=None: set())
    monkeypatch.setattr(scrape_cli, "get_client", lambda: None)


def _correr(monkeypatch, scrapers: dict) -> int:
    monkeypatch.setattr(scrape_cli, "SCRAPERS", scrapers)
    monkeypatch.setattr(sys, "argv", ["scrape_cli", "--dry-run"])
    return scrape_cli.main()


def test_todo_bien_sale_en_verde(monkeypatch):
    assert _correr(monkeypatch, {"una": lambda: [_evento("una")]}) == 0


def test_una_fuente_que_no_trae_nada_sale_en_rojo(monkeypatch, capsys):
    # El fallo que hasta el 2026-09-13 salía verde: sin excepción de por
    # medio, una fuente rota se veía igual que una corrida buena.
    codigo = _correr(monkeypatch, {"vacia": list})

    assert codigo == 1
    assert "no trajo ni un evento" in capsys.readouterr().err


def test_una_fuente_rota_no_se_lleva_a_las_demas(monkeypatch, capsys):
    def revienta():
        raise RuntimeError("la API respondió 200 con content-type «text/html»")

    codigo = _correr(
        monkeypatch, {"rota": revienta, "sana": lambda: [_evento("sana")]}
    )

    salida = capsys.readouterr()
    assert codigo == 1
    # La que anda tiene que haber corrido igual, que es lo que mantuvo viva
    # la ingesta durante las cuatro corridas rojas de septiembre.
    assert "[sana] 1 eventos" in salida.out
    assert "content-type" in salida.err


def test_en_actions_el_motivo_queda_en_el_resumen(monkeypatch, capsys):
    monkeypatch.setenv("GITHUB_ACTIONS", "true")

    _correr(monkeypatch, {"vacia": list})

    # Sin esta línea el resumen de la corrida dice "Process completed with
    # exit code 1" y hay que abrir el log para saber qué fuente cayó.
    assert "::error::[vacia] no trajo ni un evento" in capsys.readouterr().out


def test_fuera_de_actions_no_se_imprime_la_anotacion(monkeypatch, capsys):
    monkeypatch.delenv("GITHUB_ACTIONS", raising=False)

    _correr(monkeypatch, {"vacia": list})

    assert "::error::" not in capsys.readouterr().out
