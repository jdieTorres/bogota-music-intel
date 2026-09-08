"""El filtro editorial: qué entra a la cartelera y con cuánta prioridad.

Los casos son los seis eventos reales que se estaban colando el 2026-08-27
(medidos sobre los 58 en base) más los artistas que hay que separar entre
locales e internacionales.

La regla que ordena todo: **excluir es caro y silencioso**. Un evento que se
cae de la cartelera no deja rastro para el usuario, así que solo se excluye
con una señal fuerte; ante la duda el evento se muestra.
"""
import pytest

from bogota_music_intel.ciclos_curados import CICLOS
from bogota_music_intel.clasificacion_manual import CLASIFICACION_MANUAL
from bogota_music_intel.classify import clasificar
from bogota_music_intel.exclusion_patterns import (
    categoria_no_musical,
    patron_no_musical,
)
from bogota_music_intel.festivales_curados import FESTIVALES, festival_de
from bogota_music_intel.tipos_evento import (
    FESTIVAL,
    FIESTA,
    FUENTE_ASUMIDO,
    FUENTE_CATEGORIA,
    FUENTE_CICLO,
    FUENTE_FESTIVAL,
    FUENTE_MANUAL,
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


class TestPrecedencia:
    """La primera señal que contesta gana, de la más confiable a la más
    frágil: curada > ciclo > festival > categoría > patrón."""

    def test_lo_curado_a_mano_gana_sobre_todo(self):
        resultado = clasificar(
            _evento(
                source="royal_center",
                source_event_id="hombres-a-la-plancha",
                title="HOMBRES A LA PLANCHA",
            )
        )
        assert resultado.event_type == NO_MUSICA
        assert resultado.classification_source == FUENTE_MANUAL

    def test_la_categoria_de_la_fuente_gana_sobre_el_titulo(self):
        resultado = clasificar(
            _evento(
                source="idartes_teatro_jeg",
                source_event_id="ella",
                title="'Ella' de Luisa Fernanda Hoyos en la Sala Gaitán",
                category="Teatro",
            )
        )
        assert resultado.event_type == NO_MUSICA
        assert resultado.classification_source == FUENTE_CATEGORIA

    def test_el_patron_atrapa_lo_que_la_fuente_no_categoriza(self):
        resultado = clasificar(_evento(title="WWE Bogota 2026"))
        assert resultado.event_type == NO_MUSICA
        assert resultado.classification_source == FUENTE_PATRON

    def test_lo_que_ninguna_regla_excluye_es_musica(self):
        # Es el camino más transitado desde que se dio de baja MusicBrainz
        # (2026-09-08): sin la consulta de origen, casi todo llega acá.
        #
        # Asumir música es lo correcto, y el nombre de la fuente lo dice sin
        # mentir: nadie verificó que lo sea, solo que nada dice que no. El
        # costo de mostrar de más es un evento que sobra en una lista; el de
        # excluir de más es un toque que desaparece sin que nadie se entere.
        resultado = clasificar(_evento(title="Mukangu & Atake Mapalé & Los Yoryis"))
        assert resultado.event_type == MUSICA
        assert resultado.classification_source == FUENTE_ASUMIDO

    def test_el_clasificador_no_afirma_nada_sobre_el_origen(self):
        # `Clasificacion` ya no tiene el campo, y que no exista es lo que
        # garantiza que ningún automatismo lo escriba: `is_local` lo decide
        # una persona en /admin.
        resultado = clasificar(_evento(title="Carlos Vives & La Provincia"))
        assert not hasattr(resultado, "is_local")


class TestFiestasYCiclos:
    """La tercera categoría: la noche o el ciclo que programa la sala.

    No es un concierto con el artista sin identificar — es que no hay
    artista que identificar. Se muestra en la cartelera, en su pestaña."""

    def test_una_fiesta_no_se_excluye(self):
        resultado = clasificar(_evento(title="Que Chimba Puñeta Vol. 4"))
        assert resultado.event_type == FIESTA
        assert resultado.classification_source == FUENTE_CICLO

    def test_la_edicion_siguiente_entra_sola(self):
        # La razón de curar por nombre de ciclo y no por id del evento.
        resultado = clasificar(_evento(title="QUE CHIMBA PUNETA VOL 5"))
        assert resultado.event_type == FIESTA

    def test_un_toque_en_la_misma_sala_no_se_vuelve_fiesta(self):
        # "Todo copas en Latino Power Bogota 20 Años" parecía una fiesta por
        # el título y es una banda de hip hop colombiana. La sala no decide.
        resultado = clasificar(
            _evento(source="latino_power", title="Todo copas en Latino Power Bogota 20 Años")
        )
        assert resultado.event_type == MUSICA


class TestCiclosCurados:
    def test_todo_ciclo_documenta_su_evidencia(self):
        for ciclo in CICLOS:
            assert len(ciclo.evidencia) > 40, ciclo.nombre


class TestFestivalesCurados:
    """El cron empezó a traer festivales con `visitbogota` (2026-08-31), y
    sin categoría propia caían en `music` con el origen sin resolver para
    siempre — un festival no tiene UN artista al que preguntarle."""

    def test_toda_entrada_documenta_su_evidencia(self):
        for festival in FESTIVALES:
            assert len(festival.evidencia) > 40, festival.nombre

    def test_reconoce_el_festival_con_y_sin_el_anio_de_la_edicion(self):
        # El año es la edición, no el nombre: así "Rock al Parque 2027" entra
        # solo el año que viene, sin tocar la lista.
        assert festival_de("Rock al Parque 2026").nombre == "Rock al Parque"
        assert festival_de("Rock al Parque").nombre == "Rock al Parque"
        assert festival_de("ROCK AL PARQUE 2026").nombre == "Rock al Parque"

    def test_un_concierto_dentro_de_un_festival_no_es_el_festival(self):
        # El caso real que obligó a comparar el título entero en vez de
        # buscar subcadena: el Teatro Jorge Eliécer Gaitán publica un show
        # con dos artistas nombrados bajo el paraguas de Festival Orígenes.
        # Si matcheara, perdería su cartel y su origen.
        assert festival_de("Festival Orígenes presenta Sara Curruchich y Humazapas") is None

    def test_no_se_traga_un_concierto_que_solo_menciona_el_nombre(self):
        assert festival_de("Aterciopelados en Rock al Parque") is None
        assert festival_de("Rock al Parque: el documental") is None

    def test_gana_sobre_el_titulo_completo(self):
        resultado = clasificar(
            _evento(source="visitbogota", title="Rock al Parque 2026", category="Conciertos")
        )
        assert resultado.event_type == FESTIVAL
        assert resultado.classification_source == FUENTE_FESTIVAL

    def test_gana_sobre_la_categoria_de_la_fuente(self):
        # visitbogota escribe "Conciertos" en todo lo suyo. Si la categoría
        # decidiera primero, ningún festival suyo se marcaría como tal.
        resultado = clasificar(
            _evento(source="visitbogota", title="Salsa al Parque 2026", category="Conciertos")
        )
        assert resultado.event_type == FESTIVAL

    def test_ningun_festival_choca_con_un_ciclo(self):
        # Las dos listas se consultan en orden y la primera gana. Si un
        # nombre estuviera en las dos, el resultado dependería del orden del
        # código en vez de de la evidencia.
        from bogota_music_intel.ciclos_curados import ciclo_de

        for festival in FESTIVALES:
            assert ciclo_de(festival.nombre) is None, festival.nombre
