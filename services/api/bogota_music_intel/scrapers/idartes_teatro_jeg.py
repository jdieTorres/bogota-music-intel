from datetime import datetime
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

from bogota_music_intel.scrapers import http
from bogota_music_intel.scrapers.models import ScrapedEvent

SOURCE = "idartes_teatro_jeg"
BASE_URL = "https://www.idartes.gov.co"
AGENDA_URL = f"{BASE_URL}/es/agenda/teatro-jeg"
BOGOTA_TZ = ZoneInfo("America/Bogota")


def scrape() -> list[ScrapedEvent]:
    response = http.get(AGENDA_URL)
    soup = BeautifulSoup(response.text, "lxml")

    events: list[ScrapedEvent] = []
    for card in soup.select("div.cajashomeeventos"):
        link = card.select_one(".titulo_cajashomeeventos a[href]")
        time_tag = card.select_one(".fecha_cajashomeeventos time[datetime]")
        category_tag = card.select_one(".ctg-ev-24")
        price_tag = card.select_one(".tipo_cajashomeeventos")
        description_tag = card.select_one(".descripcion_cajashomeeventos")
        img = card.find("img")
        if not link:
            continue

        source_url = link["href"]
        if source_url.startswith("/"):
            source_url = BASE_URL + source_url

        starts_at = None
        if time_tag and time_tag.get("datetime"):
            starts_at = datetime.fromisoformat(
                time_tag["datetime"].replace("Z", "+00:00")
            ).astimezone(BOGOTA_TZ)

        events.append(
            ScrapedEvent(
                source=SOURCE,
                source_event_id=source_url.rstrip("/").rsplit("/", 1)[-1],
                venue_name_raw="Teatro Jorge Eliécer Gaitán",
                title=link.get_text(strip=True),
                source_url=source_url,
                ticket_url=source_url,
                starts_at=starts_at,
                date_precision="day" if starts_at else "unknown",
                description=description_tag.get_text(strip=True) if description_tag else None,
                price_text=price_tag.get_text(strip=True) if price_tag else None,
                category=category_tag.get_text(strip=True) if category_tag else None,
                image_url=(BASE_URL + img["src"]) if img and img.get("src", "").startswith("/") else (img.get("src") if img else None),
            )
        )
    return events
