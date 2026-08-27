"""Vocabulario de la clasificación editorial, en un módulo aparte para que
la lista curada y el clasificador lo compartan sin importarse entre sí.

Los valores son los mismos que acepta el `check` de la columna
`events.event_type` (migración 20260828000000).
"""

MUSICA = "music"
NO_MUSICA = "not_music"

# De dónde salió la clasificación, para poder auditarla después.
FUENTE_MANUAL = "manual"
FUENTE_CATEGORIA = "source_category"
FUENTE_PATRON = "exclusion_pattern"
FUENTE_MUSICBRAINZ = "musicbrainz"
# No matcheó ninguna exclusión, así que se asume música, pero el artista no
# se pudo resolver: el origen queda desconocido, no "internacional".
FUENTE_ASUMIDO = "assumed_music"
