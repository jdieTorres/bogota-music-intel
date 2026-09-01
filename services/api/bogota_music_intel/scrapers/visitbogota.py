"""Agenda oficial de eventos del distrito (visitbogota.co).

**Por qué esta fuente.** El scraping hasta ahora solo veía las salas que
publican su propia cartelera, y eso dejaba fuera lo que se vende por
ticketeras que nos bloquean y las salas que no tienen web. Visit Bogotá
agrega eventos de las dos clases: en la primera corrida trajo a Sara Landry
en el Coliseo Medplus, Jamiroquai, Jazz al Parque y el Festival Cordillera —
ninguno visible para las seis fuentes anteriores. Y **agrega eventos
vendidos por Tuboleta sin tocar Tuboleta**, que sigue vedada por su
robots.txt.

Su `robots.txt` (Drupal estándar) solo veda rutas de sistema; la agenda está
abierta. Auditado el 2026-08-31, ver docs § 3.

⚠️ **Esta fuente programa de todo**: junto a los conciertos publica teatro,
congresos académicos y ferias de bodas. Es el mismo problema que llevó a
acotar Idartes, pero **la respuesta ya no es la misma**: desde que existe la
cola de moderación nada se publica solo, así que la fuente entra completa y
lo que no es música se descarta en la revisión. Es la primera fuente que se
suma bajo esa premisa.

Se probó filtrar en el origen y no funciona:

- El selector "tipo → Conciertos" del sitio manda `?tipo=103`, y **la
  respuesta es idéntica a la de sin filtro**: la página 1 con y sin el
  parámetro devuelve los mismos 16 eventos, congreso académico y feria de
  bodas incluidos. El filtro es del navegador, no del servidor.
- El `@type` del JSON-LD es siempre `Event`, nunca `MusicEvent`.
- La URL de la ficha es un slug sin tipo (`/agenda-de-eventos/jorge-drexler`),
  así que tampoco sirve el truco que sí funciona en Idartes.

**Es la primera fuente del proyecto que publica schema.org/Event**, contra
lo que decía la auditoría de venues ("ningún venue auditado publica
schema.org/Event"). De ahí salen fecha, descripción, imagen y sala, sin
tener que adivinar nada del HTML.
"""
import json
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

from bogota_music_intel.scrapers import http
from bogota_music_intel.scrapers.models import ScrapedEvent

SOURCE = "visitbogota"
BASE_URL = "https://visitbogota.co"
AGENDA_URL = f"{BASE_URL}/es/agenda-de-eventos"
BOGOTA_TZ = ZoneInfo("America/Bogota")

# Una ficha por evento y unas 5 páginas de listado: son ~85 peticiones por
# corrida contra un sitio del distrito. El ritmo se controla **acá dentro** y
# no en el llamador, que es la regla dura del proyecto: dejarlo del lado del
# CLI ya falló una vez con MusicBrainz.
PAUSA_ENTRE_PETICIONES = 0.5

# Tope de seguridad por si el paginador devuelve algo raro: sin esto, un
# bucle mal leído podría pedir páginas indefinidamente.
MAX_PAGINAS = 15


def _sopa(url: str) -> BeautifulSoup:
    time.sleep(PAUSA_ENTRE_PETICIONES)
    return BeautifulSoup(http.get(url).text, "lxml")


def _ultima_pagina(soup: BeautifulSoup) -> int:
    """Cuántas páginas tiene el listado, leído del paginador.

    Se descubre en vez de fijarse: el número cambia con la temporada, y
    dejarlo fijo haría que la cartelera se corte sin avisar.
    """
    numeros = [0]
    for enlace in soup.select(".pager a[href]"):
        href = enlace["href"]
        if "page=" not in href:
            continue
        # El paginador de Drupal usa `?page=0,,N` (urlencodeado).
        cola = href.split("page=")[-1].replace("%2C", ",")
        pedazos = [p for p in cola.split(",") if p.isdigit()]
        if pedazos:
            numeros.append(int(pedazos[-1]))
    return min(max(numeros), MAX_PAGINAS - 1)


def _json_ld_del_evento(soup: BeautifulSoup) -> dict | None:
    for etiqueta in soup.find_all("script", type="application/ld+json"):
        if not etiqueta.string:
            continue
        try:
            datos = json.loads(etiqueta.string)
        except json.JSONDecodeError:
            continue
        if isinstance(datos, dict) and datos.get("@type") == "Event":
            return datos
    return None


def _fecha(valor: str | None) -> datetime | None:
    """`startDate` viene como "2026-09-06": día, sin hora.

    Se ancla a medianoche de Bogotá y no a UTC. Guardarla como UTC la
    correría cinco horas y el evento aparecería el día anterior — el mismo
    error que ya se cometió dos veces en este proyecto.
    """
    if not valor:
        return None
    try:
        return datetime.fromisoformat(valor).replace(tzinfo=BOGOTA_TZ)
    except ValueError:
        return None


def _slug(href: str) -> str:
    return href.rstrip("/").split("/")[-1]


def _evento_desde_ficha(href: str) -> ScrapedEvent | None:
    url = href if href.startswith("http") else f"{BASE_URL}{href}"
    datos = _json_ld_del_evento(_sopa(url))
    if not datos or not datos.get("name"):
        return None

    lugar = datos.get("location") or {}
    imagenes = datos.get("image") or []
    inicio = _fecha(datos.get("startDate"))
    fin = _fecha(datos.get("endDate"))

    return ScrapedEvent(
        source=SOURCE,
        # El slug es la identidad que usa el propio sitio, y sobrevive a que
        # corrijan el título o la fecha.
        source_event_id=_slug(href),
        venue_name_raw=(lugar.get("name") or "").strip() or "Sin sala",
        title=" ".join(datos["name"].split()),
        source_url=url,
        starts_at=inicio,
        # Varias fichas cubren más de un día: un festival de dos jornadas,
        # o dos funciones del mismo artista. La fuente no las separa y
        # separarlas nosotros sería inventar cuál es cuál.
        ends_at=fin if fin and inicio and fin != inicio else None,
        description=(datos.get("description") or "").strip() or None,
        # `offers.price` NO se importa: viene "0" con `url: {}` en todas las
        # fichas revisadas —Jorge Drexler, Álvaro Díaz, Festival Cordillera,
        # Sara Landry, Jazz al Parque, Wedding Open House—, o sea que es un
        # relleno del gestor de contenidos y no un precio. Traerlo anunciaría
        # como gratis un show de $200.000.
        price_text=None,
        image_url=imagenes[0] if isinstance(imagenes, list) and imagenes else None,
        raw={"json_ld_location": lugar},
    )


def scrape() -> list[ScrapedEvent]:
    primera = _sopa(AGENDA_URL)
    ultima = _ultima_pagina(primera)

    fichas: list[str] = []
    for pagina in range(ultima + 1):
        soup = primera if pagina == 0 else _sopa(f"{AGENDA_URL}?page=0%2C%2C{pagina}")
        for tarjeta in soup.select(".event-info"):
            enlace = tarjeta.find_parent("a", href=True)
            if enlace:
                fichas.append(enlace["href"])

    eventos: list[ScrapedEvent] = []
    vistos: set[str] = set()
    for href in fichas:
        if href in vistos:
            continue
        vistos.add(href)
        evento = _evento_desde_ficha(href)
        if evento:
            eventos.append(evento)
    return eventos
