"""Corre todos los scrapers registrados y guarda los eventos en Supabase.

Uso:
    python -m bogota_music_intel.scrape_cli            # scrapea y guarda
    python -m bogota_music_intel.scrape_cli --dry-run  # solo imprime, no guarda
    python -m bogota_music_intel.scrape_cli --source movistar_arena
"""
import argparse
import sys

from bogota_music_intel.eventos_excluidos import esta_excluido
from bogota_music_intel.scrapers.models import dedupe_events
from bogota_music_intel.scrapers.registry import SCRAPERS
from bogota_music_intel.storage import get_client, save_events


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

    for source in selected:
        # El scrapeo y el guardado van dentro del mismo try: si el guardado
        # queda afuera, un error de Supabase en una fuente aborta el proceso
        # entero y las fuentes siguientes nunca corren.
        try:
            events = dedupe_events(SCRAPERS[source]())
            if args.dry_run:
                # Se descuenta lo bloqueado para que el dry-run informe lo
                # que se guardaría y no lo que se encontró: el filtro vive
                # en save_events, que acá no se llama.
                guardables = [e for e in events if not esta_excluido(e.source, e.source_event_id)]
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
            print(f"[{source}] FALLÓ: {type(exc).__name__}: {exc}", file=sys.stderr)

    return 1 if had_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
