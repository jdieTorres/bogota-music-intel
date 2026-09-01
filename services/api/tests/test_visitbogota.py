"""Lo que hay que no romper del scraper de la agenda del distrito.

Las tres cosas que se probaron contra el sitio real el 2026-08-31 y que un
cambio descuidado desharía sin que nada falle: la zona horaria, el precio
que no es un precio, y el rango de varios días.
"""
import json
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

from bogota_music_intel.scrapers.visitbogota import (
    _fecha,
    _json_ld_del_evento,
    _slug,
    _ultima_pagina,
)

TZ = ZoneInfo("America/Bogota")


class TestFecha:
    def test_la_fecha_se_ancla_a_bogota_y_no_a_utc(self):
        # `startDate` viene sin hora ("2026-09-06"). Anclarla a UTC la
        # correría cinco horas y el evento saldría el día anterior en la
        # cartelera — el error que este proyecto ya cometió dos veces.
        resultado = _fecha("2026-09-06")
        assert resultado is not None
        assert resultado.astimezone(TZ).date().isoformat() == "2026-09-06"
        assert resultado.astimezone(TZ).hour == 0

    def test_sin_fecha_no_se_inventa_una(self):
        assert _fecha(None) is None
        assert _fecha("") is None
        assert _fecha("próximamente") is None


class TestJsonLd:
    """La ficha trae dos bloques JSON-LD y solo uno es el evento."""

    def test_ignora_el_breadcrumb_y_toma_el_evento(self):
        html = """
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}
        </script>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Event","name":"Jorge Drexler",
         "startDate":"2026-09-06"}
        </script>
        """
        datos = _json_ld_del_evento(BeautifulSoup(html, "lxml"))
        assert datos is not None
        assert datos["name"] == "Jorge Drexler"

    def test_un_json_roto_no_tumba_la_corrida(self):
        # Una fuente puede publicar un bloque mal formado; el scraper tiene
        # que seguir con el siguiente en vez de reventar la fuente entera.
        html = """
        <script type="application/ld+json">{ esto no es json </script>
        <script type="application/ld+json">
        {"@type":"Event","name":"Gorillaz en Bogotá"}
        </script>
        """
        datos = _json_ld_del_evento(BeautifulSoup(html, "lxml"))
        assert datos is not None
        assert datos["name"] == "Gorillaz en Bogotá"

    def test_sin_evento_devuelve_none(self):
        html = '<script type="application/ld+json">{"@type":"WebPage"}</script>'
        assert _json_ld_del_evento(BeautifulSoup(html, "lxml")) is None


class TestPrecioQueNoEsPrecio:
    """`offers.price` viene "0" en TODAS las fichas, con `url: {}`.

    No es que los eventos sean gratis: es relleno del gestor de contenidos.
    Verificado el 2026-08-31 en Jorge Drexler, Álvaro Díaz, Festival
    Cordillera, Sara Landry, Jazz al Parque y Wedding Open House — las seis
    con el mismo valor. Importarlo anunciaría como gratis un show de
    $200.000, que es exactamente el tipo de dato inventado que el proyecto
    prohíbe.
    """

    def test_el_scraper_no_lee_offers(self):
        import inspect

        from bogota_music_intel.scrapers import visitbogota

        codigo = inspect.getsource(visitbogota._evento_desde_ficha)
        assert "price_text=None" in codigo
        # Si alguien alguna vez lee el precio del JSON-LD, este test cae y
        # el comentario de arriba explica por qué no debe hacerlo.
        assert '["offers"]' not in codigo
        assert 'get("offers")' not in codigo


class TestPaginador:
    def test_lee_la_ultima_pagina_del_paginador(self):
        # Drupal urlencodea la coma: `?page=0%2C%2C4` es la página 5.
        html = """
        <nav class="pager">
          <a href="?page=0%2C%2C1">Página 2</a>
          <a href="?page=0%2C%2C4">Última página</a>
        </nav>
        """
        assert _ultima_pagina(BeautifulSoup(html, "lxml")) == 4

    def test_sin_paginador_hay_una_sola_pagina(self):
        assert _ultima_pagina(BeautifulSoup("<div></div>", "lxml")) == 0

    def test_un_paginador_absurdo_no_dispara_peticiones_infinitas(self):
        html = '<nav class="pager"><a href="?page=0%2C%2C9999">x</a></nav>'
        assert _ultima_pagina(BeautifulSoup(html, "lxml")) == 14


class TestIdentidad:
    def test_el_id_es_el_slug_del_sitio(self):
        # El slug es la identidad que usa el propio sitio y sobrevive a que
        # corrijan el título o la fecha.
        assert _slug("/es/agenda-de-eventos/jorge-drexler") == "jorge-drexler"
        assert _slug("/es/agenda-de-eventos/jazz-al-parque-2026/") == "jazz-al-parque-2026"


class TestRitmo:
    def test_la_pausa_vive_dentro_del_modulo(self):
        # Regla dura del proyecto: el límite de peticiones se respeta dentro
        # del módulo que consulta, nunca en el llamador. Dejarlo del lado del
        # CLI ya falló una vez con MusicBrainz.
        from bogota_music_intel.scrapers import visitbogota

        assert visitbogota.PAUSA_ENTRE_PETICIONES > 0
        import inspect

        assert "time.sleep" in inspect.getsource(visitbogota._sopa)


def test_el_json_ld_real_tiene_los_campos_que_usamos():
    """Foto del JSON-LD real de Jorge Drexler (2026-08-31), recortada.

    Si el sitio deja de publicar `location.name` o `startDate`, el scraper
    empieza a guardar eventos sin sala o sin fecha en silencio. Esto fija el
    contrato.
    """
    real = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "Jorge Drexler",
        "startDate": "2026-09-06",
        "endDate": "2026-09-06",
        "description": "Jorge Drexler llegará a Bogotá…",
        "image": ["https://visitbogota.co/sites/default/files/…jorge-drexler.jpg.webp"],
        "location": {"@type": "Place", "name": "Movistar Arena"},
        "offers": {"@type": "Offer", "url": {}, "price": "0", "priceCurrency": "COP"},
    }
    html = f'<script type="application/ld+json">{json.dumps(real)}</script>'
    datos = _json_ld_del_evento(BeautifulSoup(html, "lxml"))
    assert datos is not None
    assert (datos["location"] or {}).get("name") == "Movistar Arena"
    assert _fecha(datos["startDate"]) is not None
    assert datos["image"][0].startswith("https://")
