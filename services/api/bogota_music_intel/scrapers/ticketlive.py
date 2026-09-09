"""Ticketlive: ticketera con WooCommerce y schema.org/MusicEvent.

Entró el 2026-09-08, cuando el giro a la escena underground dejó al cron con
cinco fuentes y ninguna que llegara a los clubes. De las cuatro candidatas
auditadas es la mejor estructurada: publica `MusicEvent` con la ciudad en
`addressLocality` y el tipo de evento en la propia URL.

## Se piden dos cosas, no una, y es a propósito

El catálogo tiene más de 600 productos. Pedir la ficha de cada uno serían 600
peticiones por corrida, que además de lento es grosero. Entonces:

1. **La Store API de WooCommerce** (`/wp-json/wc/store/v1/products`) enumera
   todo en páginas de 100. Trae título, enlace, precio e imagen — **pero no la
   sala ni la fecha**.
2. El título sí las lleva: *"Boletas Camila en concierto: 27 noviembre 2026,
   Bogotá"*. Con eso se filtra barato —ciudad, fecha futura, tipo— y **solo se
   pide la ficha de lo que sobrevive**, que es donde está la sala.

En una corrida típica eso son unas pocas decenas de fichas en vez de 600.

## Lo que esta fuente publica mal, medido contra 14 fichas el 2026-09-08

- ⚠️ **La hora es relleno y se descarta entera.** Seis de doce fichas decían
  las 15:00, y el resto iba de las 10:00 a las 19:00 — Militarie Gun en La
  Sucursal figuraba de 2 a 5 de la tarde. No hay forma de saber cuáles son
  reales, así que **entra solo la fecha**. Publicar una hora de relleno es
  exactamente el dato inventado que este proyecto no permite.
- ⚠️ **`performer` no sirve**: trae `"Artista por confirmar"` o `"Boletas,
  fechas y conciertos…"`. Parece dato estructurado y es un marcador de
  posición. El artista sale del título.
- ⚠️ **Un precio de 0 no es gratis, es "no publicado".** Sale 0 en todo lo del
  Movistar, Royal Center y los festivales. Por eso el 0 se descarta antes de
  pasar por `precios.desde_piso`, que sí lo interpretaría como gratis.
- **`location.name` pega la sala y la dirección con una coma sin espacio**
  ("La Sucursal,Calle 59 13 32, Bogotá"). Se parte por la primera coma.
- ⚠️ **Escribe la misma sala de varias maneras**: "La Sucursal" y "La Sucursal
  Venue", "Vive Claro" y "Vive Claro Music Hall". Eso genera dos salas con
  slugs distintos, porque el slug sale del nombre. Las que se sepa que son la
  misma van a `SALAS_UNIFICADAS`, **acá y no en `nombres_de_salas.py`** — ese
  corrige el nombre visible pero nunca el slug, así que dejaría las dos salas
  con el mismo nombre. Los filtros de sala comparan **por prefijo** para que
  una grafía nueva no se escape.
- **Algunas fichas ponen solo la ciudad como sala** ("Bogotá"). Esos eventos
  se saltan: una sala llamada como la ciudad no se puede ubicar en el mapa.
"""
import html
import json
import re
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

from bogota_music_intel.precios import SIN_DATO, desde_piso
from bogota_music_intel.scrapers import http
from bogota_music_intel.scrapers.dateparse import parse_spanish_date
from bogota_music_intel.scrapers.models import ScrapedEvent
from bogota_music_intel.tipos_evento import FESTIVAL, FIESTA, MUSICA, NO_MUSICA

SOURCE = "ticketlive"

BASE = "https://ticketlive.com.co"
PRODUCTOS = f"{BASE}/wp-json/wc/store/v1/products"
BOGOTA_TZ = ZoneInfo("America/Bogota")

# El tipo va en la URL: /co/<tipo>/<slug>/. Es la señal más limpia de la
# fuente y se mapea directo a nuestro vocabulario.
#
# ⚠️ La lista es blanca **con aviso**, no un comodín. En la muestra del
# 2026-09-08 apareció `dix-fm`, que no está en la taxonomía que publica el
# sitemap: la lista de tipos de esta fuente no está cerrada. Un tipo
# desconocido no se descarta —ante la duda el evento se muestra— pero se
# imprime, para que se vea en el log del cron y no dentro de tres meses.
TIPOS = {
    "conciertos": MUSICA,
    "fiesta": FIESTA,
    # `rave` es una noche sin artista de cartel, igual que la fiesta. Decisión
    # de Juan el 2026-09-08: no merece pestaña propia.
    "rave": FIESTA,
    "festivales": FESTIVAL,
    "deportes": NO_MUSICA,
    "partidos": NO_MUSICA,
    "convencion": NO_MUSICA,
}

# Salas que ya cubre otro scraper. Traerlas de acá no sumaría un evento: abriría
# un borrador duplicado que alguien tendría que unificar a mano.
#
# ⚠️ Esto **no es el criterio de escena que se descartó** el mismo día. Aquel
# pretendía que la sala decidiera si un evento entra a la cartelera; esto solo
# evita trabajo repetido. Coliseo Medplus y Parque Simón Bolívar entran, aunque
# sean masivos, porque nadie más los cubre — decisión de Juan.
SALAS_YA_CUBIERTAS = {
    "movistar arena",
    "royal center",
    "lourdes music hall",
    "latino power",
    "teatro jorge eliecer gaitan",
}

# Estadios y arenas cuya programación es toda de gira internacional o de
# artista consagrado. Se descartan en la ingesta porque su cola no la
# revisaría nadie: en la primera corrida traían BTS, Karol G, Anuel AA, Maná
# y Bad Gyal, y ninguno es lo que esta plataforma existe para promover.
#
# Se comparan por **prefijo**, no por igualdad: esta fuente escribe la misma
# sala de dos maneras —"Vive Claro" y "Vive Claro Music Hall"— y una lista de
# grafías exactas se le escapa a la tercera.
#
# ⚠️ **Coliseo Medplus NO está acá, a propósito.** Es masivo y trae Gorillaz,
# The Strokes y Calvin Harris, pero Juan decidió el 2026-09-08 dejarlo entrar
# y descartar esos eventos a mano, para medir en la práctica si conviene
# vetarlo o si el resto de su programación compensa. Si la respuesta resulta
# ser que no compensa, se agrega una línea acá.
SALAS_MASIVAS = (
    "estadio el campin",
    "estadio techo",
    "vive claro",
    "chamorro city hall",
)

# La misma sala escrita de dos maneras. Se unifica **acá y no en
# `nombres_de_salas.py`**, y la diferencia importa: aquel corrige el nombre
# visible pero nunca el slug, así que dejaría dos salas distintas con dos
# nombres iguales. El slug sale de `venue_name_raw`, o sea de lo que devuelve
# este parser: es el único punto donde se pueden fusionar.
#
# La ficha no lo prueba —"La Sucursal" trae dirección de calle y "La Sucursal
# Venue" solo la ciudad—, así que la evidencia es de Juan, que conoce la sala
# y lo pidió el 2026-09-08.
SALAS_UNIFICADAS = {
    "la sucursal venue": "La Sucursal",
}

# "Boletas <lo que importa> ... , <día mes año>, <ciudad>"
_TITULO = re.compile(
    r"^\s*(?:Boletas\s+)?(?P<titulo>.+?)[,:]\s*"
    r"(?P<fecha>\d{1,2}\s+[a-záéíóú]+\s+\d{4})\s*,\s*(?P<ciudad>[^,]+?)\s*$",
    re.IGNORECASE,
)


def _sin_acentos(texto: str) -> str:
    import unicodedata

    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


def _clave_de_sala(nombre: str) -> str:
    return " ".join(_sin_acentos(nombre).lower().split())


def _tipo_de_url(permalink: str) -> tuple[str, str | None]:
    """Devuelve (tipo crudo, nuestro event_type o None si no lo conocemos)."""
    partes = [p for p in permalink.split("/") if p]
    crudo = partes[-2] if len(partes) >= 2 else ""
    return crudo, TIPOS.get(crudo)


def _del_titulo(nombre: str) -> tuple[str, datetime, str] | None:
    """Saca título, fecha y ciudad del nombre del producto.

    Sin esto habría que pedir las 600 fichas para saber cuáles son de Bogotá y
    cuáles ya pasaron. El formato lo pone la propia ticketera y es constante en
    las 14 fichas medidas; si algún día cambia, este parser devuelve None y el
    evento se salta — que es preferible a inventarle una fecha.
    """
    # WooCommerce devuelve el nombre con entidades HTML: "Yeison Jiménez
    # &#038; Noche de Cantina". Sin decodificar, el ampersand llega así hasta
    # la cartelera.
    m = _TITULO.match(html.unescape(nombre))
    if not m:
        return None
    fecha = parse_spanish_date(m.group("fecha"))
    if fecha is None:
        return None
    # Medianoche de Bogotá: esta fuente no publica hora utilizable, y anclar a
    # UTC correría el evento cinco horas y lo mostraría el día anterior.
    return (
        m.group("titulo").strip(),
        fecha.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=BOGOTA_TZ),
        m.group("ciudad").strip(),
    )


def _precio(monto):
    """El precio de la oferta, o None si la fuente no publicó ninguno.

    ⚠️ **El 0 se descarta antes de llegar a `desde_piso`.** Esa función lee un
    0 como "gratis" —y hace bien, porque Rockal Live sí publica shows sin
    costo—, pero acá el 0 significa "no lo vendemos nosotros": sale en todo lo
    de los estadios y las arenas. Guardarlo como gratis diría que la entrada
    al Gorillaz es libre.
    """
    if monto in (None, "", "0", 0):
        return None
    return desde_piso(monto)


# Una petición por segundo entre fichas.
#
# ⚠️ **El ritmo va acá y nunca en el CLI que llama.** Es la regla del proyecto,
# y se pagó con MusicBrainz: espaciar desde el bucle del llamador dejaba
# escapar dos peticiones pegadas al arrancar.
#
# Sin esto son unas 30 peticiones seguidas contra un servidor ajeno. Desde una
# máquina de casa pasa; desde una IP de datacenter —que es donde corre el
# cron— es lo que un WAF corta. Que el diseño de dos pasos exista para no ser
# groseros y después no espaciara las que sí pide era una contradicción.
SEGUNDOS_ENTRE_FICHAS = 1.0
_ultima_peticion = 0.0


def _esperar_turno() -> None:
    global _ultima_peticion
    espera = SEGUNDOS_ENTRE_FICHAS - (time.monotonic() - _ultima_peticion)
    if espera > 0:
        time.sleep(espera)
    _ultima_peticion = time.monotonic()


def _ficha(url: str) -> dict | None:
    """El `MusicEvent` de la ficha, que es donde vive la sala."""
    _esperar_turno()
    soup = BeautifulSoup(http.get(url).text, "html.parser")
    for etiqueta in soup.find_all("script", type="application/ld+json"):
        if not etiqueta.string:
            continue
        try:
            datos = json.loads(etiqueta.string)
        except json.JSONDecodeError:
            continue
        for nodo in datos.get("@graph", [datos]) if isinstance(datos, dict) else datos:
            if isinstance(nodo, dict) and nodo.get("@type") in ("MusicEvent", "Event"):
                return nodo
    return None


def _productos() -> list[dict]:
    """Todo el catálogo, en páginas de 100."""
    todos: list[dict] = []
    pagina = 1
    while True:
        lote = http.get(PRODUCTOS, params={"per_page": 100, "page": pagina}).json()
        if not lote:
            break
        todos.extend(lote)
        pagina += 1
        # Un catálogo que crece sin fin sería un bucle infinito por un error de
        # la fuente, no por su tamaño real.
        if pagina > 20:
            break
    return todos


def scrape() -> list[ScrapedEvent]:
    ahora = datetime.now(BOGOTA_TZ)
    eventos: list[ScrapedEvent] = []
    tipos_desconocidos: set[str] = set()

    for producto in _productos():
        partes = _del_titulo(producto.get("name") or "")
        if partes is None:
            continue
        titulo, fecha, ciudad = partes

        # Fuera de Bogotá se descarta acá y no al leer. No es criterio
        # editorial —que sí se aplica en lectura— sino alcance: la plataforma
        # es de Bogotá, y guardar el catálogo de Medellín sería guardar cientos
        # de filas que ninguna vista va a mirar nunca. Mismo criterio que
        # `rockal_live.py`, que ya filtra por `locationCity`.
        if _clave_de_sala(ciudad) != "bogota":
            continue
        if fecha < ahora.replace(hour=0, minute=0, second=0, microsecond=0):
            continue

        permalink = producto.get("permalink") or ""
        crudo, tipo = _tipo_de_url(permalink)
        if tipo == NO_MUSICA:
            continue
        if tipo is None and crudo:
            tipos_desconocidos.add(crudo)

        ficha = _ficha(permalink)
        if ficha is None:
            continue
        lugar = (ficha.get("location") or {}).get("name") or ""
        sala, _, direccion = lugar.partition(",")
        sala = sala.strip()
        clave = _clave_de_sala(sala)

        # Sin sala no hay evento que ubicar. Algunas fichas ponen solo la
        # ciudad en `location.name` —"Bogotá"— y guardarlo crearía una sala
        # llamada como la ciudad, con un pin imposible de poner. Es el hueco
        # honesto: se salta y no se inventa un lugar.
        if not sala or clave == _clave_de_sala(ciudad):
            continue
        # La grafía se unifica antes de cualquier filtro: el slug sale de
        # este nombre, así que dos formas de escribirlo son dos salas.
        sala = SALAS_UNIFICADAS.get(clave, sala)
        clave = _clave_de_sala(sala)

        if clave in SALAS_YA_CUBIERTAS:
            continue
        if clave.startswith(SALAS_MASIVAS):
            continue

        monto = ((ficha.get("offers") or {}) or {}).get("price")
        precio = _precio(monto)

        eventos.append(
            ScrapedEvent(
                source=SOURCE,
                # El id del producto en WooCommerce: estable aunque cambien el
                # slug o el título, a diferencia de la URL.
                source_event_id=str(producto["id"]),
                venue_name_raw=sala,
                title=titulo,
                source_url=permalink,
                starts_at=fecha,
                # Solo el día: la hora que publica esta fuente es relleno.
                date_precision="day",
                description=(ficha.get("description") or "").strip() or None,
                price_text=str(monto) if monto else None,
                **(precio.as_row() if precio else SIN_DATO),
                # El tipo crudo de la URL. El clasificador decide con esto; no
                # se traduce acá porque la ingesta no clasifica.
                category=crudo or None,
                ticket_url=permalink,
                image_url=(ficha.get("image") or [None])[0],
                venue_address=direccion.strip() or None,
                raw={"tipo_url": crudo},
            )
        )

    if tipos_desconocidos:
        print(
            f"  [ticketlive] tipos que no están en el mapa: {', '.join(sorted(tipos_desconocidos))}. "
            "Sus eventos entraron igual; conviene decidir a qué event_type van."
        )
    return eventos
