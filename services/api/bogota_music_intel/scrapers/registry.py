from collections.abc import Callable
from dataclasses import dataclass

from bogota_music_intel.scrapers import (
    idartes_teatro_jeg,
    latino_power,
    lourdes_music_hall,
    movistar_arena,
    rockal_live,
    royal_center,
)
from bogota_music_intel.scrapers.models import ScrapedEvent

SCRAPERS: dict[str, Callable[[], list[ScrapedEvent]]] = {
    movistar_arena.SOURCE: movistar_arena.scrape,
    latino_power.SOURCE: latino_power.scrape,
    rockal_live.SOURCE: rockal_live.scrape,
    idartes_teatro_jeg.SOURCE: idartes_teatro_jeg.scrape,
    lourdes_music_hall.SOURCE: lourdes_music_hall.scrape,
    royal_center.SOURCE: royal_center.scrape,
}


@dataclass(frozen=True)
class ManualVenue:
    name: str
    reason: str


# Venues auditados donde el scraping automático no es viable (verificado
# 2026-08-27, ver docs/investigacion-tecnica-plataforma-musical.md sección 4).
# Requieren carga manual periódica hasta que cambie su situación técnica.
MANUAL_VENUES: list[ManualVenue] = [
    ManualVenue(
        name="Ace of Spades",
        reason=(
            "Sitio propio (aceofspadesbogota.com.co/new) es un WordPress "
            "placeholder sin listado de eventos real (post 'Hello world!' de "
            "ejemplo). Difusión real es solo Instagram (bloqueado por robots.txt)."
        ),
    ),
    ManualVenue(
        name="Teatro Cafam",
        reason=(
            "cafam.com.co corre detrás de Radware Bot Manager: toda la web "
            "(no solo rutas admin) redirige a un challenge en validate.perfdrive.com. "
            "Evadirlo violaría la regla del proyecto de no sortear bloqueos anti-bot."
        ),
    ),
    ManualVenue(
        name="Boro Room",
        reason="Sin sitio propio, difusión solo Instagram, sin organizador fijo en eTicketaBlanca.",
    ),
    ManualVenue(
        name="The Bonfire",
        reason="Sin sitio propio, difusión TikTok/Instagram, sin organizador fijo identificado.",
    ),
]
