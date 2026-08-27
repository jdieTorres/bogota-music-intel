import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

BOGOTA_TZ = ZoneInfo("America/Bogota")

_SPANISH_MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}

# Matches "sábado, 05 septiembre - 2026" or "22 de Agosto 2026"
_DATE_RE = re.compile(
    r"(\d{1,2})\s*(?:de)?\s*([a-zA-Záéíóúñ]+)[\s,-]*?(\d{4})",
    re.IGNORECASE,
)


def parse_spanish_date(text: str) -> datetime | None:
    """Parse a loose Spanish date string like 'sábado, 05 septiembre - 2026'
    or '22 de Agosto 2026' into a date at midnight America/Bogota.
    Returns None if no recognizable date is found.
    """
    match = _DATE_RE.search(text)
    if not match:
        return None
    day, month_name, year = match.groups()
    month = _SPANISH_MONTHS.get(month_name.strip().lower())
    if month is None:
        return None
    try:
        return datetime(int(year), month, int(day), tzinfo=BOGOTA_TZ)
    except ValueError:
        return None


_DATE_NO_YEAR_RE = re.compile(
    r"(\d{1,2})\s*(?:de)?\s*([a-zA-Záéíóúñ]+)\b", re.IGNORECASE
)

# Una cartelera suele dejar publicado un evento algunos días/semanas después
# de que pasó. Dentro de esta ventana se asume "cartelera desactualizada"
# (el evento fue este año) en vez de "próxima ocurrencia" (el año que viene).
STALE_LISTING_DAYS = 60


def parse_spanish_date_infer_year(
    text: str,
    reference: datetime | None = None,
    stale_days: int = STALE_LISTING_DAYS,
) -> datetime | None:
    """Parsea 'DD DE MES' sin año (como en la cartelera de Royal Center) e
    infiere el año.

    No basta con "la próxima ocurrencia futura": un evento que ya pasó pero
    sigue publicado (típico en Wix) quedaría guardado un año en el futuro,
    con una fecha falsa pero verosímil. Por eso, si la fecha de este año cayó
    hace poco (<= `stale_days`), se conserva ese año; solo las fechas ya
    lejanas en el pasado se interpretan como la ocurrencia del año siguiente.
    """
    match = _DATE_NO_YEAR_RE.search(text)
    if not match:
        return None
    day, month_name = match.groups()
    month = _SPANISH_MONTHS.get(month_name.strip().lower())
    if month is None:
        return None

    reference = reference or datetime.now(BOGOTA_TZ)
    candidates: list[datetime] = []
    for year in (reference.year - 1, reference.year, reference.year + 1):
        try:
            candidates.append(datetime(year, month, int(day), tzinfo=BOGOTA_TZ))
        except ValueError:
            continue  # ej. 29 de febrero en un año no bisiesto

    recent_past = [
        c for c in candidates if reference - timedelta(days=stale_days) <= c < reference
    ]
    if recent_past:
        return max(recent_past)

    future = [c for c in candidates if c >= reference]
    return min(future) if future else None
