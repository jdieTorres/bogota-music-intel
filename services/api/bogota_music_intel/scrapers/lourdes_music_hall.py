"""Lourdes Music Hall no tiene contenedores semánticos por evento (Elementor
genera divs genéricos e-con-full/e-flex por cada bloque de la home). El
scraper ancla en cada botón "COMPRAR"/"Ver Más" (que sí es estable porque
apunta a la boletería externa) y sube al contenedor padre para leer el resto
del bloque como texto plano. Es el parser más frágil de los seis: si Lourdes
rediseña la home, esto es lo primero que se rompe.
"""
import re

from bs4 import BeautifulSoup

from bogota_music_intel.scrapers import http
from bogota_music_intel.scrapers.dateparse import parse_spanish_date
from bogota_music_intel.scrapers.identity import build_event_id
from bogota_music_intel.scrapers.models import ScrapedEvent

SOURCE = "lourdes_music_hall"
HOME_URL = "https://lourdesmusichall.com/"

_DATE_HINT_RE = re.compile(r"\d{1,2}\s*(?:de)?\s*[a-zA-Záéíóúñ]+\s*\d{4}", re.IGNORECASE)


def _find_event_container(ticket_link) -> "BeautifulSoup | None":
    # Elementor anida varios "e-con-full ... e-child" dentro de un mismo
    # bloque de evento (uno para el grupo imagen+título, otro para
    # fecha+ciudad, otro para los botones), así que no basta con subir al
    # primer ancestro con esa clase. Se sube hasta encontrar un contenedor
    # que ya incluya tanto una imagen como un texto con pinta de fecha:
    # ese es el bloque completo del evento, no un sub-bloque.
    node = ticket_link
    for _ in range(10):
        node = node.parent
        if node is None:
            return None
        if node.find("img") and node.find(string=_DATE_HINT_RE):
            return node
    return None


def scrape() -> list[ScrapedEvent]:
    response = http.get(HOME_URL)
    soup = BeautifulSoup(response.text, "lxml")

    events: list[ScrapedEvent] = []
    seen_ids: set[str] = set()

    for ticket_link in soup.select("a.elementor-button-link"):
        label = ticket_link.get_text(strip=True).upper()
        if label not in {"COMPRAR", "VER MÁS", "VER MAS"}:
            continue
        ticket_url = ticket_link.get("href")
        if not ticket_url:
            continue

        container = _find_event_container(ticket_link)
        if container is None:
            continue

        paragraphs = [p.get_text(strip=True) for p in container.select(".elementor-widget-text-editor p")]
        paragraphs = [p for p in paragraphs if p and p.upper() not in {"COMPRAR", "VER MÁS", "VER MAS"}]
        if not paragraphs:
            continue

        date_text = next((p for p in paragraphs if _DATE_HINT_RE.search(p)), None)
        title = next((p for p in paragraphs if p != date_text and p.upper() != "BOGOTÁ"), paragraphs[0])
        starts_at = parse_spanish_date(date_text) if date_text else None

        img = container.find("img")
        source_event_id = build_event_id(title, starts_at)
        if source_event_id in seen_ids:
            continue
        seen_ids.add(source_event_id)

        events.append(
            ScrapedEvent(
                source=SOURCE,
                source_event_id=source_event_id,
                venue_name_raw="Lourdes Music Hall",
                title=title,
                source_url=HOME_URL,
                ticket_url=ticket_url,
                starts_at=starts_at,
                date_precision="day" if starts_at else "unknown",
                image_url=img.get("src") if img else None,
                raw={"paragraphs": paragraphs},
            )
        )
    return events
