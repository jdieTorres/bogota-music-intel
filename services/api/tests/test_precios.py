from bogota_music_intel.precios import (
    SIN_DATO,
    desde_etiqueta,
    desde_montos,
    desde_piso,
)


class TestDesdeMontos:
    def test_un_solo_monto_es_precio_unico(self):
        precio = desde_montos([33900])
        assert precio.kind == "unico"
        assert (precio.min, precio.max) == (33900, 33900)

    def test_varios_montos_dan_el_rango_ordenado(self):
        """El orden en que los manda la fuente no es el orden del rango."""
        precio = desde_montos([120000, 33900, 80000])
        assert precio.kind == "rango"
        assert (precio.min, precio.max) == (33900, 120000)

    def test_montos_repetidos_no_hacen_un_rango_falso(self):
        precio = desde_montos([50000, 50000])
        assert precio.kind == "unico"

    def test_lista_vacia_no_inventa_precio(self):
        """Latino Power manda `values: []` cuando no publicó precio."""
        assert desde_montos([]) is None

    def test_solo_ceros_es_gratis(self):
        precio = desde_montos([0])
        assert precio.kind == "gratis"
        assert (precio.min, precio.max) == (0, 0)

    def test_un_cero_junto_a_montos_reales_no_baja_el_piso(self):
        """Un 0 conviviendo con precios reales es cortesía o relleno.

        Tomarlo como piso publicaría "$0 – 120 lks" y anunciaría como gratis un
        show que cuesta — el mismo error que ya se evitó con `offers.price` de
        visitbogota.
        """
        precio = desde_montos([0, 80000, 120000])
        assert precio.kind == "rango"
        assert (precio.min, precio.max) == (80000, 120000)

    def test_un_cero_junto_a_un_solo_monto_real_es_precio_unico(self):
        precio = desde_montos([0, 80000])
        assert precio.kind == "unico"
        assert (precio.min, precio.max) == (80000, 80000)

    def test_los_montos_llegan_como_cadena(self):
        """`cost_details.values` de Latino Power son strings, no números."""
        precio = desde_montos(["33900", "120000"])
        assert (precio.min, precio.max) == (33900, 120000)

    def test_lo_que_no_es_un_monto_se_descarta_en_vez_de_valer_cero(self):
        assert desde_montos(["gratis", None, ""]) is None


class TestDesdePiso:
    def test_startingprice_entra_como_desde_y_no_como_unico(self):
        """El campo se llama `startingPrice`: es el piso, no el precio.

        Guardarlo como 'unico' afirmaría que el show cuesta eso, que es más de
        lo que la fuente dice.
        """
        precio = desde_piso(77000)
        assert precio.kind == "desde"
        assert precio.min == 77000
        assert precio.max is None

    def test_un_piso_en_cero_es_gratis_y_no_un_desde(self):
        assert desde_piso(0).kind == "gratis"

    def test_sin_precio_no_hay_fila(self):
        assert desde_piso(None) is None


class TestDesdeEtiqueta:
    def test_entrada_libre_es_gratis(self):
        precio = desde_etiqueta("Entrada libre")
        assert precio.kind == "gratis"
        assert (precio.min, precio.max) == (0, 0)

    def test_entrada_con_costo_no_es_lo_mismo_que_sin_dato(self):
        """Dice que cuesta aunque no cuánto, y eso es más que un campo vacío."""
        precio = desde_etiqueta("Entrada con costo")
        assert precio.kind == "con_costo"
        assert precio.min is None

    def test_ignora_mayusculas_y_espacios_de_mas(self):
        assert desde_etiqueta("  ENTRADA   LIBRE ").kind == "gratis"

    def test_una_etiqueta_desconocida_no_se_adivina(self):
        assert desde_etiqueta("Boletería en taquilla") is None
        assert desde_etiqueta(None) is None


class TestFilaQueSeGuarda:
    def test_as_row_usa_los_nombres_de_las_columnas(self):
        assert desde_montos([50000]).as_row() == {
            "price_kind": "unico",
            "price_min": 50000,
            "price_max": 50000,
        }

    def test_sin_dato_limpia_las_tres_columnas(self):
        """Tiene que escribir null en las tres, no omitirlas.

        El upsert reescribe la fila entera: si un evento deja de publicar
        precio y solo se omiten las claves, se queda con el precio viejo.
        """
        assert SIN_DATO == {"price_kind": None, "price_min": None, "price_max": None}
