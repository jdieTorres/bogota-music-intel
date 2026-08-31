"""La base de la moderación: agrupar el mismo show, armar el borrador y
detectar que la fuente se movió después de la aprobación."""
from bogota_music_intel.deduplicacion import (
    agrupar_mismos_shows,
    dia_en_bogota,
    es_el_mismo_show,
    mas_completo,
    titulo_equivalente,
)
from bogota_music_intel.moderacion import borrador_desde, cambios, snapshot

SALA = "11111111-1111-1111-1111-111111111111"
OTRA_SALA = "22222222-2222-2222-2222-222222222222"


def crudo(**campos):
    base = {
        "source": "royal_center",
        "source_event_id": "1",
        "venue_id": SALA,
        "title": "AKRIILA",
        "starts_at": "2026-10-30T05:00:00+00:00",
        "date_precision": "day",
    }
    return {**base, **campos}


class TestTituloEquivalente:
    def test_uno_contenido_en_el_otro(self):
        assert titulo_equivalente("AKRIILA - TOUR LUCY", "AKRIILA EN BOGOTÁ")

    def test_no_junta_dos_shows_que_solo_comparten_relleno(self):
        # Comparten solo "noche": son dos fiestas distintas de la misma sala.
        assert not titulo_equivalente("Noche de Salsa", "Noche Electrónica")

    def test_ignora_acentos_y_mayusculas(self):
        assert titulo_equivalente("EL PLAN DE LA MARIPOSA", "el plan de la mariposa")

    def test_un_titulo_de_puro_relleno_no_empareja_con_todo(self):
        assert not titulo_equivalente("En vivo", "AKRIILA")


class TestElMismoShow:
    def test_dos_fuentes_del_mismo_concierto(self):
        royal = crudo(title="AKRIILA -  TOUR LUCY", starts_at="2026-10-30T05:00:00+00:00")
        rockal = crudo(
            source="rockal_live",
            title="AKRIILA EN BOGOTÁ",
            starts_at="2026-10-31T01:00:32+00:00",
        )
        # Distinto instante UTC, mismo día en Bogotá: 30 de octubre.
        assert dia_en_bogota(royal["starts_at"]) == dia_en_bogota(rockal["starts_at"])
        assert es_el_mismo_show(royal, rockal)

    def test_mismo_titulo_en_salas_distintas_no_es_el_mismo_show(self):
        assert not es_el_mismo_show(crudo(), crudo(venue_id=OTRA_SALA))

    def test_sin_fecha_no_se_empareja(self):
        # Dos eventos sin fecha en la misma sala no tienen con qué
        # distinguirse; unirlos sería inventar que son el mismo.
        sin_fecha = crudo(starts_at=None)
        assert not es_el_mismo_show(sin_fecha, crudo(starts_at=None, source="otra"))

    def test_agrupa_conservando_el_orden(self):
        a = crudo(title="AKRIILA", source_event_id="a")
        b = crudo(title="AKRIILA TOUR LUCY", source="rockal_live", source_event_id="b")
        c = crudo(title="OPETH", source_event_id="c")
        grupos = agrupar_mismos_shows([a, b, c])
        assert [len(g) for g in grupos] == [2, 1]
        assert grupos[1][0]["title"] == "OPETH"


class TestBorrador:
    def test_se_prellena_con_la_fuente_mas_completa(self):
        pobre = crudo(title="AKRIILA -  TOUR LUCY")
        rico = crudo(
            source="rockal_live",
            title="AKRIILA EN BOGOTÁ",
            price_text="$157,000 COP",
            category="Otro",
            starts_at="2026-10-31T01:00:32+00:00",
        )
        assert mas_completo([pobre, rico]) is rico
        assert borrador_desde([pobre, rico])["price_text"] == "$157,000 COP"

    def test_completa_los_huecos_con_las_otras_fuentes(self):
        # El caso Akriila: la fuente rica no publica ticket_url y la pobre sí.
        # Antes se perdía; ahora el canónico cuelga de las dos.
        pobre = crudo(ticket_url="https://royalcenter.com.co/akriila")
        rico = crudo(source="rockal_live", price_text="$157,000 COP", category="Otro")
        borrador = borrador_desde([pobre, rico])
        assert borrador["price_text"] == "$157,000 COP"
        assert borrador["ticket_url"] == "https://royalcenter.com.co/akriila"

    def test_nace_en_borrador_y_nunca_publicado(self):
        borrador = borrador_desde([crudo()])
        assert borrador["status"] == "borrador"
        assert borrador["origin"] == "scraper"

    def test_el_snapshot_no_marca_cambios_apenas_creado(self):
        # El bug que esto previene: si el snapshot se tomara solo de la
        # fuente elegida, un campo que aporta la otra saldría como "cambió"
        # en la corrida siguiente sin que nadie tocara nada.
        crudos = [
            crudo(ticket_url="https://royalcenter.com.co/akriila"),
            crudo(source="rockal_live", price_text="$157,000 COP"),
        ]
        borrador = borrador_desde(crudos)
        assert cambios(borrador["source_snapshot"], borrador_desde(crudos)) == {}


class TestCambiosEnElOrigen:
    def test_detecta_que_la_sala_movio_el_precio(self):
        antes = borrador_desde([crudo(price_text="$102.000")])
        despues = borrador_desde([crudo(price_text="$118.000")])
        diff = cambios(antes["source_snapshot"], despues)
        assert diff == {"price_text": {"antes": "$102.000", "ahora": "$118.000"}}

    def test_la_misma_hora_en_otro_huso_no_es_un_cambio(self):
        # `T05:00:00+00:00` y `T00:00:00-05:00` son el mismo instante. Sin
        # normalizar a UTC, compararlos como texto inventaría un cambio.
        antes = borrador_desde([crudo(starts_at="2026-10-30T05:00:00+00:00")])
        despues = borrador_desde([crudo(starts_at="2026-10-30T00:00:00-05:00")])
        assert cambios(antes["source_snapshot"], despues) == {}

    def test_sin_snapshot_no_se_afirma_que_algo_cambio(self):
        # "No sé" y "cambió" son estados distintos: sin foto previa no hay
        # con qué comparar, y marcar todo como nuevo sería inventar.
        assert cambios(None, borrador_desde([crudo()])) == {}

    def test_la_descripcion_no_se_vigila(self):
        # Es texto libre que cambia con cualquier retoque de la página y
        # ahogaría la cola sin cambiar ningún hecho.
        antes = borrador_desde([crudo(description="Puertas 8pm")])
        despues = borrador_desde([crudo(description="Puertas 8:00 pm.")])
        assert cambios(antes["source_snapshot"], despues) == {}
        assert "description" not in snapshot(crudo())
