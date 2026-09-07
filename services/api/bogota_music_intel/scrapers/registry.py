from collections.abc import Callable

from bogota_music_intel.scrapers import (
    idartes_teatro_jeg,
    latino_power,
    lourdes_music_hall,
    movistar_arena,
    rockal_live,
    royal_center,
    visitbogota,
)
from bogota_music_intel.scrapers.models import ScrapedEvent

SCRAPERS: dict[str, Callable[[], list[ScrapedEvent]]] = {
    movistar_arena.SOURCE: movistar_arena.scrape,
    latino_power.SOURCE: latino_power.scrape,
    rockal_live.SOURCE: rockal_live.scrape,
    idartes_teatro_jeg.SOURCE: idartes_teatro_jeg.scrape,
    lourdes_music_hall.SOURCE: lourdes_music_hall.scrape,
    royal_center.SOURCE: royal_center.scrape,
    visitbogota.SOURCE: visitbogota.scrape,
}
