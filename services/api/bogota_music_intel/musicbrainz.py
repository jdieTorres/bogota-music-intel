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

# "Festival Orígenes presenta Sara Curruchich": el artista va después.
_PRESENTA = re.compile(r"\bpresenta\b\s*", re.IGNORECASE)

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


def limpiar_titulo(title: str) -> str:
    """Saca del título del evento algo parecido al nombre del artista.

    Los sitios titulan el evento, no al artista: "PABLOPABLO EN BOGOTÁ",
    "HELLOWEEN | 40 YEARS ANNIVERSARY TOUR", "Gustavo Santaolalla llega a
    Bogotá con el Ronroco Tour". Sin limpiar esto, la búsqueda no acierta.

    Devuelve "" cuando no queda nada consultable; el llamador debe tratarlo
    como "no resuelto", no como un artista sin nombre.
    """
    texto = _SEPARADORES.split(title.strip(), maxsplit=1)[0]

    if _PRESENTA.search(texto):
        texto = _PRESENTA.split(texto, maxsplit=1)[-1]

    for patron in _RUIDO:
        texto = patron.sub(" ", texto)

    texto = re.sub(r"\s+", " ", texto).strip().strip(_COMILLAS).strip()
    return texto


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
