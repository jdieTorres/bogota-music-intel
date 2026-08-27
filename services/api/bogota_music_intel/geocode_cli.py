"""Asigna coordenadas a las salas que aún no las tienen.

Uso:
    python -m bogota_music_intel.geocode_cli            # solo las que faltan
    python -m bogota_music_intel.geocode_cli --dry-run  # muestra sin guardar
    python -m bogota_music_intel.geocode_cli --todas    # rehace todas

Cada resultado imprime el nombre que devolvió OpenStreetMap: conviene
revisarlo, porque una sala puede compartir nombre con otra cosa (la estación
de TransMilenio "Movistar Arena", por ejemplo).
"""
import argparse
import time
from datetime import UTC, datetime

import httpx

from bogota_music_intel.coordenadas_curadas import COORDENADAS_CURADAS
from bogota_music_intel.geocode import (
    SEGUNDOS_ENTRE_PETICIONES,
    USER_AGENT,
    en_bogota,
    geocodificar,
)
from bogota_music_intel.storage import get_client


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="No guarda, solo reporta")
    parser.add_argument(
        "--todas",
        action="store_true",
        help="Rehace también las salas que ya tienen coordenadas",
    )
    args = parser.parse_args()

    client = get_client()
    consulta = client.table("venues").select("slug,name,city,address,latitude")
    if not args.todas:
        consulta = consulta.is_("latitude", "null")
    salas = consulta.order("name").execute().data

    if not salas:
        print("Todas las salas ya tienen coordenadas.")
        return 0

    sin_resolver: list[str] = []
    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=30) as http:
        for indice, sala in enumerate(salas):
            # Las coordenadas curadas a mano ganan sobre la búsqueda
            # automática: se agregaron justamente porque Nominatim no
            # resuelve bien esa sala.
            curada = COORDENADAS_CURADAS.get(sala["slug"])
            if curada is not None:
                if not en_bogota(curada.latitude, curada.longitude):
                    raise ValueError(
                        f"La coordenada curada de {sala['slug']} cae fuera de Bogotá"
                    )
                print(f"[{sala['slug']}] {curada.latitude:.6f}, {curada.longitude:.6f} (curada)")
                if not args.dry_run:
                    client.table("venues").update(
                        {
                            "latitude": curada.latitude,
                            "longitude": curada.longitude,
                            "geocode_source": "manual",
                            "geocode_query": None,
                            "geocode_display_name": curada.evidencia,
                            "geocoded_at": datetime.now(UTC).isoformat(),
                        }
                    ).eq("slug", sala["slug"]).execute()
                continue

            if indice > 0:
                time.sleep(SEGUNDOS_ENTRE_PETICIONES)

            ubicacion = geocodificar(
                nombre=sala["name"],
                direccion=sala.get("address"),
                ciudad=sala.get("city") or "Bogotá",
                client=http,
            )

            if ubicacion is None:
                sin_resolver.append(sala["name"])
                print(f"[{sala['slug']}] SIN RESULTADO — queda sin ubicación")
                continue

            print(
                f"[{sala['slug']}] {ubicacion.latitude:.6f}, {ubicacion.longitude:.6f}"
                f"\n    consulta: {ubicacion.query}"
                f"\n    OSM dice: {ubicacion.display_name[:100]}"
            )

            if not args.dry_run:
                client.table("venues").update(
                    {
                        "latitude": ubicacion.latitude,
                        "longitude": ubicacion.longitude,
                        "geocode_source": "nominatim",
                        "geocode_query": ubicacion.query,
                        "geocode_display_name": ubicacion.display_name,
                        "geocoded_at": datetime.now(UTC).isoformat(),
                    }
                ).eq("slug", sala["slug"]).execute()

    if sin_resolver:
        print(f"\nSin ubicación ({len(sin_resolver)}): {', '.join(sin_resolver)}")
        print("Revisá la dirección de esas salas o cargá la coordenada a mano.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
