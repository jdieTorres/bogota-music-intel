"""Corre todos los scrapers registrados y guarda los eventos en Supabase.

Uso:
    python -m bogota_music_intel.scrape_cli          # scrapea y guarda
    python -m bogota_music_intel.scrape_cli --dry-run  # solo imprime, no guarda
"""
import argparse
import sys

from bogota_music_intel.scrapers.registry import SCRAPERS
from bogota_music_intel.storage import get_client, save_events


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="No escribe en Supabase, solo reporta")
    args = parser.parse_args()

    client = None if args.dry_run else get_client()
    had_errors = False

    for source, scrape_fn in SCRAPERS.items():
        try:
            events = scrape_fn()
        except Exception as exc:  # noqa: BLE001 - queremos que un scraper roto no tumbe a los demás
            had_errors = True
            print(f"[{source}] FALLÓ: {exc}", file=sys.stderr)
            continue

        if args.dry_run:
            print(f"[{source}] {len(events)} eventos encontrados (dry-run, no guardado)")
        else:
            saved = save_events(client, events)
            print(f"[{source}] {saved} eventos guardados")

    return 1 if had_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
