"""Vocabulario de la clasificación editorial, en un módulo aparte para que
las listas curadas y el clasificador lo compartan sin importarse entre sí.

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
FUENTE_CATEGORIA = "source_category"
FUENTE_PATRON = "exclusion_pattern"
# Ninguna regla lo excluyó, así que es música. Se llama "asumido" y no
# "confirmado" a propósito: nadie verificó que lo sea, solo que nada dice
# que no. Es el caso más común y por eso conviene que el nombre no mienta.
FUENTE_ASUMIDO = "assumed_music"

# ⚠️ Faltan dos que existieron hasta el 2026-09-08: `curated_artist` y
# `musicbrainz`. Las dos servían para llenar `is_local`, que dejó de
# calcularse — lo escribe una persona en /admin. Siguen apareciendo en filas
# viejas de `classification_source`, así que si algo lee esa columna tiene
# que tolerarlas; simplemente no se producen más.
