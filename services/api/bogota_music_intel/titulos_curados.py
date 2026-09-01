"""Cómo se escriben de verdad los artistas y los shows, cuando la sala los
publica mal o de una forma que ninguna regla honesta puede desarmar.

Es el equivalente de `artistas_locales.py` para el título. Las reglas de
`titulos.py` corrigen lo que es estructura (mayúsculas gritadas, "en Bogotá"
al final, varios artistas separados por barras); acá va solo lo que exige
saber algo que el título no dice.

**Vivía en el frontend** (`apps/web/src/lib/titulosCurados.ts`) hasta el
2026-08-31, cuando la normalización se movió a la ingesta: el título que se
guarda pasó a ser el que se publica, así que la lista tiene que estar donde
se guarda y no donde se muestra.

Dos niveles, y el más general va primero:

1. `GRAFIAS` — cómo se escribe un artista. La clave es el nombre del
   artista, no el título del evento, así que el arreglo sirve para
   cualquier evento futuro de ese mismo artista, lo publique quien lo
   publique. Es el nivel a preferir siempre que alcance.

2. `TITULOS` — el título entero, cuando el problema es de estructura y no
   de ortografía: el nombre de la gira que la fuente no publica, el orden
   invertido (gira primero, artista después), dos artistas separados por
   un guion que la regla lee como gira. La clave es el título crudo
   exacto, así que si la sala cambia una coma la entrada deja de
   engancharse — mismo riesgo que `blocked_source_events`, y por eso solo
   se usa cuando `GRAFIAS` no alcanza.

Reglas para agregar una entrada:
1. La grafía o el nombre de la gira tiene que venir de una fuente
   consultable —la página del evento, el sitio del artista, una nota de
   prensa—, nunca de memoria ni deducida del nombre.
2. Dejar escrito en `evidencia` de dónde salió y cuándo se verificó.
3. Ante la duda, no agregarla: el título se muestra como lo publicó la
   fuente, que es feo pero no miente. Y ahora hay una salida mejor que
   antes — el admin lo corrige a mano en la cola de moderación, que es
   justamente para lo que existe.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class GrafiaCurada:
    """Cómo se escribe un artista, cuando la fuente lo escribe mal."""

    como_lo_publican: str
    nombre: str
    evidencia: str


GRAFIAS: list[GrafiaCurada] = [
    GrafiaCurada(
        como_lo_publican="5 Seconds of Summers",
        nombre="5 Seconds of Summer",
        evidencia=(
            "La banda australiana se llama '5 Seconds of Summer', en singular: "
            "así la nombran Wikipedia ('Everyone's a Star! World Tour'), Songkick "
            "(Movistar Arena, 24 sep 2026) y Live Nation. Movistar Arena y "
            "Tuboleta publican 'SUMMERS' — Tuboleta tiene incluso las dos fichas, "
            "una con cada grafía. Verificado 2026-08-31."
        ),
    ),
    GrafiaCurada(
        como_lo_publican="Slauhgter to Prevail",
        nombre="Slaughter to Prevail",
        evidencia=(
            "Errata del Royal Center, que publica 'SLAUHGTER TO PREVAIL'. Ya "
            "estaba registrada en artistas_locales.py como `tambien_como` de "
            "'Slaughter to Prevail'."
        ),
    ),
    GrafiaCurada(
        como_lo_publican="Mad Profesor",
        nombre="Mad Professor",
        evidencia=(
            "El productor de dub jamaicano-británico es 'Mad Professor', con dos "
            "eses. Lourdes Music Hall lo publica con una. Confirmado en la "
            "cobertura de la temporada 2026 de la sala (musicaindependienteperu.com, "
            "myrockshows.com/place/51659-lourdes-music-hall). Verificado 2026-08-31."
        ),
    ),
    GrafiaCurada(
        como_lo_publican="Ky Mani Marley",
        nombre="Ky-Mani Marley",
        evidencia=(
            "Lleva guion: así lo escriben Wikipedia (en.wikipedia.org/wiki/Ky-Mani_Marley) "
            "y Concert Archives. Lourdes Music Hall lo publica sin guion. "
            "Verificado 2026-08-31."
        ),
    ),
    GrafiaCurada(
        como_lo_publican="Pablopablo",
        nombre="pablopablo",
        evidencia=(
            "Se estiliza en minúscula. Rockal Live lo publica en mayúscula "
            "sostenida ('PABLOPABLO EN BOGOTÁ'), que la regla de mayúsculas "
            "convierte en 'Pablopablo'. Ya está escrito así en "
            "artistas_locales.py (Pablo Drexler, escena alternativa española)."
        ),
    ),
    GrafiaCurada(
        como_lo_publican="Atake Mapale",
        nombre="Atake Mapalé",
        evidencia=(
            "Lleva tilde. Latino Power lo publica sin ella "
            "('Mukangu/Atake Mapale/ Los Yoryis'). Ya está con tilde y con su "
            "evidencia en artistas_locales.py."
        ),
    ),
    GrafiaCurada(
        como_lo_publican="Alvaro Diaz",
        nombre="Álvaro Díaz",
        evidencia=(
            "El rapero puertorriqueño lleva las dos tildes: así lo escriben El "
            "Tiempo, Canal Trece y Publimetro Colombia al cubrir sus dos fechas "
            "en el Movistar Arena. La sala lo publica sin tildes. Verificado "
            "2026-08-31."
        ),
    ),
]


@dataclass(frozen=True)
class TituloCurado:
    """Un título entero que ninguna regla puede desarmar bien."""

    como_lo_publican: str
    artistas: tuple[str, ...]
    gira: str | None
    evidencia: str


TITULOS: list[TituloCurado] = [
    TituloCurado(
        como_lo_publican="Alvaro Diaz 2026",
        artistas=("Álvaro Díaz",),
        gira="Omakase Tour",
        evidencia=(
            "El Movistar Arena titula el evento con el año y no con la gira, pero "
            "el botón de compra de esa misma página apunta a "
            "tuboleta.com/es/eventos/alvaro-diaz-omakase-tour, cuya ficha se "
            "titula 'ALVARO DIAZ | OMAKASE TOUR'. El Tiempo, Canal Trece, "
            "Publimetro y Minuto30 lo cubren como 'OMAKASE Tour', la gira del "
            "álbum 'Omakase'. Verificado 2026-08-31."
        ),
    ),
    TituloCurado(
        como_lo_publican="10 AÑOS Y NO AZARAN - LA MUCHACHA EN BOGOTÁ",
        artistas=("La Muchacha",),
        gira="10 Años y No Azaran",
        evidencia=(
            "Viene al revés: el guion separa la gira del artista, no el artista "
            "de la gira. La artista es La Muchacha (Isabel Ramírez, cantautora "
            "colombiana; en.wikipedia.org/wiki/La_Muchacha) y '10 años y no "
            "azaran' es el nombre del show, por su disco 'No azaran'. La ficha "
            "de Rockal Live en eTicketaBlanca lo programa en el Teatro Libre "
            "Sede Centro. Verificado 2026-08-31."
        ),
    ),
    TituloCurado(
        como_lo_publican="RAYOS LASER ACÚSTICO EN BOGOTÁ",
        artistas=("Rayos Láser",),
        gira="Acústico",
        evidencia=(
            "'Acústico' es el formato del show, no parte del nombre: la banda es "
            "Rayos Láser, con tilde, de Villa María (Córdoba, Argentina), y viene "
            "con su gira de shows acústicos —los mismos que dio en Buenos Aires y "
            "Córdoba antes de la fecha de Bogotá— según Songkick, Bandsintown y "
            "su propia cuenta (@rayoslaser). Rockal Live lo publica todo pegado y "
            "sin tilde. Verificado 2026-08-31."
        ),
    ),
    TituloCurado(
        como_lo_publican="Lenny Tavarez – J quiles",
        artistas=("Lenny Tavárez", "Justin Quiles"),
        gira="Superarte",
        evidencia=(
            "Son dos artistas, no un artista y su gira: el guion del Movistar "
            "Arena separa el cartel. Infobae, Canal Trece y El Frente los cubren "
            "como 'Lenny Tavárez y Justin Quiles', gira conjunta en el Movistar "
            "Arena el 11 de septiembre de 2026; Minuto30 y Área Cúcuta nombran la "
            "gira: 'SUPERARTE', por el álbum colaborativo del mismo nombre. "
            "Verificado 2026-08-31."
        ),
    ),
    TituloCurado(
        como_lo_publican="Carlos Vives & La Provincia Tour Al Sol",
        artistas=("Carlos Vives & La Provincia",),
        gira="Tour al Sol",
        evidencia=(
            "Acá el '&' no separa dos artistas: 'Carlos Vives y La Provincia' es "
            "el nombre del proyecto desde 'La Tierra del Olvido'. Y la gira viene "
            "pegada al nombre sin ningún separador. Tuboleta lo publica ya "
            "partido: 'Carlos Vives & la Provincia | Tour Al Sol'; su cuenta "
            "oficial anuncia «Carlos Vives y La Provincia llegan al Movistar "
            "Arena el 25 y 27 de septiembre» con el 'Tour al Sol 2026'. "
            "Verificado 2026-08-31."
        ),
    ),
]
