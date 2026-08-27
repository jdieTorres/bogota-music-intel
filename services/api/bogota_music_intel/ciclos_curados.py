"""Fiestas y ciclos de sala, verificados a mano.

Qué distingue a una fiesta de un concierto: no hay un artista de cartel al
que se le pueda preguntar de dónde es. "Noches Bomm" de Latino Power o
"THE JAZZ ROOM" del Royal Center son la sala programándose a sí misma, y
eso es escena local por definición, aunque el nombre no diga quién toca.

**Por qué la clave es el nombre del ciclo y no el id del evento.** Las
fiestas vuelven: hoy es "Que Chimba Puñeta Vol. 4" y en dos meses es el
Vol. 5, con otro `source_event_id`. Curar por id obligaría a agregar una
entrada por edición. Curando el nombre, la edición siguiente entra sola.

Ojo con el riesgo del otro lado: un nombre demasiado corto o demasiado
común puede tragarse conciertos de verdad. Por eso se compara sobre el
título normalizado y se prefiere el nombre completo del ciclo.

Reglas para agregar una entrada:
1. Verificar en la fuente que es un ciclo o una fiesta de la sala, no un
   concierto con cartel. El caso que lo enseñó: "Todo Copas" parecía una
   fiesta por el título ("Todo copas en Latino Power Bogota 20 Años") y
   resultó ser una banda de hip hop colombiana celebrando 20 años de
   trayectoria. Está en `artistas_locales.py`, no acá.
2. Dejar escrito en `evidencia` cómo se verificó.
3. Ante la duda, no agregarlo: el evento se muestra como concierto, que es
   el estado por defecto y no esconde nada.
"""
import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class CicloCurado:
    nombre: str
    evidencia: str


CICLOS: list[CicloCurado] = [
    CicloCurado(
        nombre="Noches Bomm",
        evidencia=(
            "Ciclo recurrente de Latino Power Chapinero. El título del "
            "evento nombra la edición y el ciclo por separado: 'Poder "
            "Femenino En Latino power Noches Bomm.'. No hay artista de "
            "cartel. Verificado 2026-08-27 en tickets.latinopower.com.co."
        ),
    ),
    CicloCurado(
        nombre="Que Chimba Puñeta",
        evidencia=(
            "Fiesta recurrente de Latino Power Chapinero; el propio título "
            "la numera ('Vol. 4'), que es la señal de que vuelve. Sin "
            "artista de cartel. Verificado 2026-08-27 en "
            "tickets.latinopower.com.co."
        ),
    ),
    CicloCurado(
        nombre="MADE4RAP",
        evidencia=(
            "Evento de rap en el Royal Center, publicado por la sala y por "
            "el promotor (eTicketaBlanca) sin nombrar artistas en el "
            "título. Es la marca del evento, no un artista: MusicBrainz no "
            "lo reconoce y no hay ficha de artista en ninguna de las dos "
            "fuentes. Verificado 2026-08-27."
        ),
    ),
    CicloCurado(
        nombre="THE JAZZ ROOM",
        evidencia=(
            "Programación recurrente de jazz del Royal Center. La sala lo "
            "publica sin fecha ni precio y sin cartel de artistas, como "
            "espacio fijo y no como concierto puntual. Verificado "
            "2026-08-27 en royalcenter.com.co."
        ),
    ),
]


def _normalizar(texto: str) -> str:
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", sin_acentos.casefold())).strip()


def ciclo_de(title: str) -> CicloCurado | None:
    """Devuelve el ciclo si el título lo nombra, o None.

    Compara sobre el texto normalizado para que 'Que Chimba Puñeta Vol. 4' y
    'QUE CHIMBA PUNETA VOL 5' caigan las dos en la misma entrada."""
    normalizado = _normalizar(title)
    for ciclo in CICLOS:
        if _normalizar(ciclo.nombre) in normalizado:
            return ciclo
    return None
