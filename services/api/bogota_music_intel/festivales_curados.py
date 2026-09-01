"""Festivales verificados a mano, por nombre.

Un festival comparte con la fiesta lo que lo separa del concierto: **no hay
un artista de cartel al que preguntarle de dónde es**. Pero no es lo mismo
—una fiesta es la sala programándose una noche; un festival son varios días
en un parque con decenas de bandas—, y por eso va en su propia pestaña y no
mezclado con las noches de club.

⚠️ **Acá el emparejamiento es por título completo, no por subcadena**, y esa
es la diferencia importante con `ciclos_curados.py`. El motivo está en la
base: el Teatro Jorge Eliécer Gaitán publica

    "Festival Orígenes presenta Sara Curruchich y Humazapas"

que **no es el festival, es un concierto dentro del festival** — tiene dos
artistas nombrados y MusicBrainz los resuelve. Si "Festival Orígenes" se
buscara como subcadena, ese concierto perdería su cartel y su origen.

La regla que sale de ahí, y que hay que respetar al agregar entradas: un
festival se reconoce cuando **el título es el nombre del festival y nada
más** (con o sin el año). En cuanto el título nombra a quién toca, es un
concierto — aunque ocurra dentro de un festival.

Reglas para agregar una entrada:
1. Verificar en la fuente que es un festival de varios artistas, no un show.
   La descripción de la ficha suele decirlo con todas las letras.
2. Dejar escrito en `evidencia` cómo se verificó, con la fuente consultable.
3. Ante la duda, no agregarlo: queda como concierto, que es el estado por
   defecto y no esconde nada.

Lo que no está acá se marca a mano desde `/admin` → "Qué es" → festival.
"""
import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class FestivalCurado:
    nombre: str
    evidencia: str


FESTIVALES: list[FestivalCurado] = [
    FestivalCurado(
        nombre="Rock al Parque",
        evidencia=(
            "Festival distrital gratuito en el Parque Metropolitano Simón "
            "Bolívar. La ficha de visitbogota lo llama «el festival gratuito "
            "de rock más grande de América Latina» y anuncia tres días "
            "(10, 11 y 12 de octubre de 2026) con «reconocidas agrupaciones "
            "nacionales e internacionales». Sin artista de cartel en el "
            "título. Verificado 2026-09-01 en "
            "visitbogota.co/es/agenda-de-eventos/rock-al-parque-2026."
        ),
    ),
    FestivalCurado(
        nombre="Salsa al Parque",
        evidencia=(
            "Festival distrital gratuito, edición 27, dos días (28 y 29 de "
            "noviembre de 2026) en el Parque Metropolitano Simón Bolívar. La "
            "ficha lo describe como «uno de los festivales gratuitos más "
            "importantes dedicados a este género en América Latina». "
            "Verificado 2026-09-01 en "
            "visitbogota.co/es/agenda-de-eventos/salsa-al-parque-2026."
        ),
    ),
    FestivalCurado(
        nombre="Jazz al Parque",
        evidencia=(
            "Festival distrital gratuito de dos jornadas (12 y 13 de "
            "septiembre de 2026) que reúne «destacados músicos nacionales e "
            "internacionales», según la ficha. Verificado 2026-09-01 en "
            "visitbogota.co/es/agenda-de-eventos/jazz-al-parque-2026. "
            "⚠️ La ficha se contradice sobre la sede: el título y el campo de "
            "lugar dicen Parque el Country y el cuerpo dice Simón Bolívar. "
            "No se resuelve acá — la sala sale de la fuente, no de esta lista."
        ),
    ),
    FestivalCurado(
        nombre="Hip Hop al Parque",
        evidencia=(
            "Festival distrital gratuito de dos jornadas (24 y 25 de octubre "
            "de 2026) en el Parque Metropolitano Simón Bolívar, descrito en "
            "la ficha como «uno de los festivales gratuitos de cultura urbana "
            "más importantes de América Latina». Verificado 2026-09-01 en "
            "visitbogota.co/es/agenda-de-eventos/hip-hop-al-parque-2026."
        ),
    ),
    FestivalCurado(
        nombre="Festival Cordillera",
        evidencia=(
            "Festival de dos días (12 y 13 de septiembre de 2026) en el "
            "Parque Metropolitano Simón Bolívar. La ficha habla de «un cartel "
            "que reúne a grandes» artistas bajo el lema «El futuro es "
            "latino», sin nombrar uno en el título. Verificado 2026-09-01 en "
            "visitbogota.co/es/agenda-de-eventos/festival-cordillera-2026."
        ),
    ),
    FestivalCurado(
        nombre="Todos Somos Ángeles Rock Fest",
        evidencia=(
            "Jornada de rock en español en el Movistar Arena. La ficha la "
            "llama «un encuentro que reunirá sobre el escenario a figuras "
            "representativas de diferentes generaciones del género» y nombra "
            "a Ángeles del Infierno entre varios; el título no anuncia un "
            "cartel sino el nombre del encuentro. Es el caso más discutible "
            "de esta lista —un solo día y en una sala, no en un parque—, "
            "pero comparte lo que define la categoría: varios artistas y "
            "ninguno de cartel. Verificado 2026-09-01 en "
            "visitbogota.co/es/agenda-de-eventos/todos-somos-angeles-rock-fest."
        ),
    ),
]


def _normalizar(texto: str) -> str:
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", sin_acentos.casefold())).strip()


# El año de la edición: "Rock al Parque 2026" y "Rock al Parque" son el mismo
# festival, así que se ignora al comparar y la edición siguiente entra sola
# —igual que "Vol. 5" en los ciclos—. Solo al final del título: un año en el
# medio es parte del nombre, no la edición.
_ANIO_FINAL = re.compile(r"\s+(?:19|20)\d{2}$")


def festival_de(title: str) -> FestivalCurado | None:
    """Devuelve el festival si el título ES su nombre, o None.

    **Compara el título entero**, no busca subcadena. Un título que además
    nombra artistas ("Festival Orígenes presenta Sara Curruchich y
    Humazapas") es un concierto dentro del festival y no matchea, que es
    justamente lo que se quiere: ese sí tiene a quién preguntarle el origen.
    """
    normalizado = _ANIO_FINAL.sub("", _normalizar(title))
    for festival in FESTIVALES:
        if _normalizar(festival.nombre) == normalizado:
            return festival
    return None
