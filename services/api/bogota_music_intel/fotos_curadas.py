"""Fotos de sala, curadas a mano — mismo patrón que `coordenadas_curadas.py`.

Por qué existe: ninguna fuente que scrapeamos publica una foto del venue en
sí (los afiches que trae `events.image_url` son del show, no de la sala).
No hay API ni scraper razonable que resuelva esto solo, así que se carga a
mano cuando Juan pase una URL real —sitio oficial de la sala, su Instagram,
Google Maps—, nunca una imagen genérica ni el afiche de un evento cualquiera
haciendo de foto de la sala.

Reglas para agregar una entrada:
1. La URL tiene que venir de una fuente verificable y ser una foto real de
   la sala (fachada, interior), no un logo ni un afiche de evento.
2. Dejar escrito en `evidencia` de dónde salió.
3. Si el host de la imagen no está en la allowlist de
   `apps/web/next.config.ts` (`images.remotePatterns`), agregarlo ahí
   también o Next.js la rechaza.
4. Si hay duda, no agregarla: la sala se muestra sin foto (ícono de
   respaldo), que es un estado honesto y ya soportado por el panel.

Aplicar los cambios de este archivo a Supabase con:
    python -m bogota_music_intel.fotos_cli [--dry-run]
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class FotoCurada:
    url: str
    evidencia: str


# Clave: slug de la sala en la tabla venues. Vacío hasta que Juan pase
# fotos reales — no se inventa ninguna para no dejarlo vacío.
FOTOS_CURADAS: dict[str, FotoCurada] = {}
