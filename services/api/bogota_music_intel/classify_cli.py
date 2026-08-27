"""Clasifica los eventos guardados: qué es música y qué artista es local.

Uso:
    python -m bogota_music_intel.classify_cli            # solo los nuevos
    python -m bogota_music_intel.classify_cli --dry-run  # muestra sin guardar
    python -m bogota_music_intel.classify_cli --todas    # reclasifica todo

Corre después del scraping, no dentro: la ingesta guarda crudo y esto marca
encima. Reclasificar con `--todas` es barato y no pierde nada, que es
justamente lo que permite cambiar el criterio editorial sin re-scrapear.

Conviene leer la salida: cada línea dice por qué quedó así. Un evento que
desaparece de la cartelera sin explicación no hay forma de auditarlo.
"""
import argparse
from datetime import UTC, datetime

import httpx

from bogota_music_intel.classify import clasificar
from bogota_music_intel.musicbrainz import USER_AGENT, MusicBrainzNoDisponible
from bogota_music_intel.storage import get_client
from bogota_music_intel.tipos_evento import NO_MUSICA

CAMPOS = "id,source,source_event_id,title,category"

# Si MusicBrainz se cae, seguir preguntando es perder el tiempo: cada
# consulta gasta tres reintentos con espera. Se corta y se avisa, dejando
# esos eventos sin clasificar para el próximo intento.
FALLAS_SEGUIDAS_PARA_RENDIRSE = 3


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="No guarda, solo reporta")
    parser.add_argument(
        "--todas",
        action="store_true",
        help="Reclasifica también las que ya tienen clasificación",
    )
    args = parser.parse_args()

    client = get_client()
    consulta = client.table("events").select(CAMPOS)
    if not args.todas:
        consulta = consulta.is_("event_type", "null")

    try:
        eventos = consulta.order("source").execute().data
    except Exception as exc:
        if "event_type" in str(exc):
            print(
                "La tabla events todavía no tiene las columnas de clasificación.\n"
                "Aplicá la migración "
                "supabase/migrations/20260828000000_clasificacion_editorial.sql "
                "en el SQL editor de Supabase (o con `supabase db push`) y volvé "
                "a correr esto."
            )
            return 1
        raise

    if not eventos:
        print("No hay eventos sin clasificar.")
        return 0

    excluidos = 0
    locales = 0
    internacionales = 0
    sin_resolver = 0
    sin_preguntar = 0
    fallas_seguidas = 0

    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=30) as http:
        for evento in eventos:
            # El ritmo de peticiones lo maneja el módulo de MusicBrainz: lo
            # que se excluye por patrón o por categoría ni toca la red.
            try:
                resultado = clasificar(evento, client=http)
            except MusicBrainzNoDisponible as exc:
                # No se pudo preguntar. Se deja sin clasificar a propósito,
                # para que el próximo intento lo vuelva a tomar; guardar
                # "origen desconocido" lo daría por resuelto para siempre.
                sin_preguntar += 1
                fallas_seguidas += 1
                print(f"[ ... ] {evento['title'][:60]}\n        {exc}")
                if fallas_seguidas >= FALLAS_SEGUIDAS_PARA_RENDIRSE:
                    print(
                        f"\nMusicBrainz no responde ({fallas_seguidas} seguidas). "
                        "Se corta acá; los eventos que faltan quedan sin "
                        "clasificar y se retoman en la próxima corrida."
                    )
                    break
                continue
            fallas_seguidas = 0

            if resultado.event_type == NO_MUSICA:
                excluidos += 1
                marca = "FUERA"
            elif resultado.is_local is True:
                locales += 1
                marca = "LOCAL"
            elif resultado.is_local is False:
                internacionales += 1
                marca = "INTL "
            else:
                sin_resolver += 1
                marca = "  ?  "

            print(f"[{marca}] {evento['title'][:60]}\n        {resultado.detalle}")

            if not args.dry_run:
                client.table("events").update(
                    {
                        "event_type": resultado.event_type,
                        "is_local": resultado.is_local,
                        "classification_source": resultado.classification_source,
                        "classified_at": datetime.now(UTC).isoformat(),
                    }
                ).eq("id", evento["id"]).execute()

    print(
        f"\n{len(eventos)} eventos: {excluidos} fuera de cartelera, "
        f"{locales} locales, {internacionales} internacionales, "
        f"{sin_resolver} sin resolver."
    )
    if sin_preguntar:
        print(
            f"{sin_preguntar} quedaron sin clasificar porque MusicBrainz no "
            "respondió. Volvé a correr esto más tarde."
        )
    if sin_resolver:
        print(
            "Los «sin resolver» se siguen mostrando en su lugar normal: no se "
            "penaliza un evento por no haber podido identificar al artista."
        )
    if args.dry_run:
        print("(dry-run: no se guardó nada)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
