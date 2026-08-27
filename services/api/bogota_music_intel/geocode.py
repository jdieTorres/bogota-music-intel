"""Geocodificación de salas contra Nominatim (OpenStreetMap).

No corre en el cron diario a propósito: las salas no se mueven, y la política
de uso de Nominatim pide no hacer geocodificación masiva ni automatizada
innecesaria. Se ejecuta a mano cuando aparece una sala nueva sin coordenadas.

Regla de oro: si no hay un resultado confiable, se deja en null. Un pin en el
lugar equivocado es peor que un pin ausente — el mapa puede mostrar "sin
ubicación" pero no puede desmentir una coordenada inventada.
"""
import time
from dataclasses import dataclass

import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# La política de uso de Nominatim exige un User-Agent identificable con
# forma de contacto, y máximo 1 petición por segundo.
USER_AGENT = "BogotaMusicIntel/0.1 (https://github.com/jdieTorres/bogota-music-intel)"
SEGUNDOS_ENTRE_PETICIONES = 1.2

# Mismo rectángulo que valida la migración de la base.
BOGOTA_LAT = (4.3, 4.9)
BOGOTA_LON = (-74.35, -73.95)

# Nominatim acepta un viewbox para priorizar resultados dentro del área.
VIEWBOX = f"{BOGOTA_LON[0]},{BOGOTA_LAT[1]},{BOGOTA_LON[1]},{BOGOTA_LAT[0]}"


# Tipos de resultado demasiado gruesos para poner un pin. El caso peligroso
# es "road": cuando Nominatim no encuentra el número de una dirección,
# matchea solo el nombre de la calle y devuelve un punto cualquiera sobre
# ella. "Carrera 13 #66-80" resolvía así a un punto en Usaquén, a más de 7 km
# del Royal Center, y dentro de Bogotá — o sea que el chequeo de límites no
# lo detecta. Un pin verosímil pero equivocado es el peor resultado posible.
TIPOS_DEMASIADO_GRUESOS = {
    "road", "suburb", "neighbourhood", "quarter", "city_block",
    "city", "town", "municipality", "county", "state", "region",
    "postcode", "country",
}


@dataclass(frozen=True)
class Ubicacion:
    latitude: float
    longitude: float
    query: str
    display_name: str


def en_bogota(lat: float, lon: float) -> bool:
    return BOGOTA_LAT[0] <= lat <= BOGOTA_LAT[1] and BOGOTA_LON[0] <= lon <= BOGOTA_LON[1]


def es_suficientemente_preciso(resultado: dict) -> bool:
    """Un resultado sirve si señala un lugar concreto (un teatro, un edificio,
    una dirección con número), no una calle o un barrio entero."""
    if resultado.get("category") == "highway":
        return False
    return resultado.get("addresstype") not in TIPOS_DEMASIADO_GRUESOS


def _buscar(client: httpx.Client, query: str) -> Ubicacion | None:
    respuesta = client.get(
        NOMINATIM_URL,
        params={
            "q": query,
            "format": "jsonv2",
            "limit": 5,
            "countrycodes": "co",
            "viewbox": VIEWBOX,
            "bounded": 1,
        },
    )
    respuesta.raise_for_status()

    for resultado in respuesta.json():
        if not es_suficientemente_preciso(resultado):
            continue
        lat = float(resultado["lat"])
        lon = float(resultado["lon"])
        if not en_bogota(lat, lon):
            continue
        return Ubicacion(
            latitude=lat,
            longitude=lon,
            query=query,
            display_name=resultado.get("display_name", ""),
        )
    return None


def geocodificar(
    nombre: str,
    direccion: str | None,
    ciudad: str = "Bogotá",
    client: httpx.Client | None = None,
) -> Ubicacion | None:
    """Intenta primero por dirección (mucho más preciso) y cae al nombre de
    la sala. Devuelve None si ninguna consulta da un resultado dentro de
    Bogotá; el llamador debe dejar las coordenadas en null en ese caso."""
    consultas = []
    if direccion:
        consultas.append(f"{direccion}, {ciudad}, Colombia")
    consultas.append(f"{nombre}, {ciudad}, Colombia")

    propio = client is None
    if propio:
        client = httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=30)

    try:
        for indice, consulta in enumerate(consultas):
            if indice > 0:
                time.sleep(SEGUNDOS_ENTRE_PETICIONES)
            ubicacion = _buscar(client, consulta)
            if ubicacion:
                return ubicacion
        return None
    finally:
        if propio:
            client.close()
