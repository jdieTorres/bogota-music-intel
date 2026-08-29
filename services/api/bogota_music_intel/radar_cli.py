"""Arma una foto del radar de tendencias y la guarda en Supabase.

Uso:
    python -m bogota_music_intel.radar_cli            # trae y guarda
    python -m bogota_music_intel.radar_cli --dry-run  # solo imprime

Igual que `classify_cli.py`: si MusicBrainz deja de responder, no tiene
sentido seguir preguntando un artista tras otro perdiendo tres reintentos
cada vez. Se corta a las pocas fallas seguidas y esos artistas quedan sin
origen resuelto en esta foto — no es grave, es el mismo "no sé" que ya
maneja la cartelera.
"""
import argparse
import sys

import httpx

from bogota_music_intel.musicbrainz import USER_AGENT, MusicBrainzNoDisponible
from bogota_music_intel.radar import FilaTendencia, obtener_candidatos, resolver_origen
from bogota_music_intel.storage import get_client, save_trending_snapshot

FALLAS_SEGUIDAS_PARA_RENDIRSE = 3


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dry-run", action="store_true", help="No escribe en Supabase, solo reporta"
    )
    parser.add_argument(
        "--limit", type=int, default=50, help="Cuántos artistas traer por fuente"
    )
    args = parser.parse_args()

    try:
        candidatos = obtener_candidatos(limit=args.limit)
    except Exception as exc:  # noqa: BLE001 - Last.fm caído no debe tumbar todo
        print(f"FALLÓ trayendo las fuentes: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1

    filas: list[FilaTendencia] = []
    sin_preguntar = 0
    fallas_seguidas = 0
    cortado = False

    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=30) as http:
        for candidato in candidatos:
            if cortado:
                break
            try:
                is_local, fuente = resolver_origen(candidato.artist_name, client=http)
                fallas_seguidas = 0
            except MusicBrainzNoDisponible as exc:
                sin_preguntar += 1
                fallas_seguidas += 1
                print(f"[ ... ] {candidato.artist_name}\n        {exc}")
                is_local, fuente = None, None
                if fallas_seguidas >= FALLAS_SEGUIDAS_PARA_RENDIRSE:
                    print(
                        f"\nMusicBrainz no responde ({fallas_seguidas} seguidas). "
                        "Se corta acá; el resto queda fuera de esta foto."
                    )
                    cortado = True

            filas.append(
                FilaTendencia(
                    source=candidato.source,
                    rank=candidato.rank,
                    artist_name=candidato.artist_name,
                    external_id=candidato.external_id,
                    image_url=candidato.image_url,
                    metric=candidato.metric,
                    is_local=is_local,
                    classification_source=fuente,
                )
            )

    # Los que faltaron por el corte anticipado quedan directamente afuera de
    # esta foto: no tiene sentido guardarlos sin haber siquiera preguntado.
    resueltos = {(f.source, f.rank) for f in filas}
    faltantes = [c for c in candidatos if (c.source, c.rank) not in resueltos]

    por_fuente: dict[str, int] = {}
    sin_resolver = 0
    for fila in filas:
        por_fuente[fila.source] = por_fuente.get(fila.source, 0) + 1
        if fila.is_local is None:
            sin_resolver += 1

    resumen = ", ".join(f"{fuente}: {n}" for fuente, n in por_fuente.items())
    print(f"{len(filas)} artistas ({resumen}); {sin_resolver} sin origen resuelto")
    if sin_preguntar:
        print(f"{sin_preguntar} no se pudieron preguntar (MusicBrainz no respondió)")
    if faltantes:
        print(f"{len(faltantes)} quedaron fuera de esta foto por el corte anticipado")

    if args.dry_run:
        print("(dry-run, no guardado)")
        return 0

    client = get_client()
    guardados = save_trending_snapshot(client, filas)
    print(f"{guardados} filas guardadas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
