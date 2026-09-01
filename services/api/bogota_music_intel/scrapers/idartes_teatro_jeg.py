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


# La agenda del Teatro Jorge Eliécer Gaitán es distrital y programa de todo:
# teatro, danza, ópera.
#
# **Hasta el 2026-08-31 esta fuente entraba acotada a `/agenda/concierto/`**,
# porque sin filtro ensuciaba la cartelera. Juan levantó esa restricción al
# existir la cola de moderación: ahora entra completa y lo que no es música
# se descarta al revisarlo. El costo de un falso negativo cambió de lado —
# antes un concierto mal enrutado desaparecía sin dejar rastro, ahora lo peor
# que pasa es un borrador de más.
#
# La ruta de la ficha no se tira: **deja de filtrar y pasa a clasificar**,
# que es donde vale más. Es la señal confiable de esta fuente, porque la
# etiqueta del listado se contradice con la propia ficha —"'Fuera de sí'"
# aparece etiquetada como **Música** y vive en `/agenda/presentacion-de-danza/`,
# describiéndose como una obra de danza—. La ruta la genera el enrutamiento
# del sitio; la etiqueta la escribe una persona.
DISCIPLINA_POR_RUTA = {
    "concierto": "Música",
    "presentacion-de-danza": "Danza",
    "obra-de-teatro": "Teatro",
}

# `presentacion` a secas es ambigua y por eso NO está en el mapa de arriba:
# ahí conviven "Gaitán al Aire Vol. 57: Ancestral Beats" (música) y
# "Einstein on the Beach" (ópera). Para esa ruta se cae a la etiqueta del
# listado, que en los dos casos acierta.
RUTA_AMBIGUA = "presentacion"


def disciplina(source_url: str, etiqueta_del_listado: str | None) -> str | None:
    """Qué disciplina es, prefiriendo la ruta sobre la etiqueta.

    Devuelve lo que va a `category`, que es lo que después mira el
    clasificador para decidir si el evento es música.
    """
    if "/agenda/" not in source_url:
        return etiqueta_del_listado
    partes = [p for p in source_url.split("/agenda/")[-1].split("/") if p]
    ruta = partes[0] if partes else ""
    return DISCIPLINA_POR_RUTA.get(ruta) or etiqueta_del_listado


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
                category=disciplina(
                    source_url,
                    category_tag.get_text(strip=True) if category_tag else None,
                ),
                image_url=(BASE_URL + img["src"]) if img and img.get("src", "").startswith("/") else (img.get("src") if img else None),
            )
        )
    return events
