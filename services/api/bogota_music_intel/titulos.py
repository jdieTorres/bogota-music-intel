"""Convierte el título crudo de una sala en el título que se publica.

**Corre en la ingesta, no al mostrar.** Se aplica cuando el cron abre el
borrador, así que lo que el admin ve en la cola de moderación es exactamente
lo que va a salir publicado: puede corregirlo, y su corrección no la pisa
ninguna transformación posterior.

Vivía en el frontend (`apps/web/src/lib/tituloEvento.ts`) hasta el
2026-08-31, y ahí estaba mal ubicado: el admin editaba el título crudo
mientras el visitante veía otro. Lo notó Juan mirando la pantalla de
moderación. Mover esto a la ingesta es lo que hace que "el título guardado
es el título publicado" sea cierto.

Reglas, pedidas por Juan:
- Concierto: "Artista | Gira", o solo "Artista" si no hay gira.
- Varios artistas de cartel se separan con " & ", no con "|": la barra es
  para lo que viene *después* del artista.
- Fiesta: el nombre completo del ciclo, sin partir nada.
- El ruido de la sala —"en Bogotá", "llega al Teatro X"— no es parte del
  nombre de nadie y se quita.

Lo que NO se hace acá: adivinar. Cuando el título no alcanza para saber si
"ACÚSTICO" es parte del nombre de la banda o el formato del show, o cuándo
un guion separa dos artistas en vez de un artista y su gira, la respuesta se
cura a mano con evidencia en `titulos_curados.py`. Las reglas de este
archivo se mantienen estrechas a propósito — y ahora hay una red más: lo que
se les escape lo corrige el admin antes de publicar.
"""
import re
import unicodedata

from bogota_music_intel.titulos_curados import GRAFIAS, TITULOS

# ---------------------------------------------------------------------------
# Limpieza de texto
# ---------------------------------------------------------------------------

_APOSTROFOS = re.compile(r"[´`‘’ʼ]")
_RAYAS = re.compile(r"[–—―]")


def unificar_signos(texto: str) -> str:
    """Unifica los signos que cada sala escribe distinto, para que las reglas
    y las listas curadas no tengan que contemplar cada variante. El apóstrofo
    se normaliza al tipográfico porque el título es texto de display."""
    texto = _APOSTROFOS.sub("’", texto)
    texto = _RAYAS.sub("-", texto)
    return " ".join(texto.split())


def _sin_acentos(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


def clave_de_titulo(texto: str) -> str:
    """Clave de comparación: sin acentos, sin mayúsculas, sin signos raros.
    Es lo que usan las listas curadas para engancharse con lo que publica la
    fuente sin depender de cómo lo escribió."""
    return _sin_acentos(unificar_signos(texto)).lower()


_GRAFIAS_POR_CLAVE = {clave_de_titulo(g.como_lo_publican): g.nombre for g in GRAFIAS}
_TITULOS_POR_CLAVE = {clave_de_titulo(t.como_lo_publican): t for t in TITULOS}

# ---------------------------------------------------------------------------
# Mayúsculas
# ---------------------------------------------------------------------------

# Conectores en español e inglés que se dejan en minúscula cuando no abren
# el título, para que "Fiesta de la Salsa" no quede "Fiesta De La Salsa".
CONECTORES = {
    "de", "del", "la", "las", "el", "los", "y", "o", "en", "a", "con", "para",
    "por", "un", "una", "al", "e", "of", "the", "and", "in", "on", "at", "to",
    "for",
}


def _tiene(texto: str, categoria: str) -> bool:
    return any(unicodedata.category(c) == categoria for c in texto)


def _tiene_minuscula(texto: str) -> bool:
    return _tiene(texto, "Ll")


def _tiene_mayuscula(texto: str) -> bool:
    return _tiene(texto, "Lu")


def _tiene_letra(texto: str) -> bool:
    return any(c.isalpha() for c in texto)


def _tiene_digito(texto: str) -> bool:
    return any(c.isdigit() for c in texto)


def _capitalizar(palabra: str) -> str:
    """Sube la primera letra y baja el resto. `str.capitalize()` no sirve:
    rompe con un título que empieza por comilla o por número."""
    bajada = palabra.lower()
    for i, c in enumerate(bajada):
        if c.isalpha():
            return bajada[:i] + c.upper() + bajada[i + 1 :]
    return bajada


def es_grito(texto: str) -> bool:
    """¿La fuente escribió esto en mayúscula sostenida?"""
    return _tiene_letra(texto) and not _tiene_minuscula(texto)


def _marcar_rafagas(palabras: list[str]) -> list[bool]:
    """Marca las palabras que forman parte de una ráfaga en mayúscula dentro
    de un título que por lo demás está en caja mixta: "Shing02, SPIN MASTER
    A-1 y Sam Nakamura". Dos o más mayúsculas seguidas son la fuente gritando
    un pedazo; una sola y aislada es una sigla que hay que dejar quieta (WWE).
    """
    sostenida = [
        _tiene_letra(p) and not _tiene_digito(p) and not _tiene_minuscula(p)
        for p in palabras
    ]
    return [
        esta
        and (
            (i > 0 and sostenida[i - 1])
            or (i + 1 < len(sostenida) and sostenida[i + 1])
        )
        for i, esta in enumerate(sostenida)
    ]


def titulo_caso(texto: str, grita: bool | None = None) -> str:
    """"ROBBIE WILLIAMS" -> "Robbie Williams", pero "Lucho Al Attaque" se
    queda como está.

    La regla es asimétrica a propósito: **solo sube mayúsculas, nunca las
    baja**, salvo que la fuente esté gritando el título entero. Una sala que
    escribe en mayúscula sostenida no está diciendo nada sobre el nombre del
    artista, así que ahí sí se rearma todo; pero si escribió "Lucho Al
    Attaque" con la 'A' grande, esa mayúscula es información y bajarla sería
    inventar. El caso que lo enseñó al revés: "Todos tus muertos" —minúsculas
    que sí hay que subir— y "El plan de la mariposa".

    `grita` se calcula sobre el título entero y no sobre el fragmento, para
    que "BRITPOP" dentro de "ROBBIE WILLIAMS | BRITPOP" se trate como grito y
    no como sigla.
    """
    if grita is None:
        grita = es_grito(texto)

    palabras = [p for p in unificar_signos(texto).split(" ") if p]
    gritadas = [True] * len(palabras) if grita else _marcar_rafagas(palabras)

    salida = []
    for i, palabra in enumerate(palabras):
        # Una palabra que mezcla letras y dígitos es una estilización, no una
        # palabra gritada: "MADE4RAP", "A-1". Rearmarla la arruina.
        if _tiene_digito(palabra) and _tiene_letra(palabra):
            salida.append(palabra)
            continue
        # Mayúscula puesta a mano por la fuente: se respeta.
        if not gritadas[i] and _tiene_mayuscula(palabra):
            salida.append(palabra)
            continue
        base = palabra.lower()
        salida.append(base if i > 0 and base in CONECTORES else _capitalizar(palabra))
    return " ".join(salida)


# ---------------------------------------------------------------------------
# Ruido de sala y de ciudad
# ---------------------------------------------------------------------------

# Lo que antecede al nombre de una sala o de la ciudad cuando la sala lo pega
# al título: "AKRIILA EN BOGOTÁ", "Blonde Redhead llega al Teatro Jorge
# Eliécer Gaitán", "Shing02 ... en vivo en Bogota".
_ANCLA_DE_LUGAR = re.compile(
    r"\s+(?:lleg(?:a|an)\s+a(?:l)?|en\s+vivo\s+en|en\s+directo\s+en|desde|en)"
    r"\s+(?:el\s+|la\s+|los\s+|las\s+)?",
    re.IGNORECASE,
)

# Lo que introduce la gira cuando viene después del lugar: "llega a Bogotá
# con el Ronroco Tour".
_ANTES_DE_LA_GIRA = re.compile(r"^con\s+(?:el\s+|la\s+|los\s+|las\s+)?", re.IGNORECASE)

# Un separador que quedó colgando al principio de la cola. Pasa cuando el
# lugar viene justo antes de la barra: "…AEDEM 2026 en Bogotá | Economía…"
# deja la cola como "| Economía…", y al volver a unir con " | " el título
# salía con dos barras seguidas. Encontrado el 2026-08-31 al sumar
# visitbogota, que titula así varios de sus eventos.
_SEPARADOR_COLGANDO = re.compile(r"^[|:\-–—]+\s*")

CIUDAD = ("bogota", "colombia")

_NO_ALFANUM = re.compile(r"[^0-9a-záéíóúüñ]", re.IGNORECASE)


def _palabras_de_lugar(sala: str | None) -> set[str]:
    """El vocabulario que cuenta como "lugar" para este evento: la ciudad y
    las palabras del nombre de su sala. Fuera de esa lista no se borra nada —
    sin esto, "en vivo" o "en concierto" se llevarían medio título."""
    palabras = set(CIUDAD)
    palabras.update(p for p in clave_de_titulo(sala or "").split(" ") if p)
    return palabras


def _clave_de_palabra(palabra: str) -> str:
    return _NO_ALFANUM.sub("", clave_de_titulo(palabra))


def _largo_de_la_rafaga(palabras: list[str], lugar: set[str]) -> int:
    """Cuántas palabras seguidas nombran el lugar. Deja pasar conectores en
    el medio ("Teatro Libre de Bogotá") pero exige al menos una palabra que
    sí nombre el lugar, y no se lleva los conectores del final: en "llega a
    Bogotá con el Ronroco Tour", el "con el" abre la gira, no cierra el
    lugar."""
    fin = 0
    ultimo_concreto = -1
    while fin < len(palabras):
        clave = _clave_de_palabra(palabras[fin])
        if clave in lugar:
            ultimo_concreto = fin
        elif clave not in CONECTORES:
            break
        fin += 1
    return ultimo_concreto + 1


def quitar_ruido_de_lugar(titulo: str, sala: str | None) -> tuple[str, str]:
    """Parte el título en lo que queda después de quitarle el lugar y lo que
    venía detrás del lugar, que casi siempre es la gira: "Todo copas en
    Latino Power Bogota 20 Años" -> ("Todo copas", "20 Años")."""
    lugar = _palabras_de_lugar(sala)
    palabras = titulo.split(" ")

    # 1. El lugar anunciado con preposición, en cualquier punto del título.
    for coincidencia in _ANCLA_DE_LUGAR.finditer(titulo):
        if coincidencia.start() == 0:
            continue
        antes = titulo[: coincidencia.start()].strip()
        resto = titulo[coincidencia.end() :].strip()
        if not antes or not resto:
            continue

        resto_en_palabras = resto.split(" ")
        largo = _largo_de_la_rafaga(resto_en_palabras, lugar)
        if largo == 0:
            continue

        cola = " ".join(resto_en_palabras[largo:])
        cola = _SEPARADOR_COLGANDO.sub("", _ANTES_DE_LA_GIRA.sub("", cola))
        return antes, cola.strip()

    # 2. El lugar pegado al final sin preposición: "MADE4RAP BOGOTÁ".
    fin = len(palabras)
    while fin > 1 and clave_de_titulo(palabras[fin - 1]) in lugar:
        fin -= 1
    if fin < len(palabras):
        return " ".join(palabras[:fin]), ""

    return titulo, ""


_ANIO_FINAL = re.compile(r"^20\d\d$")


def _quitar_anio_final(titulo: str) -> str:
    """El año suelto al final, que es como el Movistar Arena desambigua sus
    fichas ("Alvaro Diaz 2026", "WWE Bogota 2026") y no parte del nombre. No
    se toca si el título ya trae separador: ahí el año está dentro del nombre
    de la gira ("… | Sickening Latin America Tour 2026")."""
    if _SEPARADOR_DE_GIRA.search(titulo):
        return titulo
    palabras = titulo.split(" ")
    if len(palabras) < 2 or not _ANIO_FINAL.match(palabras[-1]):
        return titulo
    return " ".join(palabras[:-1])


def _colapsar_duplicado(titulo: str) -> str:
    """"BloodbathBloodbath" -> "Bloodbath". Es un defecto de render de la
    fuente, no una estilización. Solo se colapsa cuando el corte deja ver la
    costura —minúscula pegada a mayúscula—, para no romper un nombre que
    repite a propósito: "PABLOPABLO" es "PABLO"+"PABLO" y no se toca."""
    if len(titulo) % 2 != 0:
        return titulo
    mitad = len(titulo) // 2
    izquierda = titulo[:mitad]
    if izquierda != titulo[mitad:]:
        return titulo
    costura = _tiene_minuscula(izquierda[-1]) and _tiene_mayuscula(izquierda[0])
    return izquierda if costura else titulo


# ---------------------------------------------------------------------------
# Artista, artistas y gira
# ---------------------------------------------------------------------------

# Separadores que en la práctica separan "artista" de "gira/subtítulo":
# "ROBBIE WILLIAMS | BRITPOP", "AKRIILA - TOUR LUCY", "Inspector: 30
# Aniversario". El guion exige espacios alrededor para no partir "Jay-Z".
#
# Ojo: un guion también puede separar dos artistas ("Lenny Tavarez – J
# quiles"). No hay señal honesta en el texto para distinguir los dos casos
# —"BRITPOP" y "J quiles" se ven igual—, así que el caso frecuente (gira) es
# la regla y el otro se cura por título en `titulos_curados.py`.
_SEPARADOR_DE_GIRA = re.compile(r"\s*[|:]\s*|\s+-+\s+")

# "Festival Orígenes presenta Sara Curruchich y Humazapas": el ciclo anuncia
# y los artistas vienen después. Se invierte para que el cartel quede
# primero, que es lo que la plataforma promueve.
_PRESENTA = re.compile(r"^(.+?)\s+presentan?\s+(.+)$", re.IGNORECASE)

_SEPARADOR_DE_ARTISTAS = re.compile(r"\s+(?:y|e|and)\s+", re.IGNORECASE)


def partir_artista_y_gira(titulo: str) -> tuple[str, str | None]:
    """Parte un título en artista + gira por el primer separador que
    encuentre. Si no hay separador, o si algún lado queda vacío, el título
    entero se trata como el nombre del artista — no hay gira que inventar."""
    limpio = unificar_signos(titulo)
    coincidencia = _SEPARADOR_DE_GIRA.search(limpio)
    if not coincidencia:
        return limpio, None

    antes = limpio[: coincidencia.start()].strip()
    despues = limpio[coincidencia.end() :].strip()
    if not antes or not despues:
        return limpio, None
    return antes, despues


def partir_artistas(texto: str, es_cartel: bool = False) -> list[str]:
    """Separa un cartel de varios artistas: "Mukangu/Atake Mapale/ Los
    Yoryis", "Shing02, SPIN MASTER A-1 y Sam Nakamura".

    Conservador a propósito. La barra solo parte si todos los pedazos quedan
    con 4 caracteres o más, que es lo que salva a "AC/DC". Y la "y" solo
    parte cuando el título ya venía marcado como lista por una coma o una
    barra: sin ese requisito, "10 AÑOS Y NO AZARAN" se convertiría en dos
    artistas inexistentes.
    """
    piezas = [texto.strip()]

    if "/" in texto:
        por_barra = [p.strip() for p in texto.split("/")]
        if len(por_barra) > 1 and all(len(p) >= 4 for p in por_barra):
            piezas = por_barra

    if "," in texto:
        piezas = [q.strip() for p in piezas for q in p.split(",") if q.strip()]

    if len(piezas) > 1 or es_cartel:
        piezas = [q.strip() for p in piezas for q in _SEPARADOR_DE_ARTISTAS.split(p)]

    return [p for p in piezas if p]


def _nombre_de_artista(texto: str, grita: bool) -> str:
    formateado = titulo_caso(texto, grita)
    return _GRAFIAS_POR_CLAVE.get(clave_de_titulo(formateado), formateado)


_PUNTO_FINAL = re.compile(r"\.\s*$")


def _quitar_punto_final(texto: str) -> str:
    """"Poder Femenino Noches Bomm." -> sin el punto colgando. No toca las
    abreviaturas ("Vol. 4"), que nunca quedan al final."""
    return _PUNTO_FINAL.sub("", texto).strip()


def _unir(artistas: list[str], gira: str | None) -> str:
    cartel = " & ".join(artistas)
    return f"{cartel} | {gira}" if gira else cartel


def normalizar_titulo(crudo: str, event_type: str | None = None, sala: str | None = None) -> str:
    """El título tal como se va a publicar.

    `sala` es el nombre de la sala del evento, si se conoce: sirve para poder
    quitar el "en <sala>" que varias fuentes le pegan al título. Sin él se
    quita igual el nombre de la ciudad, que es el caso más común.
    """
    limpio = unificar_signos(crudo)

    curado = _TITULOS_POR_CLAVE.get(clave_de_titulo(limpio))
    if curado:
        return _unir(list(curado.artistas), curado.gira)

    grita = es_grito(limpio)
    es_fiesta = event_type == "fiesta"

    # El año va antes que el lugar: en "WWE Bogota 2026" la ciudad queda al
    # descubierto recién cuando se quita el año. En una fiesta no se quita —
    # ahí el año puede ser el nombre de la edición.
    base = _colapsar_duplicado(limpio)
    cuerpo, cola = quitar_ruido_de_lugar(base if es_fiesta else _quitar_anio_final(base), sala)

    # Una fiesta no tiene artista de cartel que separar de una gira: el
    # nombre del ciclo es todo el título. Solo se le quita el ruido de sala.
    if es_fiesta:
        return titulo_caso(_quitar_punto_final(f"{cuerpo} {cola}".strip()), grita)

    anuncio = _PRESENTA.match(cuerpo)
    if anuncio:
        artista, gira = anuncio.group(2), anuncio.group(1)
    else:
        artista, gira = partir_artista_y_gira(cuerpo)

    artistas = [
        _nombre_de_artista(_quitar_punto_final(a), grita)
        for a in partir_artistas(artista, anuncio is not None)
    ]
    gira_final = gira or (cola or None)
    return _unir(artistas, titulo_caso(_quitar_punto_final(gira_final), grita) if gira_final else None)
