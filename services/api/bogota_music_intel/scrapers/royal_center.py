"""Royal Center corre en Wix. Los repeater items usan clases hasheadas
(comp-xxxxx) que cambian con cada republicación, pero el componente base de
texto (wixui-rich-text__text) y de repetidor (*repeater__item*) son estables.
La fecha visible no incluye año ("29 DE AGOSTO"), así que se infiere el
próximo año en que esa fecha cae (ver dateparse.parse_spanish_date_infer_year).
"""
import re

from bs4 import BeautifulSoup

from bogota_music_intel.scrapers import http
from bogota_music_intel.scrapers.dateparse import parse_spanish_date_infer_year
from bogota_music_intel.scrapers.identity import build_event_id
from bogota_music_intel.scrapers.models import ScrapedEvent

SOURCE = "royal_center"
HOME_URL = "https://royalcenter.com.co/"

_DATE_RE = re.compile(r"\d{1,2}\s*DE\s*[A-ZÁÉÍÓÚÑ]+", re.IGNORECASE)
_FILENAME_RE = re.compile(r"\.(jpg|jpeg|png|webp)$", re.IGNORECASE)


def scrape() -> list[ScrapedEvent]:
    response = http.get(HOME_URL)
    soup = BeautifulSoup(response.text, "lxml")

    events: list[ScrapedEvent] = []
    seen_ids: set[str] = set()

    for item in soup.select('[class*="repeater__item"]'):
        ticket_link = item.find("a", href=True)
        if not ticket_link:
            continue
        ticket_url = ticket_link["href"]
        if "royalcenter.com.co" in ticket_url:
            continue  # link interno (ej. #lightbox), no es boletería

        text_nodes = [t.get_text(strip=True) for t in item.select(".wixui-rich-text__text")]
        text_nodes = [t for t in text_nodes if t]
        date_text = next((t for t in text_nodes if _DATE_RE.search(t)), None)
        title_candidates = [t for t in text_nodes if t != date_text and "comprar" not in t.lower()]

        img = item.find("img")
        alt_text = img.get("alt") if img and img.get("alt") else None
        if alt_text and _FILENAME_RE.search(alt_text):
            alt_text = None  # alt sin texto real, es el nombre del archivo subido
        title = alt_text or (title_candidates[0] if title_candidates else None)
        if not title:
            continue  # sin título confiable, mejor omitir que guardar basura

        starts_at = parse_spanish_date_infer_year(date_text) if date_text else None

        source_event_id = build_event_id(title, starts_at)
        if source_event_id in seen_ids:
            continue
        seen_ids.add(source_event_id)

        events.append(
            ScrapedEvent(
                source=SOURCE,
                source_event_id=source_event_id,
                venue_name_raw="Royal Center",
                title=title,
                source_url=HOME_URL,
                ticket_url=ticket_url,
                starts_at=starts_at,
                date_precision="day" if starts_at else "unknown",
                image_url=img.get("src") if img else None,
                raw={"date_text": date_text, "text_nodes": text_nodes},
            )
        )
    return events
