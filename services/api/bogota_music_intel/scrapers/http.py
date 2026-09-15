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

# Los porteros que este proyecto ya se encontró, y cómo se firman en el cuerpo
# de la respuesta.
#
# ⚠️ **No están acá para esquivarlos.** La regla es no evadir bloqueos
# anti-bots, y reconocerlos no la relaja: están para que el log diga "te frenó
# un portero" en vez de "la respuesta no era JSON", que son dos problemas
# distintos y tienen salidas distintas. Uno se arregla con código; el otro se
# arregla pidiendo acceso, o no pidiéndole a esa fuente desde acá.
class BloqueadoPorPortero(RuntimeError):
    """La frenó un anti-bots, no un defecto nuestro.

    Existe para que quien decide el color de la corrida pueda distinguir **un
    bloqueo conocido de un fallo nuevo**: los dos son errores, pero uno se
    arregla con código y el otro pidiendo acceso —o no pidiéndole a esa fuente
    desde CI—. Hereda de `RuntimeError` para no romper nada que ya lo atrape
    así.

    ⚠️ **Reconocerlo no relaja la regla de no evadir bloqueos.** Sigue siendo
    un error, sigue saliendo en el log con su nombre y su motivo; lo único que
    cambia es que una fuente donde el bloqueo ya se dio por conocido no vuelva
    a pintar de rojo toda la corrida. Ver `scrape_cli`.
    """


_PORTEROS = (
    ("SiteGround", "sgcaptcha"),
    ("Cloudflare", "cf_chl"),
    ("Cloudflare", "just a moment"),
    ("Sucuri", "sucuri_cloudproxy"),
    ("Imunify360", "imunify360"),
)


def _portero(response: httpx.Response, cuerpo: str) -> str | None:
    """Quién frenó la petición, si se reconoce."""
    if "cf-mitigated" in {k.lower() for k in response.headers}:
        return "Cloudflare"
    minusculas = cuerpo.lower()
    for nombre, firma in _PORTEROS:
        if firma in minusculas:
            return nombre
    return None


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
        cuerpo = response.text[:2000]
        inicio = cuerpo[:200].replace("\n", " ").strip()
        pistas = {
            k: v
            for k, v in response.headers.items()
            if k.lower() in _CABECERAS_QUE_DELATAN
        }
        quien = _portero(response, cuerpo)
        # El diagnóstico primero: si hubo portero, lo demás es su envoltorio.
        # Y se dice qué hacer, porque el reflejo ante un bloqueo es buscarle la
        # vuelta y acá eso no se hace.
        encabezado = (
            f"la frenó el anti-bots de {quien}. La fuente no está rota y esto "
            "NO se evade: se pide acceso o se deja de pedir desde CI. "
            if quien
            else ""
        )
        error = BloqueadoPorPortero if quien else RuntimeError
        raise error(
            f"{encabezado}La API respondió {response.status_code} con "
            f"content-type «{tipo}», que no es JSON. Cabeceras: {pistas}. "
            f"Empieza así: {inicio!r}"
        ) from exc
