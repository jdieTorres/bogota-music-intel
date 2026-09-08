"""Clasifica los eventos guardados: qué es música, qué es fiesta, qué no va.

Uso:
    python -m bogota_music_intel.classify_cli            # solo los nuevos
    python -m bogota_music_intel.classify_cli --dry-run  # muestra sin guardar
    python -m bogota_music_intel.classify_cli --todas    # reclasifica todo

Corre después del scraping, no dentro: la ingesta guarda crudo y esto marca
encima. Reclasificar con `--todas` es barato y no pierde nada, que es
justamente lo que permite cambiar el criterio editorial sin re-scrapear.

**Ya no consulta nada por red** (2026-09-08). Antes preguntaba a MusicBrainz
el país del artista para llenar `is_local`, y con eso venía todo un aparato:
límite de peticiones, tres reintentos, un contador de fallas seguidas para
rendirse, y eventos que quedaban sin clasificar cuando el servicio no
respondía. Nada de eso hace falta: `is_local` lo escribe una persona en
`/admin`, y lo que queda acá son reglas locales que corren en milisegundos y
no pueden fallar por causas ajenas.

Conviene leer la salida: cada línea dice por qué quedó así. Un evento que
desaparece de la cartelera sin explicación no hay forma de auditarlo.
"""
import argparse
from datetime import UTC, datetime

from bogota_music_intel.classify import clasificar
from bogota_music_intel.storage import get_client
from bogota_music_intel.tipos_evento import FESTIVAL, FIESTA, NO_MUSICA

CAMPOS = "id,source,source_event_id,title,category"

MARCAS = {NO_MUSICA: "FUERA ", FIESTA: "FIESTA", FESTIVAL: "FESTI "}


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
                "Aplica la migración "
                "supabase/migrations/20260828000000_clasificacion_editorial.sql "
                "en el SQL editor de Supabase (o con `supabase db push`) y vuelve "
                "a correr esto."
            )
            return 1
        raise

    if not eventos:
        print("No hay eventos sin clasificar.")
        return 0

    conteo: dict[str, int] = {}

    for evento in eventos:
        resultado = clasificar(evento)
        conteo[resultado.event_type] = conteo.get(resultado.event_type, 0) + 1

        marca = MARCAS.get(resultado.event_type, "MÚSICA")
        print(f"[{marca}] {evento['title'][:60]}\n        {resultado.detalle}")

        if not args.dry_run:
            # ⚠️ **No se escribe `is_local`.** La columna sigue existiendo en
            # `events` con lo que dejó MusicBrainz, pero nadie la actualiza
            # ya: el origen del artista lo decide una persona sobre el
            # canónico, y pisarlo desde acá sería devolverle el volante al
            # automatismo que se dio de baja.
            client.table("events").update(
                {
                    "event_type": resultado.event_type,
                    "classification_source": resultado.classification_source,
                    "classified_at": datetime.now(UTC).isoformat(),
                }
            ).eq("id", evento["id"]).execute()

    resumen = ", ".join(f"{n} {tipo}" for tipo, n in sorted(conteo.items()))
    print(f"\n{len(eventos)} eventos: {resumen}.")
    if args.dry_run:
        print("(dry-run: no se guardó nada)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
