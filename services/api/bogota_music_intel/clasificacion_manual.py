"""Clasificaciones verificadas a mano, para lo que ninguna regla detecta.

Por qué existe este archivo: hay eventos que no dan **ninguna** señal
automática de que no son música. El caso que lo obliga es "HOMBRES A LA
PLANCHA" — una obra de teatro en el Royal Center cuyo título se lee
exactamente igual que el nombre de una banda. No hay patrón honesto que lo
saque sin sacar también toques reales, y la fuente no publica categoría.

La alternativa era ensanchar los patrones de `exclusion_patterns.py` hasta
que atraparan estos casos, pero eso esconde toques reales de la cartelera y
nadie se entera. Se prefiere una regla estrecha más una lista curada
visible, igual que se resolvió la geocodificación en
`coordenadas_curadas.py`.

Reglas para agregar una entrada:
1. Verificar qué es el evento en su fuente, no deducirlo del título.
2. Dejar escrito en `evidencia` cómo se verificó.
3. Si la duda persiste, no agregarla: el evento se sigue mostrando, que es
   el estado honesto.
"""
from dataclasses import dataclass

from bogota_music_intel.tipos_evento import NO_MUSICA


@dataclass(frozen=True)
class ClasificacionManual:
    event_type: str
    evidencia: str
    is_local: bool | None = None


# Clave: (source, source_event_id), la identidad estable del evento en la
# tabla events.
CLASIFICACION_MANUAL: dict[tuple[str, str], ClasificacionManual] = {
    ("royal_center", "hombres-a-la-plancha"): ClasificacionManual(
        event_type=NO_MUSICA,
        evidencia=(
            "Obra de teatro (comedia teatral de Ricardo Rodríguez), no un "
            "concierto. El título no delata nada: se lee igual que el nombre "
            "de una banda, y Royal Center no publica categoría. Verificado "
            "2026-08-27 contra la cartelera de la sala."
        ),
    ),
    ("movistar_arena", "the-juanpis-live-show-si-nos-organizamos-cabemos-todos"): (
        ClasificacionManual(
            event_type=NO_MUSICA,
            evidencia=(
                "Late night show de comedia del personaje Juanpis González, "
                "no un toque. Se cura a mano en vez de agregar un patrón "
                "«live show»: esa frase también aparece en títulos de "
                "conciertos reales y sacaría música de la cartelera. "
                "Verificado 2026-08-27 en movistararena.co."
            ),
        )
    ),
}
