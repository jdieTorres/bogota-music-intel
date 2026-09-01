"""Regresión del afiche que rompía la tarjeta.

`next/image` no degrada ante un host que no está en `remotePatterns`: lanza.
El 2026-09-01 visitbogota estuvo un día guardando imágenes de un host sin
permitir y no se supo hasta que alguien abrió la cartelera.
"""
from typing import ClassVar

from bogota_music_intel.hosts_de_imagen import (
    CONFIG_DE_NEXT,
    hosts_permitidos,
    hosts_sin_permiso,
)


class TestLeerElConfig:
    def test_encuentra_el_config_real_del_frontend(self):
        # Si la ruta relativa se rompe al mover archivos, el chequeo se
        # apagaría en silencio y volveríamos al punto de partida.
        assert CONFIG_DE_NEXT.exists(), CONFIG_DE_NEXT

    def test_lee_los_hosts_que_usa_next(self):
        permitidos = hosts_permitidos()
        # Los de las fuentes que sirven afiches hoy.
        for host in ("movistararena.co", "visitbogota.co", "lourdesmusichall.com"):
            assert host in permitidos

    def test_sin_config_no_falla_sino_que_se_salta(self, tmp_path):
        # Correr la ingesta sin el frontend al lado es posible; esto es un
        # aviso, no una validación que deba tumbar nada.
        assert hosts_permitidos(tmp_path / "no-existe.ts") == set()


class TestDetectarHuecos:
    PERMITIDOS: ClassVar[set[str]] = {"movistararena.co", "visitbogota.co"}

    def test_delata_el_host_que_falta_y_cuenta_cuantas(self):
        urls = [
            "https://visitbogota.co/a.jpg",
            "https://nuevo-venue.com/b.jpg",
            "https://nuevo-venue.com/c.jpg",
        ]
        assert hosts_sin_permiso(urls, self.PERMITIDOS) == {"nuevo-venue.com": 2}

    def test_todo_permitido_no_avisa_nada(self):
        urls = ["https://visitbogota.co/a.jpg", "https://movistararena.co/b.jpg"]
        assert hosts_sin_permiso(urls, self.PERMITIDOS) == {}

    def test_los_eventos_sin_imagen_no_molestan(self):
        assert hosts_sin_permiso([None, "", "https://visitbogota.co/a.jpg"], self.PERMITIDOS) == {}

    def test_sin_lista_de_permitidos_no_inventa_avisos(self):
        # Mejor no avisar que avisar de todo cuando no se pudo leer el config.
        assert hosts_sin_permiso(["https://cualquiera.com/a.jpg"], set()) == {}


def test_todo_lo_que_publican_los_scrapers_hoy_esta_permitido():
    """Los hosts que las seis fuentes sirven de verdad, al 2026-09-01.

    Es la lista contra la que se descubrió el hueco: si un scraper nuevo
    empieza a servir de otro lado, el aviso de `moderacion_cli` lo dice en la
    corrida, y esta lista se actualiza junto con `next.config.ts`.
    """
    en_uso = {
        "movistararena.co",
        "lourdesmusichall.com",
        "tickets.latinopower.com.co",
        "www.idartes.gov.co",
        "static.wixstatic.com",
        "s3.eu-central-1.amazonaws.com",
        "visitbogota.co",
    }
    assert not en_uso - hosts_permitidos()
