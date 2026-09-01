"""Mantiene la cola de moderación al día.

Uso:
    python -m bogota_music_intel.moderacion_cli              # corrida normal
    python -m bogota_music_intel.moderacion_cli --dry-run    # no guarda nada
    python -m bogota_music_intel.moderacion_cli --backfill   # una sola vez

Corre después del scraping y de la clasificación, igual que `classify_cli`
corre después de `scrape_cli`: la ingesta guarda crudo y esto arma encima la
cola que el admin revisa.

Hace tres cosas, y ninguna publica nada:

1. **Abre borrador** para cada fila cruda que todavía no tiene canónico, y
   le anota una sugerencia de duplicado si se parece a algo ya publicado.
2. **Marca los cambios del origen**: si la sala movió el precio o la fecha de
   algo ya publicado, el canónico vuelve a la cola con el cambio a la vista.
3. **Avisa de los publicados que se quedaron sin fuente**, que hoy
   desaparecían en silencio cuando la sala los sacaba de su cartelera.
4. **Baja la clasificación que llegó tarde**: un evento que MusicBrainz no
   resolvió el primer día y sí el segundo tiene que llegarle al canónico,
   que ya existía cuando eso pasó.

`--backfill` es la mudanza inicial: toma lo que ya está en la base y lo
publica como canónico para que la cartelera no se vacíe al cambiar de
modelo. **Es lo único que publica sin revisión humana**, a propósito y una
sola vez: son los 53 eventos que ya estaban a la vista antes de que la
moderación existiera. De ahí en adelante todo entra como borrador.
"""
import argparse
from datetime import UTC, datetime

from bogota_music_intel.deduplicacion import agrupar_mismos_shows, es_el_mismo_show
from bogota_music_intel.moderacion import (
    borrador_desde,
    cambios,
    clasificacion_pendiente,
)
from bogota_music_intel.storage import get_client

CAMPOS_CRUDOS = (
    "id,source,source_event_id,venue_id,title,starts_at,ends_at,date_precision,"
    "description,price_text,category,ticket_url,image_url,event_type,is_local,canonical_id"
)
CAMPOS_SALAS = "id,name"
CAMPOS_CANONICOS = (
    "id,status,origin,venue_id,title,starts_at,source_snapshot,change_detected_at,"
    "event_type,is_local"
)


def _ordenados(eventos: list[dict]) -> list[dict]:
    """Orden estable, para que dos corridas seguidas agrupen igual y elijan
    la misma fuente para prellenar. Sin esto, un empate de riqueza podría
    alternar y marcar cambios que nadie hizo."""
    return sorted(eventos, key=lambda e: (e["source"], e["source_event_id"]))


def _abrir_borradores(client, crudos, canonicos, salas, guardar: bool) -> int:
    sin_canonico = [e for e in crudos if not e.get("canonical_id")]
    if not sin_canonico:
        return 0

    abiertos = 0
    for grupo in agrupar_mismos_shows(_ordenados(sin_canonico)):
        borrador = borrador_desde(grupo, salas)

        # La sugerencia de duplicado no decide nada: la confirma el admin.
        parecido = next((c for c in canonicos if es_el_mismo_show(c, grupo[0])), None)
        if parecido:
            borrador["suggested_duplicate_of"] = parecido["id"]

        fuentes = ", ".join(e["source"] for e in grupo)
        aviso = f" (posible duplicado de {parecido['id'][:8]})" if parecido else ""
        print(f"  [BORRADOR] {borrador['title']} — {fuentes}{aviso}")

        if guardar:
            creado = client.table("canonical_events").insert(borrador).execute().data[0]
            for evento in grupo:
                client.table("events").update({"canonical_id": creado["id"]}).eq(
                    "id", evento["id"]
                ).execute()
        abiertos += 1
    return abiertos


def _marcar_cambios(client, crudos, canonicos, salas, guardar: bool) -> int:
    por_canonico: dict[str, list[dict]] = {}
    for evento in crudos:
        if evento.get("canonical_id"):
            por_canonico.setdefault(evento["canonical_id"], []).append(evento)

    marcados = 0
    for canonico in canonicos:
        if canonico["status"] != "publicado":
            continue
        fuentes = _ordenados(por_canonico.get(canonico["id"], []))
        if not fuentes:
            continue

        diferencias = cambios(canonico.get("source_snapshot"), borrador_desde(fuentes, salas))
        if not diferencias:
            continue

        for campo, valores in diferencias.items():
            print(f"  [CAMBIÓ] {canonico['title']} — {campo}: {valores['antes']} → {valores['ahora']}")
        if guardar:
            client.table("canonical_events").update(
                {
                    "change_detected_at": datetime.now(UTC).isoformat(),
                    "change_detail": diferencias,
                }
            ).eq("id", canonico["id"]).execute()
        marcados += 1
    return marcados


def _avisar_huerfanos(crudos: list[dict], canonicos: list[dict]) -> int:
    """Un publicado que se quedó sin ninguna fuente. Puede ser una
    cancelación real o que la sala rehízo su web — las dos merecen que
    alguien mire, y hasta hoy las dos pasaban sin dejar rastro."""
    con_fuente = {e["canonical_id"] for e in crudos if e.get("canonical_id")}
    huerfanos = [
        c
        for c in canonicos
        if c["status"] == "publicado" and c["origin"] == "scraper" and c["id"] not in con_fuente
    ]
    for c in huerfanos:
        print(f"  [SIN FUENTE] {c['title']} — desapareció de la cartelera de su sala")
    return len(huerfanos)


def _bajar_clasificacion_tardia(client, crudos, canonicos, guardar: bool) -> int:
    """Rellena en el canónico la clasificación que el crudo resolvió después.

    Solo rellena huecos: si el admin corrigió el tipo a mano, su decisión
    gana sobre lo que diga MusicBrainz mañana.
    """
    por_canonico: dict[str, list[dict]] = {}
    for evento in crudos:
        if evento.get("canonical_id"):
            por_canonico.setdefault(evento["canonical_id"], []).append(evento)

    bajadas = 0
    for canonico in canonicos:
        pendiente = clasificacion_pendiente(canonico, por_canonico.get(canonico["id"], []))
        if not pendiente:
            continue
        print(f"  [CLASIFICADO] {canonico['title']} — {pendiente}")
        if guardar:
            client.table("canonical_events").update(pendiente).eq(
                "id", canonico["id"]
            ).execute()
        bajadas += 1
    return bajadas


def _backfill(client, crudos, salas, guardar: bool) -> int:
    """La mudanza inicial: publica como canónico lo que ya estaba a la vista."""
    sin_canonico = [e for e in crudos if not e.get("canonical_id")]
    ahora = datetime.now(UTC).isoformat()
    publicados = 0

    for grupo in agrupar_mismos_shows(_ordenados(sin_canonico)):
        canonico = borrador_desde(grupo, salas)
        canonico["status"] = "publicado"
        canonico["published_at"] = ahora
        # `reviewed_at` queda en null a propósito: nadie lo revisó. Es lo que
        # distingue estos 53 de todo lo que entre después.
        print(f"  [PUBLICADO] {canonico['title']} — {len(grupo)} fuente(s)")

        if guardar:
            creado = client.table("canonical_events").insert(canonico).execute().data[0]
            for evento in grupo:
                client.table("events").update({"canonical_id": creado["id"]}).eq(
                    "id", evento["id"]
                ).execute()
        publicados += 1
    return publicados


def _normalizar_titulos(client, crudos, canonicos, salas, guardar: bool) -> int:
    """Paso único: pasa por el normalizador los títulos que ya estaban.

    Los 51 canónicos del backfill se crearon con el título crudo, porque la
    normalización todavía vivía en el frontend. Al mudarla a la ingesta hay
    que ponerlos al día, o el sitio mostraría el título de la sala en
    mayúscula sostenida.

    **También actualiza `source_snapshot['title']`, y eso no es opcional.**
    El snapshot guarda "lo que ya vi de la fuente", y se compara contra lo
    que produce `borrador_desde()`. Si el snapshot quedara con el título
    crudo mientras el borrador pasa a devolverlo normalizado, la corrida
    siguiente marcaría los 51 como "la fuente cambió el título" sin que
    ninguna sala hubiera tocado nada.
    """
    por_canonico: dict[str, list[dict]] = {}
    for evento in crudos:
        if evento.get("canonical_id"):
            por_canonico.setdefault(evento["canonical_id"], []).append(evento)

    puestos_al_dia = 0
    for canonico in canonicos:
        fuentes = _ordenados(por_canonico.get(canonico["id"], []))
        if not fuentes:
            continue

        propuesto = borrador_desde(fuentes, salas)
        nuevo_titulo = propuesto["title"]
        snapshot_al_dia = {
            **(canonico.get("source_snapshot") or {}),
            "title": propuesto["source_snapshot"]["title"],
        }
        if nuevo_titulo == canonico["title"] and snapshot_al_dia == canonico.get(
            "source_snapshot"
        ):
            continue

        print(f"  {canonico['title']}  ->  {nuevo_titulo}")
        if guardar:
            client.table("canonical_events").update(
                {"title": nuevo_titulo, "source_snapshot": snapshot_al_dia}
            ).eq("id", canonico["id"]).execute()
        puestos_al_dia += 1
    return puestos_al_dia


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="No guarda, solo reporta")
    parser.add_argument(
        "--normalizar-titulos",
        action="store_true",
        help="Paso único: normaliza los títulos que se guardaron crudos",
    )
    parser.add_argument(
        "--backfill",
        action="store_true",
        help="Mudanza inicial: publica como canónico lo que ya está en la base",
    )
    args = parser.parse_args()
    guardar = not args.dry_run

    client = get_client()
    try:
        crudos = client.table("events").select(CAMPOS_CRUDOS).execute().data
        canonicos = client.table("canonical_events").select(CAMPOS_CANONICOS).execute().data
        salas = {
            v["id"]: v["name"]
            for v in client.table("venues").select(CAMPOS_SALAS).execute().data
        }
    except Exception as exc:
        if "canonical_id" in str(exc) or "canonical_events" in str(exc):
            print(
                "La base todavía no tiene el esquema de moderación.\n"
                "Aplicá supabase/migrations/20260831000000_moderacion.sql en el "
                "SQL editor de Supabase (o con `supabase db push`) y volvé a correr esto."
            )
            return 1
        raise

    if args.normalizar_titulos:
        puestos = _normalizar_titulos(client, crudos, canonicos, salas, guardar)
        print(f"\n{puestos} títulos puestos al día.")
    elif args.backfill:
        if canonicos:
            print(
                f"Ya hay {len(canonicos)} canónicos: el backfill es una sola vez.\n"
                "Corré sin --backfill para la operación normal."
            )
            return 1
        publicados = _backfill(client, crudos, salas, guardar)
        print(f"\n{publicados} eventos publicados como canónicos (mudanza inicial).")
    else:
        abiertos = _abrir_borradores(client, crudos, canonicos, salas, guardar)
        marcados = _marcar_cambios(client, crudos, canonicos, salas, guardar)
        bajadas = _bajar_clasificacion_tardia(client, crudos, canonicos, guardar)
        huerfanos = _avisar_huerfanos(crudos, canonicos)
        print(
            f"\n{abiertos} borradores nuevos, {marcados} con cambios en el origen, "
            f"{bajadas} con clasificación que llegó tarde, "
            f"{huerfanos} publicados sin fuente."
        )

    if not guardar:
        print("(dry-run: no se guardó nada)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
