"""Vocabulario de la clasificación editorial, en un módulo aparte para que
la lista curada y el clasificador lo compartan sin importarse entre sí.

Los valores son los mismos que acepta el `check` de la columna
`events.event_type` (migración 20260828000000, ampliada por
20260828010000 con `fiesta` y por 20260901000000 con `festival`).
"""

MUSICA = "music"
# Noche o ciclo de una sala, sin artista de cartel. Se muestra en la
# cartelera —es escena local— pero en su propia pestaña: ordenar una noche
# de club junto a un concierto del Movistar no compara nada.
FIESTA = "fiesta"
# Varios días y varios artistas, ninguno de cartel: Rock al Parque, Festival
# Cordillera. Comparte con la fiesta que no hay a quién preguntarle el
# origen, pero no se mezcla con ella — una noche de club y tres días en el
# Simón Bolívar no se comparan en la misma lista. Pestaña propia.
FESTIVAL = "festival"
NO_MUSICA = "not_music"

# De dónde salió la clasificación, para poder auditarla después.
FUENTE_MANUAL = "manual"
FUENTE_CICLO = "curated_cycle"
FUENTE_FESTIVAL = "curated_festival"
FUENTE_ARTISTA_CURADO = "curated_artist"
FUENTE_CATEGORIA = "source_category"
FUENTE_PATRON = "exclusion_pattern"
FUENTE_MUSICBRAINZ = "musicbrainz"
# No matcheó ninguna exclusión, así que se asume música, pero el artista no
# se pudo resolver: el origen queda desconocido, no "internacional".
FUENTE_ASUMIDO = "assumed_music"
