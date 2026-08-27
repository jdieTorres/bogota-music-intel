"""Coordenadas verificadas a mano, para salas que Nominatim no resuelve solo.

Por qué existe este archivo: relajar la búsqueda automática para que
encuentre más salas produce pines seguros pero equivocados. Buscando
"Lourdes, Chapinero" Nominatim devuelve con toda confianza la **iglesia**
Nuestra Señora de Lourdes y el parque del mismo nombre — ninguno es el
Lourdes Music Hall. Por eso el geocodificador se mantiene estricto y lo que
no resuelve se cura acá, con la evidencia anotada.

Reglas para agregar una entrada:
1. La coordenada tiene que venir de una fuente verificable (el POI en
   OpenStreetMap, el mapa del propio sitio de la sala), nunca de memoria.
2. Dejar escrito en `evidencia` de dónde salió y por qué se confía.
3. Si hay duda, no agregarla: la sala aparece como "sin ubicar" en el mapa,
   que es un estado honesto y visible.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class CoordenadaCurada:
    latitude: float
    longitude: float
    evidencia: str


# Clave: slug de la sala en la tabla venues.
COORDENADAS_CURADAS: dict[str, CoordenadaCurada] = {
    "teatro-libre-de-bogota-sala-chapinero": CoordenadaCurada(
        latitude=4.648316,
        longitude=-74.062700,
        evidencia=(
            "POI 'Teatro Libre' en OpenStreetMap (amenity), ubicado en "
            "Calle 62 9A-84, Chapinero. Coincide con la dirección que publica "
            "la fuente para esta sala (CALLE 62 # 9A-65): misma calle y misma "
            "cuadra. La búsqueda automática no lo encuentra porque el nombre "
            "guardado incluye 'de Bogotá Sala Chapinero'. Verificado 2026-08-27."
        ),
    ),
}
