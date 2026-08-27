import html
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx

from bogota_music_intel.scrapers.http import DEFAULT_HEADERS
from bogota_music_intel.scrapers.models import ScrapedEvent

SOURCE = "latino_power"
API_URL = "https://tickets.latinopower.com.co/wp-json/tribe/events/v1/events"
BOGOTA_TZ = ZoneInfo("America/Bogota")


def _clean(value: str | None) -> str | None:
    """La API de The Events Calendar devuelve los textos con entidades HTML
    (el costo llega como "&#036;34"). Hay que decodificarlas antes de guardar:
    el frontend renderiza texto plano, no HTML."""
    if not value:
        return None
    return html.unescape(value).strip() or None


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=BOGOTA_TZ)
    except ValueError:
        return None


def scrape() -> list[ScrapedEvent]:
    events: list[ScrapedEvent] = []
    page = 1
    with httpx.Client(headers=DEFAULT_HEADERS, timeout=30) as client:
        while True:
            response = client.get(API_URL, params={"per_page": 50, "page": page})
            if response.status_code == 400:
                break  # past the last page
            response.raise_for_status()
            payload = response.json()

            for item in payload.get("events", []):
                venue = item.get("venue") or {}
                events.append(
                    ScrapedEvent(
                        source=SOURCE,
                        source_event_id=str(item["id"]),
                        venue_name_raw=_clean(venue.get("venue")) or "Latino Power",
                        title=_clean(item["title"]) or item["title"],
                        source_url=item["url"],
                        ticket_url=item["url"],
                        starts_at=_parse_datetime(item.get("start_date")),
                        ends_at=_parse_datetime(item.get("end_date")),
                        date_precision="day",
                        description=_clean(item.get("excerpt")),
                        price_text=_clean(item.get("cost")),
                        image_url=(item.get("image") or {}).get("url"),
                        city=venue.get("city") or "Bogotá",
                        raw={"venue_address": venue.get("address")},
                    )
                )

            if page >= payload.get("total_pages", 1):
                break
            page += 1

    return events
