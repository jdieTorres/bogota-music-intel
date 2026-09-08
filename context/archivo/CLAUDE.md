# Archivo — lo que se evaluó, se construyó o se descartó

Nada de acá está vivo. **No se carga como contexto de trabajo**: existe para
que no se vuelva a evaluar lo ya evaluado, ni se reconstruya lo que se sacó a
propósito.

Antes de proponer una fuente de datos de música, de reabrir el radar o de
instalar algo que prometa ahorrar tokens, mirar acá.

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
- **`grafo-de-conocimiento.md`** — la skill `/graphify`, instalada y sacada el
  2026-09-07. Costó 292.666 tokens de entrada en su única corrida y no devolvió
  ninguno: el `/context` mostró la ventana al 6 %, así que no había presión de
  contexto que aliviar. Los hooks que lo disparaban solo vivían en un
  `.claude/settings.json` que hubo que revertir, y nada avisaba cuando el grafo
  quedaba viejo. **Antes de instalar algo que prometa ahorrar tokens, medir con
  `/context`.**
- **`fotos-curadas.md`** — `fotos_curadas.py` y `fotos_cli.py`, escritos el
  2026-08-29 y archivados el 2026-09-08 **sin una sola entrada**. Ninguna
  fuente publica foto del venue, así que el dato entra a mano; de ahí se
  concluyó mal que iba en una lista curada como las otras seis, cuando esas
  las alimenta la ingesta y esta la alimenta una persona. Cargar una foto
  costaba commit, CLI y despliegue. **Una lista curada es la respuesta cuando
  el dato lo produce la ingesta; cuando lo produce una persona, el lugar es el
  formulario** — la misma lección que ya había dejado `eventos_excluidos.py`.
- **`mcp-de-github.md`** — el servidor MCP de GitHub, puesto y sacado el
  2026-09-07. Su OAuth no soporta *dynamic client registration*, así que el
  login de `/mcp` falla con `Incompatible auth server` y la única vía era un
  PAT clásico guardado a mano. No compensaba: su valor está en PRs e issues y
  acá se trabaja directo sobre `main`; lo único que se le iba a pedir —mirar
  los dos workflows del CI— lo hace `gh run list`. **Si hace falta ver el CI
  desde la sesión, instalar `gh`, no reinstalar este MCP.**
