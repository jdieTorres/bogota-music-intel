"""Las trampas de ticketlive, que son varias y ninguna se ve venir.

Los tests son de las trampas y no del camino feliz: lo que esta fuente hace
bien —schema.org, ciudad estructurada— no necesita defensa. Lo que publica
mal, sí.
"""
from datetime import datetime
from zoneinfo import ZoneInfo

from bogota_music_intel.scrapers.ticketlive import (
    SALAS_MASIVAS,
    TIPOS,
    _clave_de_sala,
    _del_titulo,
    _precio,
    _tipo_de_url,
)
from bogota_music_intel.tipos_evento import FIESTA

BOGOTA = ZoneInfo("America/Bogota")


class TestElTituloLlevaLaFechaYLaCiudad:
    """Sin esto habría que pedir 600 fichas para saber cuáles son de Bogotá."""

    def test_saca_titulo_fecha_y_ciudad(self):
        titulo, fecha, ciudad = _del_titulo(
            "Boletas Militarie Gun en concierto, 24 noviembre 2026, Bogotá"
        )
        assert titulo == "Militarie Gun en concierto"
        assert fecha == datetime(2026, 11, 24, tzinfo=BOGOTA)
        assert ciudad == "Bogotá"

    def test_la_fecha_queda_en_hora_de_bogota_y_no_en_utc(self):
        # Anclarla a UTC la correría cinco horas y el evento aparecería el día
        # anterior. Este proyecto ya cometió ese error dos veces.
        _, fecha, _ = _del_titulo("Boletas X, 24 noviembre 2026, Bogotá")
        assert fecha.tzinfo == BOGOTA
        assert fecha.hour == 0

    def test_decodifica_las_entidades_html(self):
        # WooCommerce devuelve "&#038;" por el ampersand, y sin decodificar
        # llega así hasta la cartelera.
        titulo, _, _ = _del_titulo(
            "Boletas Yeison Jiménez &#038; Noche de Cantina, 12 septiembre 2026, Bogotá"
        )
        assert titulo == "Yeison Jiménez & Noche de Cantina"

    def test_un_titulo_con_otro_formato_se_salta(self):
        # Preferible a inventarle una fecha: si la ticketera cambia el formato,
        # el evento no entra en vez de entrar mal.
        assert _del_titulo("Algo sin fecha ni ciudad") is None

    def test_reconoce_medellin_para_poder_descartarla(self):
        _, _, ciudad = _del_titulo("Boletas Ozuna, 3 octubre 2026, Medellín")
        assert _clave_de_sala(ciudad) != "bogota"


class TestElPrecioCeroNoEsGratis:
    def test_el_cero_no_entra_como_gratis(self):
        # Sale 0 en todo lo que la ticketera lista pero no vende: los
        # estadios y las arenas. Guardarlo como gratis diría que la entrada
        # al Gorillaz es libre.
        assert _precio("0") is None
        assert _precio(0) is None

    def test_un_monto_real_entra_como_piso_y_no_como_precio(self):
        # La oferta trae un solo número y casi ningún show tiene precio único:
        # afirmarlo sería decir que la boleta cuesta eso.
        precio = _precio("139900")
        assert precio.kind == "desde"
        assert precio.min == 139900

    def test_sin_precio_no_se_inventa(self):
        assert _precio(None) is None
        assert _precio("") is None


class TestElTipoVaEnLaUrl:
    def test_rave_y_fiesta_son_lo_mismo(self):
        # Decisión de Juan el 2026-09-08: una noche sin artista de cartel, en
        # los dos casos. No merece pestaña propia.
        assert TIPOS["rave"] == FIESTA
        assert TIPOS["fiesta"] == FIESTA

    def test_un_tipo_que_no_conocemos_no_se_descarta(self):
        # La taxonomía de esta fuente no está cerrada: aparecieron `dix-fm`,
        # `externos` y `destacado`, ninguno en su propio sitemap. Ante la duda
        # el evento entra y el scraper avisa, porque excluir es caro y
        # silencioso.
        crudo, tipo = _tipo_de_url("https://ticketlive.com.co/co/externos/algo/")
        assert crudo == "externos"
        assert tipo is None


class TestLasSalasQueNoEntran:
    def test_las_masivas_se_comparan_por_prefijo(self):
        # La fuente escribe la misma sala de dos maneras. Una lista de grafías
        # exactas se le escapa a la tercera.
        assert _clave_de_sala("Vive Claro").startswith(SALAS_MASIVAS)
        assert _clave_de_sala("Vive Claro Music Hall").startswith(SALAS_MASIVAS)

    def test_medplus_no_esta_vetado(self):
        # Juan decidió dejarlo entrar y descartar sus eventos a mano, para
        # medir en la práctica si conviene vetarlo.
        assert not _clave_de_sala("Coliseo Medplus").startswith(SALAS_MASIVAS)

    def test_los_clubes_pasan(self):
        for sala in ("La Sucursal", "Ace Of Spades", "Teatro Republik"):
            assert not _clave_de_sala(sala).startswith(SALAS_MASIVAS)


class TestElTipoQueDeclaraLaFuenteClasifica:
    """El scraper no clasifica: guarda el tipo crudo en `category` y el
    clasificador lo traduce. Sin este puente, el `rave -> fiesta` que pidió
    Juan no ocurría — `ScrapedEvent` no tiene campo `event_type`."""

    def test_rave_y_fiesta_terminan_en_fiesta(self):
        from bogota_music_intel.classify import clasificar

        for cruda in ("rave", "fiesta"):
            r = clasificar(
                {"source": "ticketlive", "source_event_id": "x", "title": "N", "category": cruda}
            )
            assert r.event_type == FIESTA, cruda

    def test_no_se_hereda_a_otras_fuentes(self):
        # La palabra "fiesta" en otra cartelera puede significar otra cosa.
        # La clave del mapa es (source, category) justamente por esto.
        from bogota_music_intel.classify import clasificar

        r = clasificar(
            {"source": "latino_power", "source_event_id": "x", "title": "N", "category": "fiesta"}
        )
        assert r.event_type != FIESTA

    def test_un_tipo_desconocido_queda_como_musica_asumida(self):
        # `externos` y `destacado` describen cómo se vende el evento, no qué
        # es, así que no están en el mapa: el evento entra y lo mira una
        # persona, en vez de desaparecer.
        from bogota_music_intel.classify import clasificar

        for cruda in ("externos", "destacado"):
            r = clasificar(
                {"source": "ticketlive", "source_event_id": "x", "title": "N", "category": cruda}
            )
            assert r.event_type == "music", cruda

    def test_dix_fm_es_una_marca_de_noches_tematicas(self):
        # "Karol G Night" y "Shakira Night" en el Teatro Republik no son
        # conciertos de esas artistas: son fiestas con un repertorio.
        # Confirmado por Juan, que conoce la sala.
        from bogota_music_intel.classify import clasificar

        r = clasificar(
            {"source": "ticketlive", "source_event_id": "x", "title": "Karol G Night",
             "category": "dix-fm"}
        )
        assert r.event_type == FIESTA


class TestLaSucursalEsUnaSolaSala:
    def test_la_grafia_larga_se_unifica(self):
        # El slug sale del nombre, así que dos grafías son dos salas y sus
        # eventos quedarían repartidos. Lo pidió Juan, que conoce la sala.
        from bogota_music_intel.scrapers.ticketlive import SALAS_UNIFICADAS

        assert SALAS_UNIFICADAS[_clave_de_sala("La Sucursal Venue")] == "La Sucursal"
