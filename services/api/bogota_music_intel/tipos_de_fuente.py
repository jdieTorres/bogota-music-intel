"""Fuentes que publican de verdad qué tipo de evento es, y su traducción.

La mayoría de las carteleras no lo dicen: publican un género, una taxonomía de
marketing, o nada. Cuando una fuente **sí** distingue un concierto de una
fiesta y de un festival, esa señal es más fuerte que cualquier heurística
nuestra sobre el título — y desaprovecharla sería adivinar teniendo el dato.

⚠️ **Se mapea fuente por fuente y no se hereda.** Es la misma regla que ya rige
para `categoria_no_musical`: la palabra "fiesta" en una fuente puede significar
lo que en otra significa otra cosa. Por eso la clave es `(source, category)` y
no `category` a secas.

Solo entran valores comprobados contra fichas reales, y la evidencia va en el
comentario. Un valor que no está acá no se traduce: el evento sigue el camino
normal del clasificador y termina en "música asumida", que es el hueco honesto.
"""
from bogota_music_intel.tipos_evento import FESTIVAL, FIESTA, MUSICA

# Clave: (source, valor crudo de `category`). Valor: nuestro `event_type`.
TIPOS_POR_FUENTE: dict[tuple[str, str], str] = {
    # ticketlive codifica el tipo en la URL de cada evento
    # (`/co/<tipo>/<slug>/`) y el scraper lo guarda en `category`. Comprobado
    # contra 14 fichas el 2026-09-08: el tipo de la URL es consistente, a
    # diferencia de las categorías de WooCommerce (`externos`, `destacado`),
    # que describen **cómo se vende** el evento y no qué es.
    ("ticketlive", "conciertos"): MUSICA,
    ("ticketlive", "fiesta"): FIESTA,
    # `rave` es una noche sin artista de cartel, igual que la fiesta. Decisión
    # de Juan el 2026-09-08: no merece pestaña propia.
    ("ticketlive", "rave"): FIESTA,
    ("ticketlive", "festivales"): FESTIVAL,
    # `dix-fm` es una marca de noches temáticas del Teatro Republik, no un
    # tipo de evento: en la primera corrida trajo "Karol G Night", "Shakira
    # Night" y "Yeison Jiménez & Noche de Cantina". No son conciertos de esos
    # artistas — son fiestas con un repertorio. Confirmado por Juan el
    # 2026-09-08, que es quien conoce la sala; las tres fichas por sí solas no
    # alcanzaban para afirmarlo.
    ("ticketlive", "dix-fm"): FIESTA,
}


def tipo_de_fuente(source: str | None, category: str | None) -> str | None:
    """El `event_type` que declara la fuente, o None si no lo declara."""
    if not source or not category:
        return None
    return TIPOS_POR_FUENTE.get((source, category.strip().lower()))
