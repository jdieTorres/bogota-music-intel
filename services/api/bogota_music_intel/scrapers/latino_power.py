import html
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx

from bogota_music_intel.precios import SIN_DATO, desde_montos
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


def _precio(item: dict) -> dict:
    """El monto real, que NO es el que publica `cost`.

    La API manda los dos: `cost` es un texto ya redondeado a miles —dice "$34"
    para una boleta de 33.900— y `cost_details.values` trae el número de
    verdad. Tomar `cost` publicaba el precio dividido por mil, y así estuvieron
    7 eventos hasta el 2026-09-02.

    `values` es un arreglo porque un evento puede vender varias boletas, así
    que de ahí sale el rango sin pedirle nada más a la fuente.
    """
    detalle = item.get("cost_details") or {}
    precio = desde_montos(detalle.get("values") or [])
    return precio.as_row() if precio else SIN_DATO


def _json(response: httpx.Response) -> dict:
    """El cuerpo como JSON, o un error que diga qué llegó en su lugar.

    ⚠️ **Un 200 no garantiza JSON.** El 2026-09-09 esta API devolvió desde
    GitHub Actions un 200 con un cuerpo que no era JSON —una página de desafío
    de WAF, la misma familia que el Radware de Teatro Cafam— y `.json()` murió
    con `Expecting value: line 1 column 1`, que no dice nada de lo que pasó.
    Diagnosticarlo costó ir a buscar el log a mano.

    La fuente sigue fallando entera, y eso no se toca: con `_prune_missing_events`
    de por medio, un lote incompleto borraría eventos futuros en vez de
    omitirlos. Lo que cambia es que el mensaje ahora se puede leer.
    """
    try:
        return response.json()
    except ValueError as exc:
        tipo = response.headers.get("content-type", "?")
        inicio = response.text[:200].replace("\n", " ").strip()
        # Las cabeceras que delatan quién contestó. Un `cf-ray` es Cloudflare,
        # un `x-sucuri-id` es Sucuri, y `server` suele nombrar al WAF. Sin
        # esto hay que adivinar si el bloqueo lo pone el hosting o el sitio.
        pistas = {
            k: v
            for k, v in response.headers.items()
            if k.lower()
            in ("server", "cf-ray", "cf-mitigated", "x-sucuri-id", "x-powered-by")
        }
        raise RuntimeError(
            f"la API respondió {response.status_code} con content-type «{tipo}», "
            f"que no es JSON. Cabeceras: {pistas}. Empieza así: {inicio!r}"
        ) from exc


def scrape() -> list[ScrapedEvent]:
    events: list[ScrapedEvent] = []
    page = 1
    with httpx.Client(headers=DEFAULT_HEADERS, timeout=30) as client:
        while True:
            response = client.get(API_URL, params={"per_page": 50, "page": page})
            # Pasada la última página la API contesta 400 o 404 según versión:
            # el 2026-09-09 devolvía 404 con cuerpo JSON. No es un fallo.
            if response.status_code in (400, 404):
                break
            response.raise_for_status()
            payload = _json(response)

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
                        **_precio(item),
                        image_url=(item.get("image") or {}).get("url"),
                        city=venue.get("city") or "Bogotá",
                        venue_address=_clean(venue.get("address")),
                        raw={"venue_address": venue.get("address")},
                    )
                )

            if page >= payload.get("total_pages", 1):
                break
            page += 1

    return events
