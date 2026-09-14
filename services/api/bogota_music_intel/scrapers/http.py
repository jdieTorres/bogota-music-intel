import httpx

USER_AGENT = "Mozilla/5.0 (compatible; BogotaMusicIntelBot/0.1; +https://github.com/jdieTorres/bogota-music-intel)"

DEFAULT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-CO,es;q=0.9",
}


def get(url: str, **kwargs) -> httpx.Response:
    kwargs.setdefault("headers", DEFAULT_HEADERS)
    kwargs.setdefault("timeout", 30)
    kwargs.setdefault("follow_redirects", True)
    response = httpx.get(url, **kwargs)
    response.raise_for_status()
    return response


# Las cabeceras que delatan quién contestó. Un `cf-ray` es Cloudflare, un
# `x-sucuri-id` es Sucuri, y `server` suele nombrar al WAF. Sin esto hay que
# adivinar si el bloqueo lo pone el hosting o el sitio.
_CABECERAS_QUE_DELATAN = (
    "server",
    "cf-ray",
    "cf-mitigated",
    "x-sucuri-id",
    "x-powered-by",
)


def json_de(response: httpx.Response) -> dict | list:
    """El cuerpo como JSON, o un error que diga qué llegó en su lugar.

    ⚠️ **Un 200 no garantiza JSON.** El 2026-09-09 la API de Latino Power
    devolvió desde GitHub Actions un 200 con un cuerpo que no era JSON —una
    página de desafío de WAF, la misma familia que el Radware de Teatro
    Cafam— y `.json()` murió con `Expecting value: line 1 column 1`, que no
    dice nada de lo que pasó. Diagnosticarlo costó ir a buscar el log a mano.

    **Vive acá y no en un scraper**, aunque naciera dentro de
    `latino_power.py`: quien sabe que un 200 puede no ser JSON es la capa que
    habla HTTP, no cada fuente. Tenerlo en una sola fuente costó cuatro
    corridas rojas del cron entre el 2026-09-09 y el 2026-09-12 — tres eran
    de `ticketlive`, que seguía muriendo con el mensaje mudo, y para leerlas
    hubo que abrir el log en el navegador una por una.

    La fuente sigue fallando entera, y eso no se toca: con
    `_prune_missing_events` de por medio, un lote incompleto borraría eventos
    futuros en vez de omitirlos. Lo que cambia es que el mensaje se puede leer.
    """
    try:
        return response.json()
    except ValueError as exc:
        tipo = response.headers.get("content-type", "?")
        inicio = response.text[:200].replace("\n", " ").strip()
        pistas = {
            k: v
            for k, v in response.headers.items()
            if k.lower() in _CABECERAS_QUE_DELATAN
        }
        raise RuntimeError(
            f"la API respondió {response.status_code} con content-type «{tipo}», "
            f"que no es JSON. Cabeceras: {pistas}. Empieza así: {inicio!r}"
        ) from exc
