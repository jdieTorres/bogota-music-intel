"""Cómo se clasifica lo que trae cada fuente, y qué no vuelve a entrar.

El Teatro Jorge Eliécer Gaitán es una agenda distrital que programa de
todo. Hasta el 2026-08-31 entraba acotada a conciertos; Juan levantó esa
restricción al existir la cola de moderación, y la ruta de la ficha dejó de
filtrar para pasar a clasificar. Aparte, hay eventos que se borraron a mano
y no deben volver.
"""
from types import SimpleNamespace

from bogota_music_intel.eventos_excluidos import cargar_bloqueados
from bogota_music_intel.scrapers.idartes_teatro_jeg import disciplina

BASE = "https://www.idartes.gov.co/es/agenda"


class TestDisciplinaDeIdartes:
    """La ruta de la ficha manda sobre la etiqueta del listado, porque el
    listado se contradice con su propia ficha."""

    def test_un_concierto_queda_como_musica(self):
        assert disciplina(f"{BASE}/concierto/el-kalvo-20-anos-del-rap-rolo", "Música") == "Música"

    def test_la_ruta_corrige_a_la_etiqueta_equivocada(self):
        # El caso que enseñó la lección: Idartes lista "'Fuera de sí'" como
        # «Música» y su ficha vive bajo danza, describiéndose como una obra
        # de danza. Gana la ruta.
        assert (
            disciplina(
                f"{BASE}/presentacion-de-danza/fuera-de-si-por-jenny-ocampo-y-santiago-botero",
                "Música",
            )
            == "Danza"
        )

    def test_la_ruta_tambien_manda_cuando_la_etiqueta_acierta(self):
        assert (
            disciplina(f"{BASE}/obra-de-teatro/continental-una-obra-de-juan-bilis", "Teatro")
            == "Teatro"
        )
        assert (
            disciplina(f"{BASE}/presentacion-de-danza/ella-de-luisa-fernanda-hoyos", "Teatro")
            == "Danza"
        )

    def test_la_ruta_generica_se_cae_a_la_etiqueta(self):
        # `presentacion` a secas es ambigua: ahí conviven un concierto y una
        # ópera, y en los dos casos la etiqueta acierta.
        assert (
            disciplina(f"{BASE}/presentacion/gaitan-al-aire-vol-57-ancestral-beats", "Música")
            == "Música"
        )
        assert (
            disciplina(f"{BASE}/presentacion/einstein-on-the-beach", "Multidisciplinar")
            == "Multidisciplinar"
        )

    def test_una_ruta_desconocida_se_cae_a_la_etiqueta(self):
        # Ya no se descarta nada por no reconocer la ruta: entra y lo
        # clasifica lo que diga el listado, o queda sin clasificar para que
        # lo mire una persona.
        assert disciplina(f"{BASE}/taller-de-percusion/algo-nuevo", "Música") == "Música"
        assert disciplina(f"{BASE}/taller-de-percusion/algo-nuevo", None) is None


class _ClienteFalso:
    """Lo mínimo de la interfaz de Supabase que usa `cargar_bloqueados`."""

    def __init__(self, filas=None, falla=False):
        self._filas = filas or []
        self._falla = falla

    def table(self, _nombre):
        if self._falla:
            raise RuntimeError("relation \"blocked_source_events\" does not exist")
        return self

    def select(self, _campos):
        return self

    def execute(self):
        return SimpleNamespace(data=self._filas)


class TestEventosBloqueados:
    def test_devuelve_la_clave_compuesta(self):
        cliente = _ClienteFalso(
            [{"source": "movistar_arena", "source_event_id": "laura-brenda"}]
        )
        bloqueados = cargar_bloqueados(cliente)
        assert ("movistar_arena", "laura-brenda") in bloqueados
        # La clave es (fuente, id): el mismo id en otra fuente no se bloquea.
        assert ("royal_center", "laura-brenda") not in bloqueados

    def test_sin_la_tabla_no_tumba_la_ingesta(self):
        # Una base sin la migración de borrado tiene que poder scrapear.
        # Bloquear de menos deja un evento de más a la vista, que se arregla
        # desde el formulario; fallar deja la cartelera sin actualizar.
        assert cargar_bloqueados(_ClienteFalso(falla=True)) == set()

    def test_una_tabla_vacia_no_bloquea_nada(self):
        assert cargar_bloqueados(_ClienteFalso([])) == set()
