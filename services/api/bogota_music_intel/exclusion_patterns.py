"""Qué eventos no son música en vivo y quedan fuera de la cartelera.

La plataforma promueve los toques de artistas locales, pero las salas
publican su cartelera completa: por el mismo scraper entran comedia, lucha
libre y teatro.

Dos señales, en este orden de confianza:

1. **La categoría que publica la fuente.** Cuando existe es la señal más
   fuerte, porque la puso la sala. Solo dos de seis fuentes la traen
   (Idartes Teatro JEG y Rockal Live); en Idartes distingue Teatro y
   Multidisciplinar, que es exactamente lo que hay que sacar.

2. **Patrones en el título**, para las fuentes que no publican categoría
   (Movistar Arena y Royal Center, que son justamente las que más ruido
   meten).

Los patrones son deliberadamente pocos y específicos. La tentación es
agregar reglas amplias ("live show", "espectáculo") que atrapen más casos,
pero el costo de un falso positivo es asimétrico: un patrón demasiado ancho
saca un toque real de la cartelera y nadie se entera. Lo que no se puede
detectar con una regla honesta se cura a mano en `clasificacion_manual.py`,
con la evidencia anotada.
"""
import re
import unicodedata


def _sin_acentos(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


# Categorías que las fuentes usan para lo que no es música. "Otro" NO entra:
# es un valor de Rockal Live, que es un promotor musical, y ahí significa
# "otro género", no "otra cosa que no es música".
CATEGORIAS_NO_MUSICALES = {
    "teatro",
    "multidisciplinar",
    "danza",
    "circo",
    "literatura",
    "artes plasticas",
    "audiovisual",
}


# (patrón, motivo). El motivo se guarda para poder auditar por qué un evento
# quedó fuera; sin eso, la cartelera esconde eventos sin explicación.
PATRONES_NO_MUSICALES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bwwe\b"), "lucha libre"),
    (re.compile(r"\blucha libre\b"), "lucha libre"),
    (re.compile(r"\bufc\b"), "artes marciales"),
    (re.compile(r"\bstand ?up\b"), "stand-up comedy"),
    (re.compile(r"\bcomedy\b"), "comedia"),
    (re.compile(r"\bmonologo\b"), "monólogo"),
    (re.compile(r"\bobra de teatro\b"), "teatro"),
    (re.compile(r"\buna obra de\b"), "teatro"),
    # Agregados al sumar visitbogota (2026-08-31), que es una agenda del
    # distrito y programa congresos académicos junto a los conciertos. Los
    # dos son inequívocos: no existe un toque llamado "congreso" ni
    # "simposio". Se dejó fuera "feria" a propósito — en Colombia la Feria
    # de las Flores y la Feria de Cali SON eventos con música.
    (re.compile(r"\bcongreso\b"), "congreso académico o gremial"),
    (re.compile(r"\bsimposio\b"), "simposio"),
]


def categoria_no_musical(category: str | None) -> str | None:
    """Devuelve el motivo si la categoría publicada por la fuente no es
    música, o None si es música o si la fuente no publica categoría."""
    if not category:
        return None
    normalizada = _sin_acentos(category).strip().casefold()
    if normalizada in CATEGORIAS_NO_MUSICALES:
        return f"la fuente lo publica como «{category.strip()}»"
    return None


def patron_no_musical(title: str) -> str | None:
    """Devuelve el motivo si el título delata algo que no es música en vivo.

    Trabaja sobre el título sin acentos y en minúsculas, porque las fuentes
    escriben igual de seguido "MONÓLOGO" que "monologo"."""
    normalizado = _sin_acentos(title).casefold()
    for patron, motivo in PATRONES_NO_MUSICALES:
        if patron.search(normalizado):
            return f"{motivo} (patrón «{patron.pattern}»)"
    return None
