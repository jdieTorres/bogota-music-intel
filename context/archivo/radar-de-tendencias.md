# Radar de tendencias — módulo retirado (archivo)

> Construido el 2026-08-28, sacado del MVP y borrado el 2026-08-31. No hay código ni ruta; está todo en el historial de git. Se conserva el registro por si el módulo vuelve.

## 7. Radar de tendencias (Fase 5) — implementado el 2026-08-28, un eje activo

Arrancó con las dos fuentes de la sección 2.2 (Deezer editorial 498 + Last.fm `geo.gettopartists`) y terminó con una sola en producción: el hallazgo de geolocalización de Deezer (sección 2.3) lo pausó a mitad de la misma sesión, después de haber commiteado y desplegado el pipeline completo con las dos.

### Cómo quedó

- Tabla nueva `trending_artists` (migración `supabase/migrations/20260828020000_trending_artists.sql`), aplicada a mano por Juan en el SQL editor de Supabase. Cada corrida inserta una foto (`captured_at`), no hace upsert: sirve para ver tendencia entre semanas más adelante. El frontend lee solo la foto más reciente por fuente.
- `services/api/bogota_music_intel/lastfm.py` trae `geo.gettopartists?country=colombia`. `deezer.py` existe pero no se llama desde el pipeline (ver 2.3).
- `radar.py` resuelve el origen de cada artista **reusando la lista curada de `artistas_locales.py` + MusicBrainz**, el mismo camino que ya usa `classify.py` para los eventos — no hay una segunda implementación del criterio "no sé" vs. "confirmado que no".
- `radar_cli.py` sigue el mismo patrón que `classify_cli.py`: si MusicBrainz deja de responder, corta a las 3 fallas seguidas en vez de perder tres reintentos por cada artista restante. Uso: `python -m bogota_music_intel.radar_cli [--dry-run] [--limit N]`.
- Paso nuevo en `.github/workflows/scraper.yml` (`Update trending radar`), con el secret `BMI_LASTFM_API_KEY` agregado al repo el 2026-08-28. Verificado en una corrida `workflow_dispatch` real, en verde.
- Frontend en `/tendencias` (`apps/web/src/app/tendencias/page.tsx`), verificado en navegador (claro y oscuro).

### Trampa encontrada: la imagen "genérica" de Last.fm

Last.fm dejó de servir fotos reales de artista por su API hace años (tema de licencias) y devuelve **la misma imagen** —una estrella genérica, hash `2a96cbd8b46e442fc41c2b86b821562f`— para los 100 artistas de una corrida real. No viene documentado como tal; se ve en pantalla como si la imagen no hubiera cargado. `lastfm.py` filtra ese hash específico y devuelve `None` en vez de mostrarlo como si fuera la foto del artista.

### MusicBrainz, otra vez el cuello de botella

El 2026-08-28 MusicBrainz devolvió 503 con mucha frecuencia (varias corridas de prueba tuvieron entre 4 y 8 artistas sin resolver de 100). No es un bug de esta sesión: es el mismo servicio ya documentado como frágil en la sección "Trampas encontradas" de arriba, con el agravante de que acá se consultan ~100 artistas por corrida en vez de ~50 eventos. Una corrida completa (`--limit 50`, 100 candidatos) tardó **8m36s en GitHub Actions** el 2026-08-28 — vale como referencia de cuánto puede tardar el paso del cron, no es una corrida colgada.

### Cuenta real (2026-08-28, última foto de `lastfm_geo`)

50 artistas: 6 confirmados locales (KAROL G, Feid y otros ya en la lista curada o resueltos por MusicBrainz), el resto internacionales o sin resolver — el radar no oculta que lo más escuchado en Colombia está dominado por lo internacional, es justamente el dato que interesa mostrar.

### Ver también

Sección 2.3 tiene el detalle completo del hallazgo de Deezer y lo que haría falta para retomarlo.

---

### Estado de ejecución
- **Fases 1 a 4 completadas** (2026-08-27). Seis scrapers en producción alimentando Supabase; cuatro venues quedan en carga manual con el motivo documentado en `services/api/bogota_music_intel/scrapers/registry.py`. Calendario y mapa en `apps/web`.
- Geocodificación: **9 de 9 salas ubicadas** (2026-08-27). Cinco las resolvió Nominatim; las otras cuatro (Auditorio Mayor, Capital Live Concerts, Lourdes Music Hall, Teatro Libre Sede Centro) no existen como POI en OpenStreetMap y se curaron a mano en `coordenadas_curadas.py`.
  - **OpenStreetMap no tiene numeración de casas en Bogotá.** Probado el 2026-08-27 con consulta libre, con búsqueda por intersección y con la API estructurada: las tres devuelven `house_number = null`. "Carrera 13 #48-90" da cuatro puntos repartidos entre Usme y Usaquén, y "Calle 23 #6-19" —que es centro— resuelve a Fontibón, 4 km al oeste. No hay geocodificador que ajustar: en esta ciudad el punto lo pone una persona.
  - Las coordenadas curadas las pasó Juan desde Google Maps y se verificaron **por geocodificación inversa**, comprobando que cada punto cayera sobre la calle que la propia sala publica. Es una comprobación independiente de quien pasó el dato y atrapa el error típico (lat/lon invertidas, un dígito de más) sin abrir un mapa.
  - Sigue valiendo la regla que las mantuvo sin ubicar hasta tener el dato: mejor "sin ubicar" que un pin equivocado. Buscar "Lourdes, Chapinero" devuelve con toda confianza la iglesia Nuestra Señora de Lourdes, no la sala.
- **Filtrado editorial aplicado en la base el 2026-08-27** (sección 6). Los 58 eventos quedaron clasificados y la cartelera muestra 48. Verificado contra el servidor de desarrollo: la home y `/mapa` renderizan, ninguno de los 6 no-musicales aparece, y en los 6 días que mezclan local con internacional el orden es el correcto en los 6.
- **Fase 5 (radar de tendencias) implementada el 2026-08-28** (sección 7), con un solo eje en producción — Deezer quedó pausado por geolocalización de IP (sección 2.3).
- Look & feel: primera ronda cerrada el 2026-08-28 (Verde Neón), con una pasada final pendiente antes del deploy — ver `CLAUDE.md` § Pendientes activos.
- **Fase 6 (pulido y deploy) arrancada.** Panel de sala en el mapa y normalización de títulos el 2026-08-29; la normalización revisada a fondo contra los 53 títulos reales el 2026-08-31 (sección 8). La columna `venues.photo_url` existe y está aplicada, pero `fotos_curadas.py` sigue vacío: **0 de 9 salas con foto**, esperando URLs reales de Juan.
- **Sin desplegar a Vercel** (verificado el 2026-08-31: no hay configuración de Vercel en el repo). Todo lo verificado hasta hoy es local.
- El workflow `Tests` estuvo **en rojo desde el 2026-08-29 hasta el 2026-08-31**, por dos errores de `ruff` heredados del commit del radar — no por los tests, que pasaban. Ya arreglado; la lección de por qué nadie lo vio está en `CLAUDE.md` § Lo que quedó a medias.
- ⚠️ **MusicBrainz no clasificó desde CI un evento que sí clasifica local** (Carlos Vives, cron del 2026-08-30). Segundo caso del mismo patrón que Deezer (sección 2.3): una API que responde distinto según desde dónde se la llame.
- Siguiente: desplegar a Vercel, ver si el cron clasifica solo el evento pendiente, y la pasada final de look & feel antes del deploy. Retomar el eje de Deezer sigue siendo opcional.

---


---

## El bloqueador que originó el pivote

### Bloqueador estructural clave descubierto
Spotify deprecó (27 nov 2024) para apps nuevas: `audio-features`, `audio-analysis`, `recommendations`, `related-artists` y los previews de 30s. Esto invalida el plan original de "Radar de tendencias" basado en Spotify API + librosa para BPM/tonalidad/energía. Búsqueda básica y metadata de Spotify sí siguen vivos. Pivote recomendado: usar Deezer (charts por país) + Last.fm (tags/scrobbles) como reemplazo, y dejar el análisis real de audio (BPM/energía con librosa/Essentia) para cuando haya una fuente de audio propia y legal (ej. Jamendo).

---
