"""Eventos que Juan sacó de la base a mano, y que no deben volver.

Por qué existe esto y no una bandera de "no mostrar": borrar la fila no
alcanza en una fuente que sigue activa. `save_events` hace upsert de todo lo
que el scraper encuentra, así que un `DELETE` dura hasta la próxima corrida
del cron y el evento reaparece solo. Para que un descarte persista hay que
frenarlo **antes** de guardar.

Es una excepción consciente a "guardar crudo, filtrar y clasificar en
lectura" (ver CLAUDE.md). Esa regla existe para no tener que re-scrapear
cuando cambia el criterio editorial, y sigue valiendo para el criterio
editorial. Acá no se está aplicando un criterio: es Juan diciendo "este
evento no me interesa y no lo quiero ni en la base". La contrapartida es que
sacar una entrada de esta lista no recupera el pasado — hay que esperar a
que el scraper lo vuelva a ver.

La limpieza de lo que ya está guardado sale gratis: `_prune_missing_events`
borra los eventos futuros de una fuente que dejaron de aparecer en su
cartelera, y un evento bloqueado deja de aparecer.

Para agregar una entrada hace falta la decisión de Juan, no un criterio
propio. Cualquier cosa que se pueda expresar como regla —no es música, es
una fiesta, es internacional— va al clasificador, no acá.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class EventoExcluido:
    titulo: str
    motivo: str


# Clave: (source, source_event_id), la identidad estable del evento.
EVENTOS_EXCLUIDOS: dict[tuple[str, str], EventoExcluido] = {
    ("movistar_arena", "laura-brenda"): EventoExcluido(
        titulo="Laura & Brenda",
        motivo=(
            "Juan lo sacó el 2026-08-28: «no me parece un concierto a tener "
            "en cuenta». No se pudo saber qué es —la página de "
            "movistararena.co no dice quiénes son Laura y Brenda, ni género "
            "ni país, y MusicBrainz no lo resuelve—, así que tampoco había "
            "regla que lo excluyera. Es una decisión, no una clasificación."
        ),
    ),
}


def esta_excluido(source: str, source_event_id: str) -> bool:
    return (source, source_event_id) in EVENTOS_EXCLUIDOS
