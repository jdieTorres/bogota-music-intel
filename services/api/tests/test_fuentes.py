"""Qué deja entrar cada fuente, y qué se bloquea antes de guardar.

Las dos reglas de acá son de Juan (2026-08-28) y son distintas entre sí:
del Teatro Jorge Eliécer Gaitán entran solo conciertos, porque es una
agenda distrital que programa de todo; y hay eventos sueltos que él sacó a
mano y no deben volver.
"""
from bogota_music_intel.eventos_excluidos import EVENTOS_EXCLUIDOS, esta_excluido
from bogota_music_intel.scrapers.idartes_teatro_jeg import es_concierto

BASE = "https://www.idartes.gov.co/es/agenda"


class TestIdartesSoloConciertos:
    """El filtro va por la URL de la ficha y no por la categoría del
    listado, porque el listado se contradice con su propia ficha."""

    def test_deja_pasar_los_conciertos(self):
        # Los cuatro conciertos reales de la agenda al 2026-08-28.
        for slug in (
            "el-kalvo-20-anos-del-rap-rolo",
            "blonde-redhead-llega-al-teatro-jorge-eliecer-gaitan",
            "gustavo-santaolalla-llega-a-bogota-con-el-ronroco-tour",
            "festival-origenes-presenta-sara-curruchich-y-humazapas",
        ):
            assert es_concierto(f"{BASE}/concierto/{slug}")

    def test_deja_fuera_el_teatro_y_la_danza(self):
        assert not es_concierto(f"{BASE}/obra-de-teatro/continental-una-obra-de-juan-bilis")
        assert not es_concierto(f"{BASE}/presentacion-de-danza/ella-de-luisa-fernanda-hoyos")

    def test_deja_fuera_la_danza_que_el_listado_llama_musica(self):
        # El caso que motivó usar la URL: Idartes lista "'Fuera de sí'" como
        # «Música» en la agenda, y su ficha está bajo danza.
        assert not es_concierto(
            f"{BASE}/presentacion-de-danza/fuera-de-si-por-jenny-ocampo-y-santiago-botero"
        )

    def test_deja_fuera_el_generico_presentacion(self):
        # Ahí caen la ópera y los cruces interdisciplinares.
        assert not es_concierto(f"{BASE}/presentacion/einstein-on-the-beach")
        assert not es_concierto(f"{BASE}/presentacion/gaitan-al-aire-vol-57-ancestral-beats")

    def test_una_ruta_desconocida_no_entra(self):
        # Deliberado: ante una disciplina nueva, no colar nada. Es más fácil
        # notar que falta un concierto que descubrir teatro en la cartelera.
        assert not es_concierto(f"{BASE}/taller-de-percusion/algo-nuevo")


class TestEventosExcluidos:
    def test_toda_entrada_documenta_su_motivo(self):
        for clave, entrada in EVENTOS_EXCLUIDOS.items():
            assert len(entrada.motivo) > 40, clave

    def test_bloquea_lo_que_juan_saco(self):
        assert esta_excluido("movistar_arena", "laura-brenda")

    def test_no_bloquea_nada_mas(self):
        assert not esta_excluido("movistar_arena", "wwe-bogota-2026")
        # La clave es (fuente, id): el mismo id en otra fuente no se bloquea.
        assert not esta_excluido("royal_center", "laura-brenda")
