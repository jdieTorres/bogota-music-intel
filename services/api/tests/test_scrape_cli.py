"""Lo que el cron le dice a quien lo mira desde afuera.

El código de salida y las anotaciones son la única señal que llega sin abrir
el log, así que son parte del contrato del CLI y no un detalle de consola.
"""
import sys

import pytest

from bogota_music_intel import scrape_cli
from bogota_music_intel.scrapers.http import BloqueadoPorPortero
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


def _portero():
    raise BloqueadoPorPortero(
        "la frenó el anti-bots de SiteGround. La fuente no está rota y esto "
        "NO se evade: se pide acceso o se deja de pedir desde CI."
    )


def test_el_bloqueo_conocido_no_pinta_la_corrida_de_rojo(monkeypatch, capsys):
    """Decidido el 2026-09-15, con seis días de evidencia.

    El cron salía en rojo 5 de cada 6 días por Ticketlive mientras las otras
    seis fuentes guardaban sin problema, así que el rojo había dejado de
    significar "hay que mirar esto".
    """
    codigo = _correr(
        monkeypatch,
        {"ticketlive": _portero, "sana": lambda: [_evento("sana")]},
    )

    salida = capsys.readouterr()
    assert codigo == 0
    # Que no pinte de rojo no es que se calle: el motivo sigue entero.
    assert "[ticketlive] bloqueada" in salida.err
    assert "anti-bots de SiteGround" in salida.err
    assert "[sana] 1 eventos" in salida.out


def test_el_bloqueo_conocido_se_anota_como_aviso_y_no_como_error(monkeypatch, capsys):
    """⚠️ El nivel de la anotación tiene que decir cuál de los dos casos fue.

    `::error::` pinta la anotación de rojo en la UI **aunque el check salga en
    verde**, así que anotar el bloqueo conocido como error deja una corrida
    verde con una anotación roja: las dos señales dicen cosas distintas sobre
    lo mismo, y quien la mire tiene que leer el texto para saber a cuál
    creerle. Es la misma regla que hizo falta para el `exit code 1` — una
    señal que sirve para todo no señala nada.
    """
    monkeypatch.setenv("GITHUB_ACTIONS", "true")

    codigo = _correr(monkeypatch, {"ticketlive": _portero})

    salida = capsys.readouterr()
    assert codigo == 0
    assert "::warning::[ticketlive] bloqueada" in salida.out
    # Y no de error, que es lo que contradecía al verde.
    assert "::error::" not in salida.out


def test_un_fallo_de_verdad_se_sigue_anotando_como_error(monkeypatch, capsys):
    """Lo que hace segura la distinción de arriba: solo el bloqueo conocido
    baja de nivel. Cualquier otro fallo sigue siendo un error, y el rojo de la
    anotación acompaña al rojo del check."""
    monkeypatch.setenv("GITHUB_ACTIONS", "true")

    def revienta():
        raise RuntimeError("la API respondió 500")

    codigo = _correr(monkeypatch, {"ticketlive": revienta})

    salida = capsys.readouterr()
    assert codigo == 1
    assert "::error::[ticketlive] FALLÓ" in salida.out
    assert "::warning::" not in salida.out


def test_la_misma_fuente_rota_por_otra_cosa_sí_sale_en_rojo(monkeypatch, capsys):
    """⚠️ Lo que hace segura la excepción anterior.

    Solo calla el bloqueo del portero, no a la fuente: si su parser se rompe o
    su sitio devuelve un 500, la corrida vuelve a salir en rojo.
    """
    def revienta():
        raise RuntimeError("la API respondió 500")

    codigo = _correr(monkeypatch, {"ticketlive": revienta})

    assert codigo == 1
    assert "[ticketlive] FALLÓ" in capsys.readouterr().err


def test_un_portero_en_una_fuente_nueva_sí_sale_en_rojo(monkeypatch, capsys):
    """La lista de bloqueos conocidos no se puede quedar corta en silencio: una
    fuente que empieza a chocar contra un portero no está en ella, así que sale
    en rojo — y un bloqueo nuevo sí es noticia."""
    codigo = _correr(monkeypatch, {"otra": _portero})

    assert codigo == 1
    assert "[otra] FALLÓ" in capsys.readouterr().err
