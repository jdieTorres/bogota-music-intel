from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

from bogota_music_intel.scrapers.text import normalize_city

DatePrecision = Literal["day", "month", "unknown"]


@dataclass
class ScrapedEvent:
    source: str
    source_event_id: str
    venue_name_raw: str
    title: str
    source_url: str
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    date_precision: DatePrecision = "day"
    description: str | None = None
    price_text: str | None = None
    category: str | None = None
    ticket_url: str | None = None
    image_url: str | None = None
    city: str = "Bogotá"
    raw: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.city = normalize_city(self.city)
        # Sin fecha no hay precisión que declarar: varios scrapers dejan
        # "day" por defecto aunque no hayan logrado parsear nada.
        if self.starts_at is None:
            self.date_precision = "unknown"


def dedupe_events(events: list[ScrapedEvent]) -> list[ScrapedEvent]:
    """Quita repetidos por source_event_id conservando el orden de aparición.

    Es obligatorio antes de escribir: Postgres rechaza un upsert que traiga
    dos filas con la misma clave de conflicto ("ON CONFLICT DO UPDATE command
    cannot affect row a second time"), y varias carteleras repiten el mismo
    evento (ej. el slider de destacados de Movistar Arena).
    """
    seen: set[str] = set()
    unique: list[ScrapedEvent] = []
    for event in events:
        if event.source_event_id in seen:
            continue
        seen.add(event.source_event_id)
        unique.append(event)
    return unique
