from functools import lru_cache

from slugify import slugify
from supabase import Client, create_client

from bogota_music_intel.config import settings
from bogota_music_intel.scrapers.models import ScrapedEvent


@lru_cache
def get_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_or_create_venue(client: Client, name: str, city: str = "Bogotá") -> str:
    slug = slugify(name)
    existing = client.table("venues").select("id").eq("slug", slug).limit(1).execute()
    if existing.data:
        return existing.data[0]["id"]

    created = client.table("venues").insert(
        {"slug": slug, "name": name, "city": city}
    ).execute()
    return created.data[0]["id"]


def save_events(client: Client, events: list[ScrapedEvent]) -> int:
    if not events:
        return 0

    rows = []
    for event in events:
        venue_id = get_or_create_venue(client, event.venue_name_raw, event.city)
        rows.append(
            {
                "source": event.source,
                "source_event_id": event.source_event_id,
                "venue_id": venue_id,
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
    return len(rows)
