from datetime import datetime
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

from bogota_music_intel.scrapers import http
from bogota_music_intel.scrapers.models import ScrapedEvent

SOURCE = "idartes_teatro_jeg"
BASE_URL = "https://www.idartes.gov.co"
AGENDA_URL = f"{BASE_URL}/es/agenda/teatro-jeg"
BOGOTA_TZ = ZoneInfo("America/Bogota")


def _parse_agenda_datetime(value: str | None) -> datetime | None:
    """Idartes marca el atributo como UTC ("...Z") pero el valor es hora
    LOCAL de Bogotá: el atributo dice 20:00:00Z mientras la página muestra
    "8:00 pm", y lo mismo en 18:00Z/"6:00 pm" y 19:00Z/"7:00 pm". Verificado
    contra los 9 eventos de la agenda el 2026-08-27.

    Por eso se ignora la "Z" y el valor se interpreta como America/Bogota.
    Tomarlo como UTC de verdad guardaba cada evento 5 horas antes.
    """
    if not value:
        return None
    text = value.strip().removesuffix("Z")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is not None:
        # Trae un offset explícito distinto de "Z": ahí sí se le cree.
        return parsed.astimezone(BOGOTA_TZ)
    return parsed.replace(tzinfo=BOGOTA_TZ)


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

        starts_at = _parse_agenda_datetime(time_tag.get("datetime") if time_tag else None)

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
