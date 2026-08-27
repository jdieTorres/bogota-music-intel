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


def parse_spanish_date_infer_year(text: str, reference: datetime | None = None) -> datetime | None:
    """Parse 'DD DE MONTH' with no year (as seen on Royal Center's listing)
    and infer the year: assumes the next upcoming occurrence relative to
    `reference` (defaults to now in America/Bogota), since venue listings
    only show future events.
    """
    match = _DATE_NO_YEAR_RE.search(text)
    if not match:
        return None
    day, month_name = match.groups()
    month = _SPANISH_MONTHS.get(month_name.strip().lower())
    if month is None:
        return None

    reference = reference or datetime.now(BOGOTA_TZ)
    for year in (reference.year, reference.year + 1):
        try:
            candidate = datetime(year, month, int(day), tzinfo=BOGOTA_TZ)
        except ValueError:
            continue
        if candidate >= reference - timedelta(days=1):
            return candidate
    return None
