import json
import re
from datetime import datetime

from bogota_music_intel.scrapers import http
from bogota_music_intel.scrapers.models import ScrapedEvent

SOURCE = "rockal_live"
SELLER_URL = "https://tickets.eticketablanca.com/seller/rockal-live-dltt"
_NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.DOTALL
)


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def scrape() -> list[ScrapedEvent]:
    response = http.get(SELLER_URL)

    match = _NEXT_DATA_RE.search(response.text)
    if not match:
        return []

    data = json.loads(match.group(1))
    raw_events = data.get("props", {}).get("pageProps", {}).get("events", [])

    events: list[ScrapedEvent] = []
    for item in raw_events:
        if item.get("locationCity") != "Bogotá":
            continue  # Rockal Live also promotes shows in other cities

        detail_url = f"https://tickets.eticketablanca.com/event/{item['url']}"
        price = item.get("startingPrice")
        events.append(
            ScrapedEvent(
                source=SOURCE,
                source_event_id=item["_id"],
                venue_name_raw=item.get("locationName") or "Rockal Live",
                title=item["name"],
                source_url=detail_url,
                ticket_url=detail_url,
                starts_at=_parse_iso(item.get("start")),
                ends_at=_parse_iso(item.get("end")),
                date_precision="day",
                price_text=f"${price:,.0f} COP" if isinstance(price, (int, float)) else None,
                category=item.get("subCategory") or item.get("category"),
                image_url=item.get("image"),
                city="Bogotá",
                raw={"locationStreet": item.get("locationStreet")},
            )
        )
    return events
