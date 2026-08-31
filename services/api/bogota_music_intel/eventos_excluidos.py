"""Lo que no vuelve a entrar, por `(source, source_event_id)`.

Se filtra **antes de guardar**, no después. Borrar la fila no alcanza en una
fuente activa: `save_events` hace upsert de todo lo que el scraper encuentra,
así que un `DELETE` dura hasta la próxima corrida del cron y el evento vuelve
solo. Se probó el 2026-08-28 con `Laura & Brenda` y otra vez el 2026-08-31 al
soltar el canónico de WWE, que el CLI volvió a abrir en la misma corrida.

**La lista vive en la base (`blocked_source_events`) desde el 2026-08-31.**
Antes era un diccionario en este archivo, y eso dejó de servir cuando el
borrado pasó a hacerse desde el formulario de admin: una lista que el admin
tiene que poder escribir no puede estar en git. Quien escribe es la función
`borrar_evento()`, que en la misma transacción bloquea, borra las filas
crudas y borra el canónico.

Sigue siendo una excepción consciente a "guardar crudo, filtrar en lectura":
esa regla existe para no re-scrapear cuando cambia el **criterio editorial**,
y acá no se aplica un criterio sino una decisión puntual sobre un evento
concreto. Cualquier cosa que se pueda expresar como regla —no es música, es
fiesta, es internacional— va al clasificador, no acá. Y para "no lo quiero
mostrar pero que quede" está `status = 'descartado'`, que es reversible;
esto es el otro caso, el de que no vuelva nunca.
"""
from supabase import Client


def cargar_bloqueados(client: Client) -> set[tuple[str, str]]:
    """Trae la lista completa de una vez.

    Se carga una sola vez por corrida y no una consulta por evento: son
    pocas filas y el scraping guarda por lotes. Si la tabla todavía no
    existe —una base sin la migración de borrado— se devuelve vacío en vez
    de fallar: bloquear de menos deja un evento de más a la vista, que se
    arregla desde el formulario; fallar tumba la ingesta entera.
    """
    try:
        filas = client.table("blocked_source_events").select("source,source_event_id").execute()
    except Exception:  # noqa: BLE001 - cualquier fallo acá se degrada, no tumba la ingesta
        return set()
    return {(f["source"], f["source_event_id"]) for f in filas.data or []}
