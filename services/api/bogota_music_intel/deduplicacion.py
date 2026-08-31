"""Reconoce cuándo dos filas crudas son el mismo show.

Un mismo concierto llega por dos fuentes cuando el promotor y la sala
publican su propia cartelera: Akriila aparece como "AKRIILA - TOUR LUCY" en
Royal Center y como "AKRIILA EN BOGOTÁ" en Rockal Live.

**Esto vivía en el frontend** (`apps/web/src/lib/dedupe.ts`) y estaba
anotado como deuda técnica, a saldar cuando existiera la API pública. Lo
salda antes el modelo de moderación: la deduplicación es parte de la
identidad del evento, así que pertenece a la ingesta.

Y cambia de papel al mudarse. Allá decidía sola y a ciegas: agrupaba, se
quedaba con "el registro más completo" y descartaba el resto — por eso
Akriila perdía "Tour Lucy", porque ganaba la fila que traía precio y hora.
Acá **solo sugiere**: propone que dos crudos son el mismo show y el admin lo
confirma en la pantalla de revisión. Un falso positivo deja de borrar un
evento en silencio y pasa a ser una casilla que alguien desmarca.

La heurística es la misma que ya venía funcionando en el frontend, portada
sin cambiarle el criterio para no estrenar comportamiento y mudanza a la vez.
La única diferencia: la sala se compara por `venue_id` y no por el texto de
`venue_name_raw`. Es el mismo emparejamiento —los dos nombres que el
frontend comparaba en minúscula producen el mismo slug, y el slug es el
venue— pero acá el id ya está resuelto y no hay que normalizar texto.
"""
import re
import unicodedata
from datetime import datetime
from zoneinfo import ZoneInfo

BOGOTA_TZ = ZoneInfo("America/Bogota")

# Palabras que no distinguen un show de otro: si dos títulos solo comparten
# "en", "Bogotá" o "tour", no comparten nada.
RELLENO = {
    "en", "de", "del", "la", "el", "los", "las", "y", "a",
    "bogota", "colombia", "tour", "vivo", "concierto", "show", "presenta",
}


def tokens(titulo: str) -> set[str]:
    """Las palabras con las que vale la pena comparar dos títulos."""
    normalizado = re.sub(
        r"[^a-z0-9\s]",
        " ",
        "".join(
            c
            for c in unicodedata.normalize("NFD", titulo)
            if unicodedata.category(c) != "Mn"
        ).lower(),
    )
    palabras = [p for p in normalizado.split() if p and p not in RELLENO]
    # Si el título era puro relleno ("En vivo"), se cae al texto completo
    # antes que devolver un conjunto vacío, que emparejaría con todo.
    return set(palabras) if palabras else set(normalizado.split())


def titulo_equivalente(a: str, b: str) -> bool:
    """¿Los dos títulos nombran el mismo show?

    Dos formas de decir que sí: uno contenido en el otro ("AKRIILA" dentro
    de "AKRIILA TOUR LUCY") o mayoría de palabras compartidas. Exigir una de
    las dos evita fusionar dos shows distintos de la misma sala el mismo día
    ("Noche de Salsa" y "Noche Electrónica" comparten solo "noche").
    """
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return False

    comunes = ta & tb
    if not comunes:
        return False

    contenido = len(comunes) == len(ta) or len(comunes) == len(tb)
    jaccard = len(comunes) / len(ta | tb)
    return contenido or jaccard >= 0.5


def dia_en_bogota(iso: str | None) -> str | None:
    """El día calendario de Bogotá, que es el único que importa acá.

    Se convierte antes de comparar y no se mira el texto ISO: un show de las
    7 p. m. se guarda como `T00:00:00Z` del día siguiente, así que comparar
    las cadenas diría que dos fuentes hablan de días distintos cuando hablan
    del mismo.
    """
    if not iso:
        return None
    return datetime.fromisoformat(iso).astimezone(BOGOTA_TZ).date().isoformat()


def es_el_mismo_show(a: dict, b: dict) -> bool:
    """Misma sala, mismo día de Bogotá y títulos equivalentes.

    Sin fecha no se empareja: dos eventos sin fecha en la misma sala no hay
    con qué distinguirlos, y unirlos sería inventar que son el mismo.
    """
    if a.get("venue_id") is None or a.get("venue_id") != b.get("venue_id"):
        return False

    dia_a = dia_en_bogota(a.get("starts_at"))
    if dia_a is None or dia_a != dia_en_bogota(b.get("starts_at")):
        return False

    return titulo_equivalente(a.get("title") or "", b.get("title") or "")


def agrupar_mismos_shows(eventos: list[dict]) -> list[list[dict]]:
    """Agrupa filas crudas que son el mismo show, conservando el orden.

    Se compara contra el primero de cada grupo y no contra todos: es lo que
    hacía el frontend y evita que una cadena de parecidos termine juntando
    dos shows que no se parecen entre sí.
    """
    grupos: list[list[dict]] = []
    for evento in eventos:
        for grupo in grupos:
            if es_el_mismo_show(grupo[0], evento):
                grupo.append(evento)
                break
        else:
            grupos.append([evento])
    return grupos


def _tiene_hora_publicada(iso: str | None) -> bool:
    """Una fuente que solo publicó la fecha deja la hora en medianoche local."""
    if not iso:
        return False
    local = datetime.fromisoformat(iso).astimezone(BOGOTA_TZ)
    return (local.hour, local.minute) != (0, 0)


def riqueza(evento: dict) -> int:
    """Qué tan completo viene un crudo. Decide de cuál se prellena el
    borrador cuando el mismo show llega por varias fuentes — pero ya no
    descarta a los otros: el canónico cuelga de todos y el admin puede tomar
    el título de uno y el precio de otro."""
    señales = [
        evento.get("price_text"),
        evento.get("category"),
        evento.get("description"),
        evento.get("image_url"),
        "hora" if _tiene_hora_publicada(evento.get("starts_at")) else None,
        evento.get("event_type"),
        # Se compara contra None a propósito: is_local=False es un
        # internacional confirmado, un dato tan bueno como True.
        None if evento.get("is_local") is None else "origen",
    ]
    return sum(1 for s in señales if s)


def mas_completo(eventos: list[dict]) -> dict:
    """El crudo con el que conviene prellenar el borrador."""
    return max(eventos, key=riqueza)
