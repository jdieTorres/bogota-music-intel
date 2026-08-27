from bs4 import BeautifulSoup

from bogota_music_intel.scrapers import http
from bogota_music_intel.scrapers.dateparse import parse_spanish_date
from bogota_music_intel.scrapers.models import ScrapedEvent

SOURCE = "movistar_arena"
EVENTS_URL = "https://movistararena.co/eventos/"


def scrape() -> list[ScrapedEvent]:
    response = http.get(EVENTS_URL)
    soup = BeautifulSoup(response.text, "lxml")

    events: list[ScrapedEvent] = []
    for card in soup.select("div.evento"):
        link = card.find("a", href=True)
        title_tag = card.select_one(".evento-title h3")
        date_tag = card.select_one(".evento-title-date span")
        if not link or not title_tag:
            continue

        title = title_tag.get_text(strip=True)
        source_url = link["href"]
        starts_at = parse_spanish_date(date_tag.get_text(strip=True)) if date_tag else None
        img = card.find("img")
        description_tag = card.select_one(".content p")

        events.append(
            ScrapedEvent(
                source=SOURCE,
                source_event_id=source_url.rstrip("/").rsplit("/", 1)[-1],
                venue_name_raw="Movistar Arena",
                title=title,
                source_url=source_url,
                ticket_url=source_url,
                starts_at=starts_at,
                date_precision="day" if starts_at else "unknown",
                description=description_tag.get_text(strip=True) if description_tag else None,
                image_url=img.get("src") if img else None,
                raw={"date_text": date_tag.get_text(strip=True) if date_tag else None},
            )
        )
    return events
