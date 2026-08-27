from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

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
