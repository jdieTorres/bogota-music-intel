"""El origen del artista solo se acepta cuando el match es confiable.

Mismo criterio que la geocodificación: un país equivocado manda un toque
local al segundo plano de la cartelera, y eso es peor que no saber de dónde
es el artista. Ante la duda, se devuelve None.

Todos los títulos de acá son reales, tomados de la base el 2026-08-27.
"""
import httpx
import pytest

from bogota_music_intel.musicbrainz import (
    ArtistaResuelto,
    MusicBrainzNoDisponible,
    coincide,
    limpiar_titulo,
    resolver_artista,
)


class TestLimpiarTitulo:
    """Las salas titulan el evento, no al artista."""

    @pytest.mark.parametrize(
        "titulo,esperado",
        [
            ("ROBBIE WILLIAMS | BRITPOP", "ROBBIE WILLIAMS"),
            ("JORGE CELEDÓN | LA HISTORIA MÍA", "JORGE CELEDÓN"),
            ("5 SECONDS OF SUMMERS | EVERYONE´S A STAR! WORLD TOUR", "5 SECONDS OF SUMMERS"),
            ("HELLOWEEN | 40 YEARS ANNIVERSARY TOUR", "HELLOWEEN"),
            ("El Kalvo: 20 años del rap rolo", "El Kalvo"),
            ("INSPECTOR - 30 ANIVERSARIO", "INSPECTOR"),
            ("Lenny Tavarez – J quiles", "Lenny Tavarez"),
            ("Juantxo Skalari/ The Skatalites en Bogotá", "Juantxo Skalari"),
        ],
    )
    def test_corta_en_el_separador(self, titulo, esperado):
        assert limpiar_titulo(titulo) == esperado

    def test_corta_con_espacio_duro_como_separador(self):
        # Caso real: Royal Center publica "AKRIILA -\xa0 TOUR LUCY", con un
        # espacio de no separación en vez de uno normal. Se ve idéntico en
        # pantalla y rompe cualquier split ingenuo por " - ".
        assert limpiar_titulo("AKRIILA -\xa0 TOUR LUCY") == "AKRIILA"

    @pytest.mark.parametrize(
        "titulo,esperado",
        [
            ("PABLOPABLO EN BOGOTÁ", "PABLOPABLO"),
            ("KAKKMADDAFAKKA EN BOGOTA", "KAKKMADDAFAKKA"),
            ("MADE4RAP BOGOTÁ", "MADE4RAP"),
            ("Alvaro Diaz 2026", "Alvaro Diaz"),
            ("Gustavo Santaolalla llega a Bogotá con el Ronroco Tour", "Gustavo Santaolalla"),
            ("Blonde Redhead llega al Teatro Jorge Eliécer Gaitán", "Blonde Redhead"),
            ("El plan de la mariposa en Bogota", "El plan de la mariposa"),
        ],
    )
    def test_saca_las_coletillas_de_cartelera(self, titulo, esperado):
        assert limpiar_titulo(titulo) == esperado

    def test_se_queda_con_lo_que_va_despues_de_presenta(self):
        assert (
            limpiar_titulo("Festival Orígenes presenta Sara Curruchich y Humazapas")
            == "Sara Curruchich y Humazapas"
        )

    def test_un_nombre_limpio_no_se_toca(self):
        for titulo in ("OPETH", "Los Mirlos", "Ky Mani Marley", "Todos tus muertos"):
            assert limpiar_titulo(titulo) == titulo

    def test_devuelve_vacio_cuando_no_queda_nada_consultable(self):
        # El llamador tiene que tratarlo como "sin resolver", no como un
        # artista sin nombre.
        assert limpiar_titulo("EN BOGOTÁ") == ""
        assert limpiar_titulo("2026") == ""


class TestCoincide:
    def test_acepta_un_nombre_mal_escrito_por_la_sala(self):
        # Movistar Arena publica "5 SECONDS OF SUMMERS"; la banda es
        # "5 Seconds of Summer".
        assert coincide("5 SECONDS OF SUMMERS", "5 Seconds of Summer")

    def test_ignora_mayusculas_acentos_y_puntuacion(self):
        assert coincide("JORGE CELEDÓN", "Jorge Celedon")
        assert coincide("OLD MAN´S CHILD", "Old Man's Child")

    def test_rechaza_que_una_parte_del_titulo_haga_de_artista(self):
        # El falso positivo típico: aceptar cualquier coincidencia parcial
        # haría que "Laura & Brenda" resolviera a la artista "Laura" y le
        # asignara su país.
        assert not coincide("Laura & Brenda", "Laura")

    def test_rechaza_un_nombre_distinto(self):
        assert not coincide("Todo copas", "Top Cats")

    def test_rechaza_consultas_demasiado_cortas(self):
        assert not coincide("A", "A")


def _cliente_falso(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


def _respuesta(artistas: list[dict]) -> httpx.Response:
    return httpx.Response(200, json={"artists": artistas})


class TestResolverArtista:
    def test_resuelve_el_pais_de_un_artista_conocido(self):
        def handler(request):
            return _respuesta(
                [{"name": "Robbie Williams", "score": 100, "country": "GB"}]
            )

        with _cliente_falso(handler) as cliente:
            artista = resolver_artista("ROBBIE WILLIAMS", client=cliente)

        assert artista is not None
        assert artista.pais == "GB"
        assert artista.es_local is False

    def test_un_artista_colombiano_es_local(self):
        def handler(request):
            return _respuesta([{"name": "El Kalvo", "score": 100, "country": "CO"}])

        with _cliente_falso(handler) as cliente:
            artista = resolver_artista("El Kalvo", client=cliente)

        assert artista.es_local is True

    def test_lee_el_pais_del_area_cuando_no_viene_country(self):
        def handler(request):
            return _respuesta(
                [
                    {
                        "name": "Los Mirlos",
                        "score": 100,
                        "area": {"name": "Peru", "iso-3166-1-codes": ["PE"]},
                    }
                ]
            )

        with _cliente_falso(handler) as cliente:
            artista = resolver_artista("Los Mirlos", client=cliente)

        assert artista.pais == "PE"
        assert artista.es_local is False

    def test_un_artista_sin_pais_no_decide_nada(self):
        # Existe en MusicBrainz pero sin origen: no se puede afirmar ni que
        # es local ni que no lo es.
        def handler(request):
            return _respuesta([{"name": "The Jazz Room", "score": 100}])

        with _cliente_falso(handler) as cliente:
            artista = resolver_artista("THE JAZZ ROOM", client=cliente)

        assert artista is not None
        assert artista.es_local is None

    def test_rechaza_un_match_de_puntaje_bajo(self):
        # MusicBrainz siempre contesta algo: ante un título basura devuelve
        # el artista menos malo que encuentre.
        def handler(request):
            return _respuesta([{"name": "Cualquier Cosa", "score": 42, "country": "US"}])

        with _cliente_falso(handler) as cliente:
            assert resolver_artista("Que Chimba Puñeta Vol. 4", client=cliente) is None

    def test_rechaza_un_puntaje_alto_con_nombre_distinto(self):
        def handler(request):
            return _respuesta([{"name": "Laura", "score": 100, "country": "US"}])

        with _cliente_falso(handler) as cliente:
            assert resolver_artista("Laura & Brenda", client=cliente) is None

    def test_sin_resultados_devuelve_none(self):
        with _cliente_falso(lambda request: _respuesta([])) as cliente:
            assert resolver_artista("MADE4RAP", client=cliente) is None

    def test_se_salta_un_match_malo_y_toma_el_bueno(self):
        def handler(request):
            return _respuesta(
                [
                    {"name": "Otra Banda", "score": 100, "country": "US"},
                    {"name": "Opeth", "score": 98, "country": "SE"},
                ]
            )

        with _cliente_falso(handler) as cliente:
            artista = resolver_artista("OPETH", client=cliente)

        assert artista.nombre == "Opeth"
        assert artista.pais == "SE"

    def test_guarda_la_consulta_para_poder_auditarla(self):
        def handler(request):
            return _respuesta([{"name": "Tini", "score": 100, "country": "AR"}])

        with _cliente_falso(handler) as cliente:
            artista = resolver_artista("Tini", client=cliente)

        assert artista.consulta == "Tini"
        assert artista.puntaje == 100


class TestCuandoMusicBrainzNoResponde:
    """503 es la respuesta de MusicBrainz cuando se le pide muy seguido o
    está saturado. Pasó de verdad la primera vez que se corrió esto contra
    los 58 eventos en base: reventó a la cuarta consulta."""

    def test_reintenta_y_sigue_si_el_503_fue_pasajero(self):
        intentos = []

        def handler(request):
            intentos.append(request.url)
            if len(intentos) == 1:
                return httpx.Response(503)
            return _respuesta([{"name": "Opeth", "score": 100, "country": "SE"}])

        with _cliente_falso(handler) as cliente:
            artista = resolver_artista("OPETH", client=cliente)

        assert len(intentos) == 2
        assert artista.pais == "SE"

    def test_reintenta_tras_un_timeout(self):
        # Caso real: clasificando los 58 eventos, MusicBrainz cortó con un
        # ReadTimeout y tumbó la corrida entera.
        intentos = []

        def handler(request):
            intentos.append(request.url)
            if len(intentos) == 1:
                raise httpx.ReadTimeout("timed out", request=request)
            return _respuesta([{"name": "Guaco", "score": 100, "country": "VE"}])

        with _cliente_falso(handler) as cliente:
            artista = resolver_artista("Guaco", client=cliente)

        assert len(intentos) == 2
        assert artista.pais == "VE"

    def test_un_timeout_persistente_tampoco_es_no_encontrado(self):
        def handler(request):
            raise httpx.ReadTimeout("timed out", request=request)

        with (
            _cliente_falso(handler) as cliente,
            pytest.raises(MusicBrainzNoDisponible),
        ):
            resolver_artista("Guaco", client=cliente)

    def test_un_503_persistente_no_se_confunde_con_no_encontrado(self):
        # Distinguirlos importa: "no lo encontré" es una respuesta final,
        # "no pude preguntar" deja el evento pendiente para el próximo
        # intento. Devolver None acá lo daría por resuelto para siempre.
        with (
            _cliente_falso(lambda request: httpx.Response(503)) as cliente,
            pytest.raises(MusicBrainzNoDisponible),
        ):
            resolver_artista("OPETH", client=cliente)


class TestEsLocal:
    def test_solo_colombia_cuenta_como_local(self):
        assert ArtistaResuelto("X", "CO", "X", 100).es_local is True
        assert ArtistaResuelto("X", "AR", "X", 100).es_local is False
        assert ArtistaResuelto("X", None, "X", 100).es_local is None
