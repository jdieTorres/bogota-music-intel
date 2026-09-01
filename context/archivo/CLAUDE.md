# Archivo — lo que se evaluó, se construyó o se descartó

Nada de acá está vivo. **No se carga como contexto de trabajo**: existe para
que no se vuelva a evaluar lo ya evaluado, ni se reconstruya lo que se sacó a
propósito.

Antes de proponer una fuente de datos de música o de reabrir el radar, mirar
acá.

- **`apis-de-musica.md`** — el estado verificado de las APIs de música, una
  por una. Cuatro entradas de la investigación documental resultaron falsas al
  llamarlas de verdad. Napster no existe: sus tres dominios no resuelven DNS.
  Deezer e iTunes **no exponen país del artista**; Wikidata lo tiene
  estructurado pero no conoce a los locales. Spotify deprecó `audio-features`,
  `audio-analysis`, `recommendations` y `related-artists` para apps nuevas.
- **`radar-de-tendencias.md`** — el módulo que fue Fase 5, construido el
  2026-08-28 y borrado el 2026-08-31. Su dato era prestado —Last.fm lo
  consulta cualquiera— y contradecía el principio editorial: el propio
  hallazgo del radar es que lo más escuchado en Colombia es internacional. Se
  borraron `radar.py`, `radar_cli.py`, `lastfm.py`, `deezer.py`,
  `/tendencias`, `trending.ts`, `TendenciaCard.tsx`, sus 9 tests, el link del
  nav y el paso del cron. **Está todo en el historial de git.**
