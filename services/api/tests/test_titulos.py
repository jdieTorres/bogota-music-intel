"""Portados desde `apps/web/src/lib/tituloEvento.test.ts` al mover la
normalización del frontend a la ingesta (2026-08-31). Son la especificación
del comportamiento, verificada en su momento contra los 53 títulos reales de
la base: si el port cambió algo, tiene que salir acá."""
from bogota_music_intel.titulos import (
    clave_de_titulo,
    es_grito,
    normalizar_titulo,
    partir_artista_y_gira,
    partir_artistas,
    partir_titulo,
    titulo_caso,
)
from bogota_music_intel.titulos_curados import GRAFIAS, TITULOS

# Las salas reales, para ejercitar el borrado del "en <sala>" con los
# nombres que de verdad están en la base.
MOVISTAR = "Movistar Arena"
LATINO = "Latino Power Chapinero"
ROCKAL = "Teatro Libre Sede Centro"
JEG = "Teatro Jorge Eliécer Gaitán"
ROYAL = "Royal Center"
LOURDES = "Lourdes Music Hall"


def concierto(titulo: str, sala: str | None = None) -> str:
    return normalizar_titulo(titulo, "music", sala)


def fiesta(titulo: str, sala: str | None = None) -> str:
    return normalizar_titulo(titulo, "fiesta", sala)


class TestTituloCaso:
    def test_rearma_un_titulo_gritado(self):
        assert titulo_caso("FIESTA DE LA SALSA") == "Fiesta de la Salsa"
        assert titulo_caso("OF MONSTERS AND MEN") == "Of Monsters and Men"

    def test_capitaliza_el_conector_que_abre(self):
        assert titulo_caso("LA MUCHACHA EN BOGOTÁ") == "La Muchacha en Bogotá"

    def test_sube_las_minusculas_de_una_fuente_que_no_grita(self):
        assert titulo_caso("Todos tus muertos") == "Todos Tus Muertos"
        assert titulo_caso("El plan de la mariposa") == "El Plan de la Mariposa"

    def test_no_baja_una_mayuscula_puesta_a_mano(self):
        # La banda se publica así; bajar la 'A' sería inventar que es conector.
        assert titulo_caso("Lucho Al Attaque") == "Lucho Al Attaque"

    def test_respeta_una_sigla_suelta(self):
        assert titulo_caso("WWE Bogota") == "WWE Bogota"

    def test_rearma_una_rafaga_de_mayusculas_en_caja_mixta(self):
        assert (
            titulo_caso("Shing02, SPIN MASTER A-1 y Sam Nakamura")
            == "Shing02, Spin Master A-1 y Sam Nakamura"
        )

    def test_no_rearma_una_palabra_con_letras_y_digitos(self):
        assert titulo_caso("MADE4RAP") == "MADE4RAP"

    def test_unifica_el_apostrofo(self):
        assert titulo_caso("OLD MAN´S CHILD") == "Old Man’s Child"

    def test_conserva_numeros_y_acentos(self):
        assert titulo_caso("10 AÑOS Y NO AZARAN") == "10 Años y No Azaran"

    def test_colapsa_espacios(self):
        assert titulo_caso("ROBBIE   WILLIAMS") == "Robbie Williams"


class TestEsGrito:
    def test_distingue_sostenida_de_caja_mixta(self):
        assert es_grito("ROBBIE WILLIAMS")
        assert not es_grito("Robbie Williams")
        assert not es_grito("2026")


class TestPartirArtistaYGira:
    def test_separa_por_barra_vertical(self):
        assert partir_artista_y_gira("ROBBIE WILLIAMS | BRITPOP") == (
            "ROBBIE WILLIAMS",
            "BRITPOP",
        )

    def test_separa_por_dos_puntos_y_por_guion(self):
        assert partir_artista_y_gira("El Kalvo: 20 años")[1] == "20 años"
        assert partir_artista_y_gira("AKRIILA - TOUR LUCY")[1] == "TOUR LUCY"

    def test_la_raya_larga_se_trata_como_guion(self):
        assert partir_artista_y_gira("Lenny Tavarez – J quiles") == (
            "Lenny Tavarez",
            "J quiles",
        )

    def test_no_separa_un_guion_pegado(self):
        assert partir_artista_y_gira("JAY-Z EN BOGOTÁ") == ("JAY-Z EN BOGOTÁ", None)

    def test_sin_separador_todo_es_el_artista(self):
        assert partir_artista_y_gira("Los Mirlos") == ("Los Mirlos", None)

    def test_un_separador_al_borde_no_inventa_un_lado_vacio(self):
        assert partir_artista_y_gira("ROBBIE WILLIAMS |") == ("ROBBIE WILLIAMS |", None)


class TestPartirArtistas:
    def test_parte_un_cartel_por_barras(self):
        assert partir_artistas("Mukangu/Atake Mapale/ Los Yoryis") == [
            "Mukangu",
            "Atake Mapale",
            "Los Yoryis",
        ]

    def test_no_parte_una_barra_que_es_del_nombre(self):
        assert partir_artistas("AC/DC") == ["AC/DC"]

    def test_parte_por_comas_y_remata_con_la_y_final(self):
        assert partir_artistas("Shing02, SPIN MASTER A-1 y Sam Nakamura") == [
            "Shing02",
            "SPIN MASTER A-1",
            "Sam Nakamura",
        ]

    def test_no_parte_por_y_si_nada_marca_que_es_lista(self):
        assert partir_artistas("10 AÑOS Y NO AZARAN") == ["10 AÑOS Y NO AZARAN"]

    def test_si_parte_por_y_cuando_un_presenta_ya_dijo_que_es_cartel(self):
        assert partir_artistas("Sara Curruchich y Humazapas", True) == [
            "Sara Curruchich",
            "Humazapas",
        ]


class TestLoBasico:
    def test_concierto_con_gira(self):
        assert concierto("ROBBIE WILLIAMS | BRITPOP") == "Robbie Williams | Britpop"

    def test_concierto_sin_gira_no_deja_barra_colgando(self):
        assert concierto("COSCULLUELA") == "Cosculluela"

    def test_sin_clasificar_se_trata_como_concierto(self):
        assert normalizar_titulo("COSCULLUELA", None) == "Cosculluela"


class TestRuidoDeLugar:
    def test_quita_el_en_bogota(self):
        assert concierto("AKRIILA EN BOGOTÁ", ROCKAL) == "Akriila"
        assert concierto("El plan de la mariposa en Bogota", LATINO) == "El Plan de la Mariposa"

    def test_quita_el_llega_al_teatro(self):
        assert (
            concierto("Blonde Redhead llega al Teatro Jorge Eliécer Gaitán", JEG)
            == "Blonde Redhead"
        )

    def test_quita_el_en_sala_aunque_la_fuente_lo_escriba_mal(self):
        assert concierto("Estelares en Latino power", LATINO) == "Estelares"

    def test_lo_que_viene_despues_del_lugar_es_la_gira(self):
        assert (
            concierto("Gustavo Santaolalla llega a Bogotá con el Ronroco Tour", JEG)
            == "Gustavo Santaolalla | Ronroco Tour"
        )
        assert (
            concierto("Todo copas en Latino Power Bogota 20 Años", LATINO)
            == "Todo Copas | 20 Años"
        )

    def test_quita_la_ciudad_pegada_al_final(self):
        assert fiesta("MADE4RAP BOGOTÁ", ROCKAL) == "MADE4RAP"

    def test_no_borra_un_en_que_no_anuncia_lugar(self):
        assert concierto("Fiesta en vivo", LATINO) == "Fiesta en Vivo"

    def test_sin_nombre_de_sala_igual_quita_la_ciudad(self):
        assert concierto("KAKKMADDAFAKKA EN BOGOTA") == "Kakkmaddafakka"


class TestVariosArtistas:
    def test_cartel_de_dos(self):
        assert (
            concierto("Juantxo Skalari/ The Skatalites en Bogotá", LATINO)
            == "Juantxo Skalari & The Skatalites"
        )

    def test_cartel_de_tres_con_grafia_curada(self):
        assert (
            concierto("Mukangu/Atake Mapale/ Los Yoryis", LATINO)
            == "Mukangu & Atake Mapalé & Los Yoryis"
        )

    def test_lista_con_comas_y_y(self):
        assert (
            concierto("Shing02, SPIN MASTER A-1 y Sam Nakamura en vivo en  Bogota", LATINO)
            == "Shing02 & Spin Master A-1 & Sam Nakamura"
        )

    def test_el_cartel_va_adelante_cuando_un_ciclo_presenta(self):
        assert (
            concierto("Festival Orígenes presenta Sara Curruchich y Humazapas", JEG)
            == "Sara Curruchich & Humazapas | Festival Orígenes"
        )


class TestAnioYDefectosDeLaFuente:
    def test_quita_el_anio_suelto(self):
        assert concierto("WWE Bogota 2026", MOVISTAR) == "WWE"

    def test_no_quita_un_anio_que_esta_en_la_gira(self):
        assert (
            concierto("Bloodbath | Sickening Latin America Tour 2026", LOURDES)
            == "Bloodbath | Sickening Latin America Tour 2026"
        )

    def test_colapsa_un_nombre_renderizado_dos_veces(self):
        assert concierto("BloodbathBloodbath", LOURDES) == "Bloodbath"

    def test_no_colapsa_un_nombre_que_se_repite_a_proposito(self):
        assert concierto("PABLOPABLO EN BOGOTÁ", ROCKAL) == "pablopablo"

    def test_quita_el_punto_colgando_de_una_fiesta(self):
        assert (
            fiesta("Poder Femenino En Latino power Noches Bomm.", LATINO)
            == "Poder Femenino Noches Bomm"
        )


class TestFiestas:
    def test_no_parte_el_nombre_del_ciclo(self):
        assert fiesta("THE JAZZ ROOM", ROYAL) == "The Jazz Room"
        assert fiesta("Que Chimba Puñeta Vol. 4", LATINO) == "Que Chimba Puñeta Vol. 4"


class TestLoQueSeCura:
    def test_dos_artistas_separados_por_guion(self):
        assert (
            concierto("Lenny Tavarez – J quiles", MOVISTAR)
            == "Lenny Tavárez & Justin Quiles | Superarte"
        )

    def test_la_gira_que_la_fuente_no_publica(self):
        assert concierto("Alvaro Diaz 2026", MOVISTAR) == "Álvaro Díaz | Omakase Tour"

    def test_el_titulo_al_reves(self):
        assert (
            concierto("10 AÑOS Y NO AZARAN - LA MUCHACHA EN BOGOTÁ", ROCKAL)
            == "La Muchacha | 10 Años y No Azaran"
        )

    def test_el_formato_del_show_pegado_al_nombre(self):
        assert concierto("RAYOS LASER ACÚSTICO EN BOGOTÁ", ROCKAL) == "Rayos Láser | Acústico"

    def test_un_ampersand_que_no_separa_artistas(self):
        assert (
            concierto("Carlos Vives & La Provincia Tour Al Sol", MOVISTAR)
            == "Carlos Vives & La Provincia | Tour al Sol"
        )

    def test_corrige_la_errata_de_la_sala(self):
        assert concierto("SLAUHGTER TO PREVAIL", ROYAL) == "Slaughter to Prevail"
        assert concierto("Mad Profesor", LOURDES) == "Mad Professor"
        assert concierto("Ky Mani Marley", LOURDES) == "Ky-Mani Marley"

    def test_la_grafia_sirve_para_cualquier_evento_del_mismo_artista(self):
        assert (
            concierto("5 SECONDS OF SUMMERS | EVERYONE´S A STAR! WORLD TOUR", MOVISTAR)
            == "5 Seconds of Summer | Everyone’s a Star! World Tour"
        )
        assert concierto("5 Seconds of Summers en Bogotá", MOVISTAR) == "5 Seconds of Summer"


class TestListasCuradas:
    """El mismo contrato de todas las listas curadas: nada entra sin una fuente
    consultable escrita al lado."""

    def test_cada_grafia_deja_escrito_de_donde_salio(self):
        for g in GRAFIAS:
            assert len(g.evidencia) > 60, g.nombre

    def test_cada_grafia_cambia_algo(self):
        for g in GRAFIAS:
            assert g.como_lo_publican != g.nombre

    def test_no_hay_grafias_repetidas(self):
        claves = [clave_de_titulo(g.como_lo_publican) for g in GRAFIAS]
        assert len(set(claves)) == len(claves)

    def test_cada_titulo_deja_escrito_de_donde_salio(self):
        for t in TITULOS:
            assert len(t.evidencia) > 60, t.como_lo_publican

    def test_cada_titulo_nombra_al_menos_un_artista(self):
        for t in TITULOS:
            assert t.artistas
            assert all(a.strip() == a and a for a in t.artistas)

    def test_la_gira_es_un_nombre_o_es_none(self):
        # "No sé" y "confirmado que no hay gira" son estados distintos; una
        # cadena vacía los colapsa y deja una barra colgando.
        for t in TITULOS:
            assert t.gira is None or t.gira.strip()

    def test_no_hay_titulos_repetidos(self):
        claves = [clave_de_titulo(t.como_lo_publican) for t in TITULOS]
        assert len(set(claves)) == len(claves)


class TestSeparadorColgando:
    """Encontrado el 2026-08-31 al sumar visitbogota, que titula así varios
    de sus eventos: el lugar viene justo antes de la barra."""

    def test_no_deja_dos_barras_seguidas(self):
        assert (
            concierto(
                "XXXIV Congreso Internacional AEDEM 2026 en Bogotá | Economía, innovación",
                MOVISTAR,
            )
            == "XXXIV Congreso Internacional AEDEM 2026 | Economía, Innovación"
        )

    def test_tambien_con_guion_y_dos_puntos(self):
        assert concierto("Nombre en Bogotá - La Gira", MOVISTAR) == "Nombre | La Gira"
        assert concierto("Nombre en Bogotá: La Gira", MOVISTAR) == "Nombre | La Gira"

    def test_no_toca_la_gira_que_venia_bien(self):
        # El caso normal no cambia: "con el" sigue abriendo la gira.
        assert (
            concierto("Gustavo Santaolalla llega a Bogotá con el Ronroco Tour", JEG)
            == "Gustavo Santaolalla | Ronroco Tour"
        )


class TestTituloPartido:
    """Las piezas del título dejan de botarse (2026-09-15).

    `normalizar_titulo` siempre calculó la lista de artistas y la gira para
    poder armar el texto; `partir_titulo` es la misma función devolviendo las
    tres cosas. El texto tiene que salir idéntico —eso lo cubren los tests de
    arriba, que siguen llamando a `normalizar_titulo`— y acá se verifica lo
    que antes se perdía.
    """

    def test_devuelve_los_artistas_del_cartel_por_separado(self):
        partido = partir_titulo("Mukangu/Atake Mapale/ Los Yoryis", "music", LATINO)
        # La tilde de "Mapalé" la pone la lista de grafías curadas, y la
        # lista la hereda: los nombres salen ya escritos como se escriben.
        assert partido.artistas == ("Mukangu", "Atake Mapalé", "Los Yoryis")
        assert partido.gira is None
        # El texto sigue siendo el de siempre: esto es aditivo.
        assert partido.titulo == "Mukangu & Atake Mapalé & Los Yoryis"

    def test_separa_la_gira_del_cartel(self):
        partido = partir_titulo("Gustavo Santaolalla llega a Bogotá con el Ronroco Tour", "music", JEG)
        assert partido.artistas == ("Gustavo Santaolalla",)
        assert partido.gira == "Ronroco Tour"

    def test_un_solo_artista_tambien_entra_a_la_lista(self):
        # Con un nombre la pantalla muestra `title` igual, pero la lista sirve
        # para armar el cartel de un clic, que es de donde sale el directorio.
        partido = partir_titulo("AKRIILA EN BOGOTÁ", "music", ROCKAL)
        assert partido.artistas == ("Akriila",)

    def test_el_ampersand_curado_no_parte_a_nadie(self):
        """⚠️ El contraejemplo que decide el diseño entero.

        "Carlos Vives & La Provincia" está curado como **un** artista, con
        evidencia: ese "&" no separa dos actos, nombra a un artista con su
        banda. Por eso la lista no se puede recuperar partiendo el título
        publicado por " & " al mostrarlo, y por eso existe esta columna.

        Si este test se cae, alguien reintrodujo el atajo.
        """
        partido = partir_titulo("Carlos Vives & La Provincia Tour Al Sol", "music", MOVISTAR)
        assert partido.artistas == ("Carlos Vives & La Provincia",)
        assert partido.titulo == "Carlos Vives & La Provincia | Tour al Sol"

    def test_una_fiesta_no_tiene_artistas_de_cartel(self):
        partido = partir_titulo("Poder Femenino Noches Bomm.", "fiesta", LATINO)
        assert partido.artistas == ()
        assert partido.gira is None

    def test_un_festival_tampoco(self):
        """Y no es un hueco: quiénes de la escena tocan en un festival es un
        juicio editorial que se anota en el cartel, no algo que un separador
        de texto pueda sacar del nombre del festival."""
        partido = partir_titulo("Rock al Parque 2026", "festival", None)
        assert partido.artistas == ()
        assert partido.titulo == "Rock al Parque 2026"

    def test_partir_el_titulo_publicado_por_ampersand_da_mal(self):
        """El mismo caso, comprobado al revés: con el atajo puesto.

        Un test que solo afirma lo correcto no impide que alguien vuelva a
        "recuperar la lista partiendo el título por &, que total el & lo
        ponemos nosotros". Así que acá se hace exactamente eso y se deja ver
        que inventa un artista que no existe.
        """
        partido = partir_titulo("Carlos Vives & La Provincia Tour Al Sol", "music", MOVISTAR)
        atajo = partido.titulo.split(" | ")[0].split(" & ")
        assert atajo == ["Carlos Vives", "La Provincia"]  # dos, y son uno
        assert partido.artistas == ("Carlos Vives & La Provincia",)
