from dataclasses import dataclass
from datetime import UTC, datetime
from functools import lru_cache

from slugify import slugify
from supabase import Client, create_client

from bogota_music_intel.config import settings
from bogota_music_intel.scrapers.models import ScrapedEvent, dedupe_events
from bogota_music_intel.scrapers.text import normalize_venue_name


@dataclass(frozen=True)
class SaveResult:
    saved: int
    pruned: int


@lru_cache
def get_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "Faltan credenciales de Supabase. Definí bmi_supabase_url y "
            "bmi_supabase_service_role_key (en services/api/.env para correr "
            "local, o en los secrets del repo para GitHub Actions)."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def upsert_venues(client: Client, events: list[ScrapedEvent]) -> dict[str, str]:
    """Crea/actualiza de una sola vez los venues que aparecen en el lote y
    devuelve el mapa slug -> id. Antes se consultaba venue por evento, lo que
    daba una ida y vuelta a Supabase por cada evento scrapeado."""
    rows: dict[str, dict[str, str]] = {}
    for event in events:
        slug = slugify(event.venue_name_raw)
        if not slug:
            continue
        rows[slug] = {
            "slug": slug,
            "name": normalize_venue_name(event.venue_name_raw),
            "city": event.city,
        }
    if not rows:
        return {}

    client.table("venues").upsert(list(rows.values()), on_conflict="slug").execute()
    stored = client.table("venues").select("id,slug").in_("slug", list(rows)).execute()
    return {row["slug"]: row["id"] for row in stored.data}


def _prune_missing_events(client: Client, source: str, keep_ids: list[str]) -> int:
    """Borra los eventos de esta fuente que ya no aparecen en la cartelera y
    que todavía no han ocurrido (cancelados o reprogramados). Los eventos ya
    pasados se conservan como registro histórico.

    Nunca se poda con un lote vacío: si el sitio falla y devuelve 0 eventos,
    borrar todo lo futuro sería peor que no actualizar.
    """
    if not keep_ids:
        return 0

    now = datetime.now(UTC).isoformat()
    response = (
        client.table("events")
        .delete()
        .eq("source", source)
        .or_(f"starts_at.gte.{now},starts_at.is.null")
        .not_.in_("source_event_id", keep_ids)
        .execute()
    )
    return len(response.data or [])


def save_events(client: Client, events: list[ScrapedEvent]) -> SaveResult:
    events = dedupe_events(events)
    if not events:
        return SaveResult(saved=0, pruned=0)

    venue_ids = upsert_venues(client, events)

    rows = []
    for event in events:
        rows.append(
            {
                "source": event.source,
                "source_event_id": event.source_event_id,
                "venue_id": venue_ids.get(slugify(event.venue_name_raw)),
                "venue_name_raw": event.venue_name_raw,
                "title": event.title,
                "starts_at": event.starts_at.isoformat() if event.starts_at else None,
                "ends_at": event.ends_at.isoformat() if event.ends_at else None,
                "date_precision": event.date_precision,
                "description": event.description,
                "price_text": event.price_text,
                "category": event.category,
                "ticket_url": event.ticket_url,
                "source_url": event.source_url,
                "image_url": event.image_url,
                "raw": event.raw,
            }
        )

    client.table("events").upsert(rows, on_conflict="source,source_event_id").execute()

    source = events[0].source
    pruned = _prune_missing_events(client, source, [e.source_event_id for e in events])
    return SaveResult(saved=len(rows), pruned=pruned)
