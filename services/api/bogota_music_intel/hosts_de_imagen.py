"""Avisa cuando llega un afiche de un host que el frontend no tiene permitido.

**Por qué existe.** `next/image` no degrada ante un host desconocido: lanza y
rompe la tarjeta del evento. Pasó el 2026-09-01, al publicarse el primer
evento de visitbogota — la fuente llevaba un día entera guardando imágenes de
un host que no estaba en `apps/web/next.config.ts`, y nadie se enteró hasta
que alguien abrió la cartelera.

El problema no es la lista, que es explícita a propósito: el optimizador de
Next descarga y sirve cualquier URL que se le permita, así que un comodín lo
convertiría en un proxy de imágenes para cualquiera. El problema era **cuándo
se descubría el hueco**. Esto lo mueve al momento de la ingesta, que es donde
hay alguien mirando un log.

Se lee el `next.config.ts` en vez de duplicar la lista acá: dos listas que hay
que mantener sincronizadas terminan desincronizadas, y la que manda es la que
usa Next.
"""
import re
from pathlib import Path
from urllib.parse import urlparse

# services/api/bogota_music_intel/ -> raíz del repo -> apps/web
CONFIG_DE_NEXT = Path(__file__).resolve().parents[3] / "apps" / "web" / "next.config.ts"

_HOSTNAME = re.compile(r'hostname:\s*"([^"]+)"')


def hosts_permitidos(config: Path | None = None) -> set[str]:
    """Los hosts de `images.remotePatterns`, leídos del config real.

    Si el archivo no está —correr la ingesta sin el frontend al lado es
    posible— se devuelve vacío, y el chequeo se salta en vez de fallar: es un
    aviso, no una validación.
    """
    ruta = config or CONFIG_DE_NEXT
    try:
        return set(_HOSTNAME.findall(ruta.read_text(encoding="utf-8")))
    except OSError:
        return set()


def hosts_sin_permiso(urls, permitidos: set[str] | None = None) -> dict[str, int]:
    """Qué hosts de imagen aparecen en los datos y no están permitidos.

    Devuelve `{host: cuántas veces}`. Vacío si no hay ninguno, o si no se
    pudo leer la lista.
    """
    permitidos = hosts_permitidos() if permitidos is None else permitidos
    if not permitidos:
        return {}

    conteo: dict[str, int] = {}
    for url in urls:
        if not url:
            continue
        host = urlparse(url).hostname
        if host and host not in permitidos:
            conteo[host] = conteo.get(host, 0) + 1
    return conteo
