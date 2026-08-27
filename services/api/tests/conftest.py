import pytest

from bogota_music_intel import musicbrainz


@pytest.fixture(autouse=True)
def sin_esperas(monkeypatch):
    """Los tests no salen a la red, así que respetar el límite de 1 req/seg
    de MusicBrainz solo los haría lentos. Las esperas se prueban aparte, no
    se sufren en cada test."""
    monkeypatch.setattr(musicbrainz, "SEGUNDOS_ENTRE_PETICIONES", 0)
    monkeypatch.setattr(musicbrainz, "ESPERA_TRAS_503", 0)
