"""Qué fuentes corre el cron.

**Falta `visitbogota`**, que salió el 2026-09-08 al reenfocar la plataforma en
la escena de Bogotá. Su módulo sigue acá y sigue con tests: volver a
encenderlo es agregar la línea al diccionario, no reescribir el parser.

Por qué salió, con los números que lo decidieron: traía 58 filas y **49 eran
de escenarios masivos** —40 del Movistar Arena, 5 del Coliseo Medplus, 4 del
Simón Bolívar—. Las 9 restantes son una cada una de Corferias, Ágora, Teatro
Cafam, Teatro Colón, Parque de la 93: institucional también. La agenda del
distrito resultó ser un agregador de escenarios grandes, y era la fuente que
generaba dos tercios del trabajo de borrado de la cola.

**`movistar_arena` salió el mismo día y volvió horas después**, por decisión
de Juan: los shows de artistas nacionales en esa sala son información que
vale, aunque el escenario no sea de escena. Y sin su scraper esos eventos
quedaban congelados — 6 de los 9 que había en cartelera colgaban solo de
`visitbogota`, así que nadie iba a enterarse si se movía una fecha. Volver a
correrlo los reengancha: el scraper abre una fila cruda nueva, la deduplicación
la propone como duplicado del canónico que ya existe, y al confirmarla las dos
fuentes quedan unidas.

⚠️ **Se sacan del registry y no se filtran adentro del scraper, y la
diferencia no es de estilo.** `_prune_missing_events` borra los eventos
futuros de una fuente que no vinieron en el lote: un scraper que sigue
corriendo y devuelve menos no omite lo que falta, lo **elimina de la base**.
Sacar la fuente no borra nada — sus filas quedan congeladas como registro y
dejan de actualizarse.

El hueco que esto deja lo tapa la carga desde afiche: la decisión, tomada
con Juan, es que un evento de escena que se escape se carga a mano antes que
seguir pagando el triage de lo masivo.
"""

from collections.abc import Callable

from bogota_music_intel.scrapers import (
    idartes_teatro_jeg,
    latino_power,
    lourdes_music_hall,
    movistar_arena,
    rockal_live,
    royal_center,
    ticketlive,
)
from bogota_music_intel.scrapers.models import ScrapedEvent

SCRAPERS: dict[str, Callable[[], list[ScrapedEvent]]] = {
    movistar_arena.SOURCE: movistar_arena.scrape,
    latino_power.SOURCE: latino_power.scrape,
    rockal_live.SOURCE: rockal_live.scrape,
    idartes_teatro_jeg.SOURCE: idartes_teatro_jeg.scrape,
    lourdes_music_hall.SOURCE: lourdes_music_hall.scrape,
    royal_center.SOURCE: royal_center.scrape,
    ticketlive.SOURCE: ticketlive.scrape,
}
