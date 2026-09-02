"""Regresión del precio en las tres fuentes que lo publican.

El bug que originó estos tests: Latino Power expone `cost` y `cost_details`, y
el scraper venía leyendo `cost`, que es un texto ya redondeado a miles. Un show
de $33.900 se publicaba como "$34" — el precio dividido por mil, durante los
días que estuvo así. Ninguna prueba lo habría notado porque el campo se leía
tal cual y "34" es un string perfectamente válido.
"""
from bogota_music_intel.precios import desde_piso
from bogota_music_intel.scrapers.idartes_teatro_jeg import _precio as precio_idartes
from bogota_music_intel.scrapers.latino_power import _precio as precio_latino


class TestLatinoPower:
    def test_no_lee_cost_que_viene_redondeado_a_miles(self):
        """La ficha real de "Poder Femenino En Latino power Noches Bomm"."""
        item = {
            "cost": "&#036;34",
            "cost_details": {"values": ["33900"]},
        }
        assert precio_latino(item) == {
            "price_kind": "unico",
            "price_min": 33900,
            "price_max": 33900,
        }

    def test_varias_boletas_dan_un_rango(self):
        """`values` es un arreglo porque un evento vende varias boletas."""
        item = {"cost": "&#036;34", "cost_details": {"values": ["33900", "120000"]}}
        assert precio_latino(item) == {
            "price_kind": "rango",
            "price_min": 33900,
            "price_max": 120000,
        }

    def test_sin_precio_publicado_limpia_las_tres_columnas(self):
        """"El plan de la mariposa" llega con `values: []` y `cost: ""`."""
        item = {"cost": "", "cost_details": {"values": []}}
        assert precio_latino(item) == {
            "price_kind": None,
            "price_min": None,
            "price_max": None,
        }

    def test_una_ficha_sin_cost_details_no_revienta(self):
        assert precio_latino({"cost": "$34"})["price_kind"] is None


class TestRockalLive:
    def test_startingprice_no_se_publica_como_si_fuera_el_precio(self):
        precio = desde_piso(107000)
        assert precio.kind == "desde"
        assert precio.max is None, "un 'desde' no tiene techo conocido"


class TestIdartes:
    def test_entrada_libre(self):
        assert precio_idartes("Entrada libre")["price_kind"] == "gratis"

    def test_entrada_con_costo_se_distingue_de_no_saber(self):
        assert precio_idartes("Entrada con costo")["price_kind"] == "con_costo"
        assert precio_idartes(None)["price_kind"] is None
