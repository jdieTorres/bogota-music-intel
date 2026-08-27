"""Normalización de texto libre que llega de los sitios scrapeados.

Cada sitio escribe los nombres a su manera ("ROYAL CENTER" vs "Royal Center",
"Bogota" vs "Bogotá"). Sin normalizar, la misma ciudad o el mismo venue
quedan como valores distintos y rompen los filtros del frontend.
"""
import re
import unicodedata

# Palabras que se mantienen en minúscula al recomponer un nombre en MAYÚSCULAS,
# salvo que abran el nombre ("Teatro de la Ciudad", no "Teatro De La Ciudad").
_LOWERCASE_WORDS = {"de", "del", "la", "las", "el", "los", "y", "en", "a"}

_CANONICAL_CITIES = {
    "bogota": "Bogotá",
    "medellin": "Medellín",
    "cali": "Cali",
    "barranquilla": "Barranquilla",
    "cartagena": "Cartagena",
    "bucaramanga": "Bucaramanga",
    "pereira": "Pereira",
    "manizales": "Manizales",
    "santa marta": "Santa Marta",
    "villavicencio": "Villavicencio",
    "ibague": "Ibagué",
    "cucuta": "Cúcuta",
    "armenia": "Armenia",
    "popayan": "Popayán",
    "pasto": "Pasto",
}


def _strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )


def _collapse_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_city(city: str | None) -> str:
    """"Bogota", "BOGOTÁ", " bogotá " -> "Bogotá". Ciudades desconocidas se
    devuelven con espacios colapsados y capitalización por palabra."""
    if not city:
        return "Bogotá"
    cleaned = _collapse_spaces(city)
    key = _strip_accents(cleaned).casefold()
    if key in _CANONICAL_CITIES:
        return _CANONICAL_CITIES[key]
    return normalize_venue_name(cleaned)


def normalize_venue_name(name: str) -> str:
    """Colapsa espacios y arregla los nombres que llegan gritados en
    MAYÚSCULAS ("ROYAL CENTER" -> "Royal Center"). Los nombres que ya vienen
    con mayúsculas y minúsculas mezcladas se respetan tal cual, porque ahí la
    capitalización suele ser intencional ("La Muchacha", "eTicketaBlanca")."""
    cleaned = _collapse_spaces(name)
    if not cleaned or not cleaned.isupper():
        return cleaned

    words = []
    for index, word in enumerate(cleaned.split(" ")):
        lowered = word.casefold()
        if index > 0 and lowered in _LOWERCASE_WORDS:
            words.append(lowered)
        else:
            words.append(lowered[:1].upper() + lowered[1:])
    return " ".join(words)
