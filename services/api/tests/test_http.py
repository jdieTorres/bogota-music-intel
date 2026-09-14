"""El cuerpo de una respuesta que dice ser JSON y no lo es.

Es el fallo que tuvo el cron cuatro corridas seguidas entre el 2026-09-09 y el
2026-09-12 sin poder diagnosticarse: `.json()` muere con `Expecting value:
line 1 column 1 (char 0)`, que no nombra ni la fuente ni lo que llegó.
"""
import httpx
import pytest

from bogota_music_intel.scrapers.http import json_de

# Lo que devolvió de verdad la API de Latino Power desde GitHub Actions el
# 2026-09-11, recortado. Un 200, con un desafío de Cloudflare adentro.
DESAFIO_DE_WAF = (
    '<!DOCTYPE html> <html lang="en"> <head> <meta charset="utf8"> '
    "<script> (function(){ setTimeout(function(){"
)


def _respuesta(cuerpo: str, tipo: str, **cabeceras: str) -> httpx.Response:
    return httpx.Response(200, content=cuerpo, headers={"content-type": tipo, **cabeceras})


def test_el_json_de_verdad_pasa_derecho():
    assert json_de(_respuesta('{"events": []}', "application/json")) == {"events": []}


def test_una_lista_tambien():
    # El catálogo de Ticketlive llega como lista, no como objeto.
    assert json_de(_respuesta("[1, 2]", "application/json")) == [1, 2]


def test_un_200_que_no_es_json_dice_qué_llegó():
    with pytest.raises(RuntimeError) as fallo:
        json_de(_respuesta(DESAFIO_DE_WAF, "text/html", server="cloudflare", cf_ray="a3986"))

    mensaje = str(fallo.value)
    # Las tres preguntas que había que contestar abriendo el log a mano:
    # qué respondió, quién contestó, y qué había en el cuerpo.
    assert "text/html" in mensaje
    assert "cloudflare" in mensaje
    assert "DOCTYPE" in mensaje


def test_no_se_lleva_el_cuerpo_entero_al_log():
    # Un HTML de 400 KB en stderr no es un diagnóstico, es un volcado.
    with pytest.raises(RuntimeError) as fallo:
        json_de(_respuesta("x" * 5000, "text/html"))

    assert len(str(fallo.value)) < 500
