"""Coordenadas verificadas a mano, para salas que Nominatim no resuelve solo.

Por qué existe este archivo: relajar la búsqueda automática para que
encuentre más salas produce pines seguros pero equivocados. Buscando
"Lourdes, Chapinero" Nominatim devuelve con toda confianza la **iglesia**
Nuestra Señora de Lourdes y el parque del mismo nombre — ninguno es el
Lourdes Music Hall. Por eso el geocodificador se mantiene estricto y lo que
no resuelve se cura acá, con la evidencia anotada.

**Por qué esto no se puede automatizar en Bogotá** (verificado el
2026-08-27, cierra la discusión): OpenStreetMap no tiene numeración de casas
en la ciudad. Se probó la consulta libre, la búsqueda por intersección y la
API estructurada de Nominatim, y en las tres el resultado trae
`house_number = null`. Buscando "Carrera 13 #48-90" devuelve cuatro puntos
repartidos entre Usme y Usaquén, porque solo matchea el nombre de la calle.
No hay geocodificador que ajustar: el punto lo tiene que poner una persona.

Reglas para agregar una entrada:
1. La coordenada tiene que venir de una fuente verificable (el POI en
   OpenStreetMap, Google Maps, el mapa del propio sitio de la sala), nunca
   de memoria.
2. Dejar escrito en `evidencia` de dónde salió y por qué se confía.
3. Si hay duda, no agregarla: la sala aparece como "sin ubicar" en el mapa,
   que es un estado honesto y visible.

Cómo se comprobaron las de abajo: con geocodificación inversa contra
Nominatim, mirando que el punto caiga sobre la calle que la propia sala
publica como dirección. Es una verificación independiente de quien pasó la
coordenada, y detecta el error típico —lat/lon invertidas, un dígito de
más— sin necesidad de abrir un mapa.
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
            "cuadra. La búsqueda automática no la resuelve: el POI de OSM se "
            "llama solo 'Teatro Libre', y por dirección tampoco, porque "
            "OpenStreetMap no tiene numeración de casas en Bogotá. "
            "Verificado 2026-08-27."
        ),
    ),
    "lourdes-music-hall": CoordenadaCurada(
        latitude=4.651472504334688,
        longitude=-74.06321054828197,
        evidencia=(
            "Coordenada tomada de Google Maps por Juan (2026-08-27). La "
            "geocodificación inversa contra Nominatim la ubica sobre la "
            "Avenida Carrera 13, que coincide con la dirección publicada por "
            "la sala: Cra 13 #64-56, Chapinero. Nominatim no la resuelve "
            "sola —el POI no existe en OpenStreetMap— y buscar 'Lourdes, "
            "Chapinero' devuelve con toda confianza la iglesia Nuestra "
            "Señora de Lourdes, no la sala."
        ),
    ),
    "capital-live-concerts": CoordenadaCurada(
        latitude=4.636510619461236,
        longitude=-74.06548063108818,
        evidencia=(
            "Coordenada tomada de Google Maps por Juan (2026-08-27). La "
            "geocodificación inversa la ubica sobre la Avenida Carrera 13, "
            "que coincide con la dirección que publica la fuente: Carrera 13 "
            "#48-90. Queda al sur de Lourdes Music Hall (calle 48 contra "
            "calle 64), como corresponde a la numeración de Bogotá."
        ),
    ),
    "auditorio-mayor": CoordenadaCurada(
        latitude=4.608671916502714,
        longitude=-74.06977448527165,
        evidencia=(
            "Coordenada tomada de Google Maps por Juan (2026-08-27). La "
            "geocodificación inversa la ubica sobre la Calle 23, que "
            "coincide con la dirección publicada: Calle 23 #6-19. Nominatim "
            "resolvía esa dirección a un punto cualquiera de la Calle 23 en "
            "Fontibón, a más de 4 km, por matchear solo el nombre de la vía."
        ),
    ),
    "teatro-libre-de-bogota-sala-centro": CoordenadaCurada(
        latitude=4.597590474927988,
        longitude=-74.07026915952234,
        evidencia=(
            "Coordenada tomada de Google Maps por Juan (2026-08-27). La "
            "geocodificación inversa la ubica en la Calle 12B, barrio La "
            "Concordia (La Candelaria), que coincide con la dirección "
            "publicada: Calle 12B #2-44. Corrobora además el POI "
            "'Escuela Teatro Libre' de OpenStreetMap, a unos 30 metros; ese "
            "POI solo no alcanzaba, porque es la escuela y no la sede."
        ),
    ),
}
