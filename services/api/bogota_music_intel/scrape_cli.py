"""Corre todos los scrapers registrados y guarda los eventos en Supabase.

Uso:
    python -m bogota_music_intel.scrape_cli            # scrapea y guarda
    python -m bogota_music_intel.scrape_cli --dry-run  # solo imprime, no guarda
    python -m bogota_music_intel.scrape_cli --source movistar_arena
"""
import argparse
import os
import sys

from bogota_music_intel.eventos_excluidos import cargar_bloqueados
from bogota_music_intel.scrapers.models import dedupe_events
from bogota_music_intel.scrapers.registry import SCRAPERS
from bogota_music_intel.storage import get_client, save_events


def _anotar(mensaje: str) -> None:
    """Deja el motivo del fallo en el resumen de la corrida, no solo en el log.

    ⚠️ **Un rojo que no dice qué se rompió no se lee.** El cron falló cuatro
    corridas seguidas entre el 2026-09-09 y el 2026-09-12 y la única
    anotación era "Process completed with exit code 1", así que saber cuál de
    las siete fuentes había caído costaba abrir el log de cada corrida a
    mano. Eso es lo que hizo que cuatro días de rojo pasaran sin mirarse.

    El formato `::error::` lo impone GitHub Actions, y por eso se respeta acá
    —el módulo que corre dentro de ella— y no en el workflow, que solo
    invoca. Fuera de Actions no imprime nada: el mensaje legible ya salió por
    stderr.
    """
    if not os.environ.get("GITHUB_ACTIONS"):
        return
    # Un salto de línea crudo corta la anotación a la mitad, y un `%` suelto
    # se come lo que venga detrás.
    escapado = mensaje.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::error::{escapado}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="No escribe en Supabase, solo reporta")
    parser.add_argument(
        "--source",
        action="append",
        choices=sorted(SCRAPERS),
        help="Corre solo esta fuente (repetible). Por defecto corre todas.",
    )
    args = parser.parse_args()

    selected = args.source or list(SCRAPERS)
    client = None if args.dry_run else get_client()
    had_errors = False

    # La lista de bloqueados vive en la base desde el 2026-08-31, así que el
    # dry-run necesita credenciales para descontarla. Se intenta y se sigue
    # sin ella si no hay: correr un dry-run sin credenciales seguía siendo
    # útil antes y lo sigue siendo — solo que el conteo queda en bruto, y
    # eso se avisa en vez de mentir el número.
    bloqueados: set[tuple[str, str]] = set()
    if args.dry_run:
        try:
            bloqueados = cargar_bloqueados(get_client())
        except Exception:  # noqa: BLE001 - sin credenciales el dry-run sigue sirviendo
            print("(sin credenciales: el conteo no descuenta los eventos bloqueados)")
    else:
        bloqueados = cargar_bloqueados(client)

    for source in selected:
        # El scrapeo y el guardado van dentro del mismo try: si el guardado
        # queda afuera, un error de Supabase en una fuente aborta el proceso
        # entero y las fuentes siguientes nunca corren.
        try:
            events = dedupe_events(SCRAPERS[source]())
            # ⚠️ **Traer cero no es una corrida buena, y hasta el 2026-09-13
            # salía verde.** Es el fallo que nadie detecta: si una sala
            # rediseña su sitio y el parser deja de encontrar, no hay
            # excepción que lo delate —la lista vuelve vacía, se guardan cero
            # eventos y la corrida sale en verde— mientras la cartelera se va
            # vaciando sola a medida que vencen los eventos viejos.
            #
            # Puede ser también una sala sin programación esa semana, y por
            # eso el mensaje no afirma cuál de las dos es: dice qué pasó y
            # deja que lo mire una persona.
            if not events:
                had_errors = True
                aviso = (
                    f"[{source}] no trajo ni un evento. Puede ser una sala sin "
                    "programación o un parser que dejó de encontrar; hay que mirar cuál."
                )
                print(aviso, file=sys.stderr)
                _anotar(aviso)
                continue
            if args.dry_run:
                # Se descuenta lo bloqueado para que el dry-run informe lo
                # que se guardaría y no lo que se encontró: el filtro vive
                # en save_events, que acá no se llama.
                guardables = [
                    e for e in events if (e.source, e.source_event_id) not in bloqueados
                ]
                detalle = f"{len(guardables)} eventos"
                if len(guardables) != len(events):
                    detalle += f" ({len(events) - len(guardables)} bloqueados a mano)"
                print(f"[{source}] {detalle} (dry-run, no guardado)")
                continue
            result = save_events(client, events)
            detalle = f"{result.saved} eventos guardados"
            if result.pruned:
                detalle += f", {result.pruned} obsoletos eliminados"
            print(f"[{source}] {detalle}")
        except Exception as exc:  # noqa: BLE001 - una fuente rota no debe tumbar a las demás
            had_errors = True
            fallo = f"[{source}] FALLÓ: {type(exc).__name__}: {exc}"
            print(fallo, file=sys.stderr)
            _anotar(fallo)

    return 1 if had_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
