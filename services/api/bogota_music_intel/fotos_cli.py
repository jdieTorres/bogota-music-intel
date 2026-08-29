"""Aplica las fotos curadas de `fotos_curadas.py` a Supabase.

Uso:
    python -m bogota_music_intel.fotos_cli            # aplica y guarda
    python -m bogota_music_intel.fotos_cli --dry-run  # solo muestra

No hay nada que geocodificar ni ninguna API que llamar acá: es una lista de
URLs que alguien verificó a mano, así que no necesita rate limit ni
reintentos, a diferencia de `geocode_cli.py`.
"""
import argparse

from bogota_music_intel.fotos_curadas import FOTOS_CURADAS
from bogota_music_intel.storage import get_client


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="No guarda, solo reporta")
    args = parser.parse_args()

    if not FOTOS_CURADAS:
        print("fotos_curadas.py está vacío — no hay nada que aplicar.")
        return 0

    client = get_client()
    for slug, foto in FOTOS_CURADAS.items():
        print(f"[{slug}] {foto.url}")
        if not args.dry_run:
            client.table("venues").update({"photo_url": foto.url}).eq("slug", slug).execute()

    print(f"\n{len(FOTOS_CURADAS)} fotos {'a aplicar' if args.dry_run else 'aplicadas'}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
