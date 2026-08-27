"""El filtro editorial: qué entra a la cartelera y con cuánta prioridad.

Los casos son los seis eventos reales que se estaban colando el 2026-08-27
(medidos sobre los 58 en base) más los artistas que hay que separar entre
locales e internacionales.

La regla que ordena todo: **excluir es caro y silencioso**. Un evento que se
cae de la cartelera no deja rastro para el usuario, así que solo se excluye
con una señal fuerte; ante la duda el evento se muestra.
"""
import httpx
import pytest

from bogota_music_intel.clasificacion_manual import CLASIFICACION_MANUAL
from bogota_music_intel.classify import clasificar
from bogota_music_intel.exclusion_patterns import (
    categoria_no_musical,
    patron_no_musical,
)
from bogota_music_intel.tipos_evento import (
    FUENTE_ASUMIDO,
    FUENTE_CATEGORIA,
    FUENTE_MANUAL,
    FUENTE_MUSICBRAINZ,
    FUENTE_PATRON,
    MUSICA,
    NO_MUSICA,
)


class TestCategoriaDeLaFuente:
    """Cuando la sala publica categoría es la señal más confiable, porque no
    la inventamos nosotros. Solo Idartes y Rockal Live la traen."""

    @pytest.mark.parametrize("categoria", ["Teatro", "Multidisciplinar", "Danza"])
    def test_excluye_las_categorias_que_no_son_musica(self, categoria):
        assert categoria_no_musical(categoria) is not None

    def test_no_excluye_musica(self):
        assert categoria_no_musical("Música") is None

    def test_no_excluye_otro(self):
        # "Otro" es un valor de Rockal Live, que es un promotor musical: ahí
        # significa "otro género", no "otra cosa que no es música".
        assert categoria_no_musical("Otro") is None

    @pytest.mark.parametrize("categoria", ["Pop", "Hip Hop/Rap", "Reggaeton", "Rock/Punk/Metal"])
    def test_no_excluye_los_generos_de_rockal(self, categoria):
        assert categoria_no_musical(categoria) is None

    def test_las_cuatro_fuentes_sin_categoria_no_se_excluyen_por_eso(self):
        # Movistar Arena, Royal Center, Lourdes y Latino Power no publican
        # categoría: no tenerla no puede significar "no es música".
        assert categoria_no_musical(None) is None
        assert categoria_no_musical("") is None


class TestPatronesEnElTitulo:
    """Para las fuentes que no publican categoría."""

    def test_excluye_lucha_libre(self):
        assert patron_no_musical("WWE Bogota 2026") is not None

    def test_excluye_una_obra_de_teatro_que_se_anuncia_como_tal(self):
        assert (
            patron_no_musical("'CONTINENTAL', una obra de Juan Bilis en la Sala Gaitán")
            is not None
        )

    def test_encuentra_el_patron_sin_acentos(self):
        assert patron_no_musical("MONÓLOGO DE MEDIANOCHE") is not None

    @pytest.mark.parametrize(
        "titulo",
        [
            "ROBBIE WILLIAMS | BRITPOP",
            "El Kalvo: 20 años del rap rolo",
            "Los Mirlos",
            "MADE4RAP BOGOTÁ",
            "Todos tus muertos",
            "10 AÑOS Y NO AZARAN - LA MUCHACHA EN BOGOTÁ",
        ],
    )
    def test_no_toca_los_toques_reales(self, titulo):
        assert patron_no_musical(titulo) is None

    def test_no_hay_patron_para_live_show(self):
        # Deliberado: "live show" también aparece en títulos de conciertos
        # reales. THE JUANPIS LIVE SHOW se cura a mano en vez de arriesgar
        # sacar música de la cartelera.
        assert patron_no_musical("THE JUANPIS LIVE SHOW: “SI NOS ORGANIZAMOS…”") is None


class TestListaCurada:
    def test_toda_entrada_documenta_su_evidencia(self):
        # Sin evidencia no hay forma de auditar por qué un evento no aparece.
        for clave, entrada in CLASIFICACION_MANUAL.items():
            assert len(entrada.evidencia) > 40, clave

    def test_cubre_los_casos_que_ninguna_regla_detecta(self):
        assert ("royal_center", "hombres-a-la-plancha") in CLASIFICACION_MANUAL
        assert (
            "movistar_arena",
            "the-juanpis-live-show-si-nos-organizamos-cabemos-todos",
        ) in CLASIFICACION_MANUAL


def _evento(source="movistar_arena", source_event_id="x", title="X", category=None) -> dict:
    return {
        "source": source,
        "source_event_id": source_event_id,
        "title": title,
        "category": category,
    }


def _cliente_falso(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


def _responde(artistas: list[dict]):
    return lambda request: httpx.Response(200, json={"artists": artistas})


class TestPrecedencia:
    """La primera señal que contesta gana, de la más confiable a la más
    frágil: curada > categoría > patrón > MusicBrainz."""

    def test_lo_curado_a_mano_gana_sobre_todo(self):
        evento = _evento(
            source="royal_center",
            source_event_id="hombres-a-la-plancha",
            title="HOMBRES A LA PLANCHA",
        )
        # Ni siquiera debería consultar la red.
        def handler(request):
            raise AssertionError("no debería consultar MusicBrainz")

        with _cliente_falso(handler) as cliente:
            resultado = clasificar(evento, client=cliente)

        assert resultado.event_type == NO_MUSICA
        assert resultado.classification_source == FUENTE_MANUAL
        assert resultado.consulto_red is False

    def test_la_categoria_excluye_sin_consultar_la_red(self):
        evento = _evento(
            source="idartes_teatro_jeg",
            source_event_id="ella",
            title="'Ella' de Luisa Fernanda Hoyos en la Sala Gaitán",
            category="Teatro",
        )

        def handler(request):
            raise AssertionError("no debería consultar MusicBrainz")

        with _cliente_falso(handler) as cliente:
            resultado = clasificar(evento, client=cliente)

        assert resultado.event_type == NO_MUSICA
        assert resultado.classification_source == FUENTE_CATEGORIA

    def test_el_patron_excluye_sin_consultar_la_red(self):
        with _cliente_falso(_responde([])) as cliente:
            resultado = clasificar(_evento(title="WWE Bogota 2026"), client=cliente)

        assert resultado.event_type == NO_MUSICA
        assert resultado.classification_source == FUENTE_PATRON
        assert resultado.consulto_red is False


class TestOrigenDelArtista:
    def test_un_internacional_se_marca_pero_no_se_excluye(self):
        # La decisión editorial: los internacionales van en segundo plano,
        # no fuera de la cartelera.
        handler = _responde([{"name": "Robbie Williams", "score": 100, "country": "GB"}])
        with _cliente_falso(handler) as cliente:
            resultado = clasificar(_evento(title="ROBBIE WILLIAMS | BRITPOP"), client=cliente)

        assert resultado.event_type == MUSICA
        assert resultado.is_local is False
        assert resultado.classification_source == FUENTE_MUSICBRAINZ

    def test_un_local_se_marca_como_local(self):
        handler = _responde([{"name": "El Kalvo", "score": 100, "country": "CO"}])
        with _cliente_falso(handler) as cliente:
            resultado = clasificar(
                _evento(title="El Kalvo: 20 años del rap rolo", category="Música"),
                client=cliente,
            )

        assert resultado.is_local is True

    def test_un_artista_no_resuelto_queda_sin_origen_y_se_muestra(self):
        # is_local None no es lo mismo que False: la cartelera no lo
        # penaliza, solo no lo destaca.
        with _cliente_falso(_responde([])) as cliente:
            resultado = clasificar(_evento(title="MADE4RAP BOGOTÁ"), client=cliente)

        assert resultado.event_type == MUSICA
        assert resultado.is_local is None
        assert resultado.classification_source == FUENTE_ASUMIDO

    def test_un_titulo_sin_nada_consultable_no_gasta_una_peticion(self):
        def handler(request):
            raise AssertionError("no debería consultar MusicBrainz")

        with _cliente_falso(handler) as cliente:
            resultado = clasificar(_evento(title="EN BOGOTÁ"), client=cliente)

        assert resultado.event_type == MUSICA
        assert resultado.is_local is None
        assert resultado.consulto_red is False
