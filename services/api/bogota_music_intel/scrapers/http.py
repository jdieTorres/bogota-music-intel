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
