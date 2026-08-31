"""El scraping propone, el admin publica.

Ningún evento llega a la cartelera sin que una persona lo mire. El cron
sigue corriendo igual; lo que trae entra como **borrador** a una cola de
revisión, y el admin verifica, completa y publica.

El motivo no es de calidad sino de **sesgo de cobertura**: las seis fuentes
que scrapeamos tiran a salas grandes, donde tocan los internacionales. El
toque local en un bar chico, anunciado solo por Instagram, es invisible para
el pipeline — y promover ese toque es el propósito de la plataforma. Diseño
completo en `docs/investigacion-tecnica-plataforma-musical.md` § 9.

Este módulo es lógica pura sobre diccionarios: no abre conexión a Supabase,
así que se puede probar sin credenciales. Lo que habla con la base es
`moderacion_cli.py`.

**La regla que no se puede romper:** lo que edita el admin vive en
`canonical_events`, nunca en `events`. El scraper reescribe `events.title`,
`starts_at` y `price_text` en cada corrida, así que una corrección hecha
allá se pierde al día siguiente.
"""
from datetime import UTC, datetime
from typing import Any

from bogota_music_intel.deduplicacion import mas_completo

# Los campos crudos que se vigilan: si la sala mueve alguno después de que
# el admin aprobó, el evento vuelve a la cola.
#
# Quedan fuera a propósito `description` y `raw`. La descripción es texto
# libre que cambia con cualquier retoque de la página de la sala —un punto,
# una palabra— y ahogaría la cola en avisos que no cambian ningún hecho que
# el lector vaya a usar. Si algún día hace falta vigilarla, agregarla acá es
# una línea; el costo es que la cola se llene.
CAMPOS_VIGILADOS = (
    "title",
    "starts_at",
    "ends_at",
    "date_precision",
    "venue_id",
    "price_text",
    "category",
    "ticket_url",
    "image_url",
)

# Lo que se copia del crudo al borrador para prellenarlo. Es más que lo
# vigilado: la descripción se hereda aunque después no se controle.
CAMPOS_HEREDADOS = (*CAMPOS_VIGILADOS, "description", "event_type", "is_local")


def _normalizar(campo: str, valor: Any) -> Any:
    """Deja un valor listo para comparar contra el de la corrida anterior.

    Las fechas se llevan a UTC antes de comparar: la misma hora escrita como
    `+00:00` y como `-05:00` es la misma hora, y compararlas como texto
    inventaría un cambio que la sala nunca hizo.
    """
    if valor is None:
        return None
    if campo in ("starts_at", "ends_at"):
        return datetime.fromisoformat(valor).astimezone(UTC).isoformat()
    if isinstance(valor, str):
        return " ".join(valor.split())
    return valor


def snapshot(crudo: dict) -> dict:
    """Los campos crudos tal como se están aprobando.

    Se guarda esto y no los valores del canónico porque el admin puede haber
    editado el título a propósito: comparar su versión contra la de la sala
    marcaría un cambio en cada corrida, para siempre.
    """
    return {campo: _normalizar(campo, crudo.get(campo)) for campo in CAMPOS_VIGILADOS}


def cambios(aprobado: dict | None, crudo: dict) -> dict[str, dict[str, Any]]:
    """Qué movió la fuente desde que el admin aprobó.

    Devuelve `{campo: {"antes": …, "ahora": …}}`, vacío si no cambió nada.
    Sin snapshot no se puede afirmar que algo cambió, así que se devuelve
    vacío en vez de marcar todo como nuevo — un "no sé" honesto.
    """
    if not aprobado:
        return {}

    ahora = snapshot(crudo)
    return {
        campo: {"antes": aprobado.get(campo), "ahora": ahora[campo]}
        for campo in CAMPOS_VIGILADOS
        if aprobado.get(campo) != ahora[campo]
    }


def borrador_desde(crudos: list[dict]) -> dict:
    """Arma el borrador del canónico a partir de sus filas crudas.

    Cuando el mismo show llega por varias fuentes se prellena con la más
    completa, pero **las otras no se descartan**: el canónico queda colgando
    de todas, así que el admin puede tomar el título de una y el precio de
    otra. Eso es lo que arregla el caso de Akriila, que perdía "Tour Lucy"
    porque ganaba la fila que traía precio y hora.
    """
    if not crudos:
        raise ValueError("Un borrador de fuente scrapeada necesita al menos un crudo")

    base = mas_completo(crudos)
    borrador = {campo: base.get(campo) for campo in CAMPOS_HEREDADOS}

    # Un campo que la fuente elegida no publicó se completa con el de otra:
    # dejarlo vacío teniendo el dato al lado sería trabajo manual regalado.
    for campo in CAMPOS_HEREDADOS:
        if borrador.get(campo) is None:
            for otro in crudos:
                if otro.get(campo) is not None:
                    borrador[campo] = otro[campo]
                    break

    borrador["status"] = "borrador"
    borrador["origin"] = "scraper"
    # El snapshot se toma DESPUÉS de completar los huecos con las otras
    # fuentes, no solo de `base`. Si se tomara antes, un campo que la fuente
    # elegida no publica pero otra sí quedaría marcado como cambio en la
    # primera corrida siguiente, sin que nadie hubiera cambiado nada.
    borrador["source_snapshot"] = snapshot(borrador)
    return borrador


# La clasificación editorial (`event_type`, `is_local`) la escribe
# `classify.py` sobre el crudo, y el borrador la hereda al crearse. Pero un
# evento puede quedar sin clasificar —MusicBrainz devuelve 503, o falla
# desde CI— y resolverse recién en una corrida posterior, cuando el canónico
# ya existe. Sin esto, esa clasificación tardía no llegaría nunca.
CAMPOS_DE_CLASIFICACION = ("event_type", "is_local")


def clasificacion_pendiente(canonico: dict, crudos: list[dict]) -> dict:
    """Lo que el clasificador resolvió después y al canónico le falta.

    **Solo rellena huecos, nunca sobrescribe.** Si el admin corrigió el tipo
    de un evento a mano, su decisión gana sobre lo que diga MusicBrainz en
    la corrida siguiente: para eso existe la revisión.
    """
    if not crudos:
        return {}

    pendiente = {}
    for campo in CAMPOS_DE_CLASIFICACION:
        if canonico.get(campo) is not None:
            continue
        valor = next((c[campo] for c in crudos if c.get(campo) is not None), None)
        if valor is not None:
            pendiente[campo] = valor
    return pendiente
