"""Origen de artistas que MusicBrainz no resuelve, verificado a mano.

Por qué existe: MusicBrainz cubre bien al internacional consagrado y mal al
local emergente, que es exactamente al revés de lo que esta plataforma
necesita. De los 58 eventos de la primera corrida, solo 3 quedaron
confirmados como locales, y los tres son de música popular con catálogo
comercial. Artistas colombianos reales —El Kalvo, PABLOPABLO, Todo Copas—
quedaron sin resolver; El Kalvo incluso figura en MusicBrainz **sin país**.

Esta lista se consulta **antes** que MusicBrainz, así que también sirve
para corregirlo cuando se equivoca.

Reglas para agregar una entrada:
1. La nacionalidad tiene que venir de una fuente verificable —la página del
   evento, el sitio del artista, una nota de prensa—, nunca de memoria ni
   deducida del nombre.
2. Dejar escrito en `evidencia` de dónde salió.
3. Si hay duda, no agregarla: el evento se muestra igual, solo que sin
   destacarse. Un "no sabemos" no le hace daño a nadie; un artista marcado
   como local sin serlo ensucia justamente lo que la cartelera promueve.
"""
import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class ArtistaCurado:
    nombre: str
    es_local: bool
    evidencia: str
    # Cómo lo escribe mal la sala. El emparejamiento es exacto a propósito
    # (ver `artista_curado`), así que una errata de la fuente deja la
    # entrada sin usar. Royal Center publica "SLAUHGTER TO PREVAIL".
    tambien_como: tuple[str, ...] = ()

    @property
    def grafias(self) -> tuple[str, ...]:
        return (self.nombre, *self.tambien_como)


ARTISTAS: list[ArtistaCurado] = [
    ArtistaCurado(
        nombre="Todo Copas",
        es_local=True,
        evidencia=(
            "Grupo de hip hop colombiano. La página del evento en "
            "tickets.latinopower.com.co lo describe textualmente como «una "
            "de las agrupaciones más representativas del hip hop "
            "colombiano», celebrando 20 años de trayectoria con la gira "
            "'Rap con Criterio'. El título del evento ('Todo copas en "
            "Latino Power Bogota 20 Años') hacía parecer que los 20 años "
            "eran de la sala. Verificado 2026-08-27."
        ),
    ),
    ArtistaCurado(
        nombre="Ancestral Beats",
        es_local=True,
        evidencia=(
            "La ficha del evento en idartes.gov.co lo dice explícitamente: "
            "«el productor colombiano Nicolás Cantor, conocido como "
            "Ancestral Beats». Su obra 'Human Design' cruza electrónica con "
            "sonoridades afrocolombianas e indígenas. MusicBrainz lo tiene "
            "pero sin país. Verificado 2026-08-28."
        ),
    ),
    ArtistaCurado(
        nombre="El Kalvo",
        es_local=True,
        evidencia=(
            "Rapero bogotano; lo confirmó Juan el 2026-08-28. Concuerda con "
            "la fuente: el evento se titula «20 años del rap rolo» —rolo es "
            "el gentilicio de Bogotá— y la ficha de Idartes describe una "
            "obra que retrata «la vida de Bogotá desde una perspectiva "
            "íntima». MusicBrainz lo tiene pero sin país, que es justo el "
            "hueco que esta lista existe para cubrir."
        ),
    ),
    ArtistaCurado(
        nombre="Mukangu",
        es_local=True,
        evidencia=(
            "Agrupación colombiana; lo confirmó Juan el 2026-08-28. "
            "MusicBrainz no la reconoce y la página de Latino Power publica "
            "el evento sin biografía, así que no hay fuente en línea que "
            "resuelva el origen: acá vale el conocimiento de escena."
        ),
    ),
    ArtistaCurado(
        nombre="Atake Mapalé",
        es_local=True,
        evidencia=(
            "Agrupación colombiana; lo confirmó Juan el 2026-08-28. Coherente "
            "con el nombre —el mapalé es un ritmo del Caribe colombiano— y "
            "con su ficha en Apple Music Colombia. Latino Power la publica "
            "sin acento («Atake Mapale»), pero eso no afecta el "
            "emparejamiento, que compara sin acentos."
        ),
    ),
    ArtistaCurado(
        nombre="Los Yoryis",
        es_local=True,
        evidencia=(
            "Agrupación colombiana; lo confirmó Juan el 2026-08-28. Comparte "
            "cartel con Mukangu y Atake Mapalé en Latino Power, que publica "
            "el evento sin biografía de ninguno de los tres."
        ),
    ),
    ArtistaCurado(
        nombre="pablopablo",
        es_local=False,
        evidencia=(
            "NO es colombiano, contra lo que se supuso al principio por el "
            "contexto: es Pablo Drexler, hijo de Jorge Drexler (uruguayo) y "
            "Ana Laan (española), y su carrera está en la escena "
            "alternativa española — así lo cuentan Infobae (2025-05-26) y "
            "Rolling Stone en Español. Detalle que lo confirma solo: Jorge "
            "Drexler toca en esta misma cartelera, ya clasificado como "
            "internacional. Verificado 2026-08-28."
        ),
    ),
    ArtistaCurado(
        nombre="Slaughter to Prevail",
        es_local=False,
        tambien_como=("SLAUHGTER TO PREVAIL",),
        evidencia=(
            "Banda rusa; lo confirmó Juan el 2026-08-28. MusicBrainz la "
            "tiene pero sin país, así que su búsqueda no alcanzaba. Royal "
            "Center publica el nombre con la errata «SLAUHGTER», que es la "
            "grafía por la que entra el emparejamiento."
        ),
    ),
]


def _normalizar(texto: str) -> str:
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", sin_acentos.casefold())).strip()


def artista_curado(nombre: str) -> ArtistaCurado | None:
    """Busca el nombre ya limpio contra la lista. Exige coincidencia exacta
    del nombre normalizado: acá no se hace la comparación tolerante que se
    usa con MusicBrainz, porque una entrada curada afirma algo y no conviene
    que se aplique a un artista parecido pero distinto."""
    objetivo = _normalizar(nombre)
    if not objetivo:
        return None
    for artista in ARTISTAS:
        if any(_normalizar(g) == objetivo for g in artista.grafias):
            return artista
    return None
