"""Resuelve el país de origen del artista de un evento contra MusicBrainz.

Es el dato que falta para separar el toque local del show internacional: el
título del evento no lo dice y ninguna fuente publica nacionalidad.

Dos cuidados heredados del geocodificador (`geocode.py`), por el mismo
motivo de fondo — un valor verosímil pero equivocado es peor que un hueco:

- **Límite de 1 petición por segundo** y User-Agent identificable. Es la
  política de uso de MusicBrainz; pasarse hace que baneen la IP. El ritmo
  se controla acá adentro, no en el llamador: cuando estuvo del lado del
  CLI, las dos primeras peticiones salían pegadas y MusicBrainz contestaba
  503 a la cuarta.
- **Un match dudoso no se acepta.** Si el artista no se resuelve con
  confianza, la función devuelve None y el evento queda con origen
  desconocido, que la cartelera trata como "no penalizar". Distinto de
  "confirmado internacional", que sí manda el evento a segundo plano.

A diferencia de Nominatim, MusicBrainz no pide evitar el uso automatizado
—solo limita el ritmo—, así que esto sí puede correr en el cron diario.
"""
import difflib
import re
import time
import unicodedata
from dataclasses import dataclass

import httpx

MUSICBRAINZ_URL = "https://musicbrainz.org/ws/2/artist"

# MusicBrainz exige un User-Agent que identifique la aplicación y dé una
# forma de contacto.
USER_AGENT = "BogotaMusicIntel/0.1 (https://github.com/jdieTorres/bogota-music-intel)"
SEGUNDOS_ENTRE_PETICIONES = 1.2

# MusicBrainz contesta 503 cuando se le pide demasiado seguido, y también
# cuando simplemente está saturado. Es transitorio: se reintenta esperando
# cada vez más antes de darlo por perdido.
REINTENTOS = 3
ESPERA_TRAS_503 = 5.0

# La búsqueda de MusicBrainz siempre devuelve algo: ante un título basura
# contesta el artista menos malo que encuentre, con un score que delata la
# corazonada. Estos dos umbrales juntos son los que separan un match real de
# una coincidencia de casualidad.
PUNTAJE_MINIMO = 90
PARECIDO_MINIMO = 0.88

PAIS_LOCAL = "CO"


class MusicBrainzNoDisponible(RuntimeError):
    """No se pudo preguntar, que no es lo mismo que no haber encontrado.

    La diferencia importa: si un artista no está en MusicBrainz, el evento
    queda con origen desconocido y no hay nada más que hacer. Si el servicio
    estuvo caído, la pregunta sigue pendiente y hay que volver a intentarla
    —guardar «desconocido» ahí lo daría por resuelto para siempre, porque el
    CLI solo mira los eventos sin clasificar.
    """


# Momento de la última petición, para espaciarlas sin que el llamador tenga
# que acordarse. Estuvo primero del lado del CLI y ahí falló: dos peticiones
# salían pegadas al arrancar y MusicBrainz respondía 503.
_ultima_peticion = 0.0


def _esperar_turno() -> None:
    global _ultima_peticion
    pendiente = SEGUNDOS_ENTRE_PETICIONES - (time.monotonic() - _ultima_peticion)
    if pendiente > 0:
        time.sleep(pendiente)
    _ultima_peticion = time.monotonic()


@dataclass(frozen=True)
class ArtistaResuelto:
    nombre: str
    pais: str | None
    consulta: str
    puntaje: int

    @property
    def es_local(self) -> bool | None:
        """None cuando MusicBrainz conoce al artista pero no su país: no se
        puede afirmar ni que es local ni que no lo es."""
        if self.pais is None:
            return None
        return self.pais == PAIS_LOCAL


# Separadores que introducen un subtítulo, una gira o un segundo artista:
# "ROBBIE WILLIAMS | BRITPOP", "El Kalvo: 20 años del rap rolo",
# "INSPECTOR - 30 ANIVERSARIO", "Juantxo Skalari/ The Skatalites".
# El guion exige espacios alrededor para no partir nombres como "Jay-Z".
_SEPARADORES = re.compile(r"\s*[|:/]\s*|\s+[-–—]+\s+")

# "X presenta Y" y "Z por W". El artista puede estar de cualquiera de los
# dos lados —"Festival Orígenes presenta Sara Curruchich" (después) contra
# "Ancestral Beats presenta 'Human Design'" (antes)—, así que se prueban los
# dos en vez de apostar a uno.
_PRESENTA = re.compile(r"\b(?:presenta|presentan|por)\b", re.IGNORECASE)

# Listas de artistas dentro de un mismo título: "Sara Curruchich y
# Humazapas", "Shing02, SPIN MASTER A-1 y Sam Nakamura". Alcanza con
# resolver el primero para saber de dónde es el cartel.
_ENUMERACION = re.compile(r"\s*,\s*|\s+y\s+|\s+&\s+", re.IGNORECASE)

# Formatos de show que la sala pega al nombre de la banda. "RAYOS LASER
# ACÚSTICO" no existe en MusicBrainz; "Rayos Láser" sí. Es una lista corta y
# explícita a propósito: borrar la última palabra a ciegas mutila nombres
# reales.
_FORMATOS = re.compile(
    r"\s+\b(?:ac[uú]stico|unplugged|sinf[oó]nico|en\s+concierto|live\s+session)\b.*$",
    re.IGNORECASE,
)

# Coletillas de cartelera que no son parte del nombre del artista. El orden
# importa: las que cortan hasta el final van antes que las que solo borran
# una palabra.
_RUIDO = [
    re.compile(r"\bllega\s+al?\b.*$", re.IGNORECASE),
    re.compile(r"\ben\s+bogot[aá]\b.*$", re.IGNORECASE),
    re.compile(r"\ben\s+vivo\b.*$", re.IGNORECASE),
    re.compile(r"\ben\s+latino\s+power\b.*$", re.IGNORECASE),
    re.compile(r"\btour\b.*$", re.IGNORECASE),
    re.compile(r"\bbogot[aá]\b", re.IGNORECASE),
    re.compile(r"\b(?:19|20)\d{2}\b"),
]

_COMILLAS = "\"'“”‘’«»¡!¿?.,"


MAX_CANDIDATOS = 3


def _pulir(texto: str) -> str:
    for patron in _RUIDO:
        texto = patron.sub(" ", texto)
    texto = _FORMATOS.sub("", texto)
    return re.sub(r"\s+", " ", texto).strip().strip(_COMILLAS).strip()


def candidatos_de_titulo(title: str) -> list[str]:
    """Nombres de artista plausibles dentro del título, del más probable al
    menos, sin repetir.

    Por qué varios y no uno: el trozo que va primero **no siempre** es el
    artista. "ROBBIE WILLIAMS | BRITPOP" abre con el artista, pero "10 AÑOS
    Y NO AZARAN - LA MUCHACHA EN BOGOTÁ" abre con el nombre de la gira, y
    quedarse con el primero perdía a La Muchacha —una artista colombiana,
    justo lo que la cartelera existe para destacar—. Probar el siguiente
    cuesta una petición más y solo se paga cuando el primero no resolvió.

    Se corta en MAX_CANDIDATOS: más allá de eso no se está buscando al
    artista, se está tirando la red a ver qué cae.
    """
    candidatos: list[str] = []

    def agregar(texto: str) -> None:
        limpio = _pulir(texto)
        # Menos de 3 caracteres no identifica a nadie y hace ruido en la
        # búsqueda difusa de MusicBrainz.
        if len(limpio) >= 3 and limpio not in candidatos:
            candidatos.append(limpio)

    for tramo in _SEPARADORES.split(title.strip()):
        if not tramo.strip():
            continue
        # "X presenta Y": el artista puede estar de cualquier lado.
        lados = [t for t in _PRESENTA.split(tramo) if t.strip()]
        for lado in lados:
            agregar(lado)
            # "Sara Curruchich y Humazapas" -> alcanza con el primero.
            primero = _ENUMERACION.split(lado.strip())[0]
            if primero != lado.strip():
                agregar(primero)

    # Caso real: lourdesmusichall.com publica "<p>BloodbathBloodbath</p>".
    # No es un error del scraper —la sala lo escribió así— y por eso el
    # título se guarda tal cual: la cartelera muestra lo que publicó la
    # fuente. Pero para buscar al artista sí conviene ofrecer la mitad.
    # Se calculan todas antes de agregarlas: `agregar` escribe sobre
    # `candidatos`, y recorrer la misma lista que se está modificando
    # terminaría revisando los nombres que la propia vuelta acaba de meter.
    mitades = [mitad for c in candidatos if (mitad := _sin_duplicar(c))]
    for mitad in mitades:
        agregar(mitad)

    return candidatos[:MAX_CANDIDATOS]


def _sin_duplicar(texto: str) -> str | None:
    """"BloodbathBloodbath" -> "Bloodbath". Solo cuando la cadena es
    exactamente la misma dos veces pegadas; cualquier cosa más floja que eso
    empieza a mutilar nombres legítimos."""
    limpio = texto.strip()
    largo = len(limpio)
    if largo < 6 or largo % 2 != 0:
        return None
    mitad = limpio[: largo // 2]
    return mitad if limpio == mitad * 2 else None


def _normalizar(texto: str) -> str:
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", sin_acentos.casefold())).strip()


def coincide(consulta: str, nombre: str) -> bool:
    """Cuánto se parece lo que preguntamos a lo que contestó MusicBrainz.

    Compara con tolerancia porque las carteleras escriben mal el nombre
    ("5 SECONDS OF SUMMERS" por "5 Seconds of Summer"), pero no tanta como
    para aceptar que "Laura & Brenda" resuelva a la artista "Laura", que es
    el falso positivo típico de aceptar cualquier coincidencia parcial.
    """
    a, b = _normalizar(consulta), _normalizar(nombre)
    if len(a) < 3 or len(b) < 3:
        return False
    return difflib.SequenceMatcher(None, a, b).ratio() >= PARECIDO_MINIMO


def _pais_de(artista: dict) -> str | None:
    """MusicBrainz publica el país en dos lugares y a veces en ninguno."""
    if artista.get("country"):
        return artista["country"]
    for clave in ("area", "begin-area"):
        area = artista.get(clave) or {}
        codigos = area.get("iso-3166-1-codes") or []
        if codigos:
            return codigos[0]
    return None


def _buscar(client: httpx.Client, consulta: str) -> list[dict]:
    """Una búsqueda, respetando el ritmo y aguantando los fallos pasajeros.

    Los dos que ocurren de verdad, vistos corriendo contra el servicio real:
    un 503 cuando está saturado, y un read timeout cuando tarda más de la
    cuenta. Los dos son transitorios y ninguno debería tumbar la corrida
    entera, así que se tratan igual: reintentar y, si insiste, avisar que no
    se pudo preguntar.
    """
    ultimo_motivo = ""
    for intento in range(REINTENTOS):
        _esperar_turno()
        try:
            respuesta = client.get(
                MUSICBRAINZ_URL,
                params={"query": consulta, "fmt": "json", "limit": 5},
            )
        except httpx.TransportError as exc:
            # Timeouts y cortes de conexión. Cubre ReadTimeout, que es el
            # que apareció clasificando los 58 eventos reales.
            ultimo_motivo = f"{type(exc).__name__}"
            time.sleep(ESPERA_TRAS_503 * (intento + 1))
            continue

        if respuesta.status_code == 503:
            ultimo_motivo = "503"
            time.sleep(ESPERA_TRAS_503 * (intento + 1))
            continue
        respuesta.raise_for_status()
        return respuesta.json().get("artists") or []

    raise MusicBrainzNoDisponible(
        f"MusicBrainz falló ({ultimo_motivo}) en {REINTENTOS} intentos "
        f"para «{consulta}»"
    )


def resolver_artista(
    nombre: str, client: httpx.Client | None = None
) -> ArtistaResuelto | None:
    """Busca el artista en MusicBrainz. Devuelve None si no hay un match
    suficientemente confiable — el llamador debe dejar el origen sin
    resolver en ese caso, nunca adivinar."""
    consulta = nombre.strip()
    if len(consulta) < 3:
        return None

    propio = client is None
    if propio:
        client = httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=30)

    try:
        artistas = _buscar(client, consulta)

        for artista in artistas:
            puntaje = int(artista.get("score", 0))
            if puntaje < PUNTAJE_MINIMO:
                # Vienen ordenados por score: si este no llega, ninguno llega.
                break
            if not coincide(consulta, artista.get("name", "")):
                continue
            return ArtistaResuelto(
                nombre=artista["name"],
                pais=_pais_de(artista),
                consulta=consulta,
                puntaje=puntaje,
            )
        return None
    finally:
        if propio:
            client.close()
