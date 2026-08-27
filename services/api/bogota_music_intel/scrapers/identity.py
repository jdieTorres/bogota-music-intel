"""Identidad estable de un evento dentro de una fuente.

Algunos sitios (Lourdes, Royal Center) no exponen ningún id propio: lo único
"identificable" a mano es el link a la boletería externa. Usar ese link como
identidad es frágil — el venue puede corregirlo (de hecho la tarjeta de
Bloodbath en Lourdes apunta hoy a otros dos artistas), y al cambiar la URL
guardaríamos una fila nueva en vez de actualizar la existente, duplicando el
evento en el calendario.

Se usa entonces título + fecha: la fecha distingue las funciones de un evento
recurrente (ej. una noche semanal fija) y el título sobrevive a que cambien
el link de venta.
"""
from datetime import datetime

from slugify import slugify


def build_event_id(title: str, starts_at: datetime | None) -> str:
    base = slugify(title) or "sin-titulo"
    if starts_at is None:
        return base
    return f"{base}-{starts_at.date().isoformat()}"
