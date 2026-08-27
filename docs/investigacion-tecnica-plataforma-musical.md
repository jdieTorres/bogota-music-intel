# Investigación técnica — Plataforma de Inteligencia Musical (Bogotá/Colombia)

Consolidado de la investigación hecha en sesión de trabajo con Claude. No repite el contenido de `proyecto-plataforma-musical-bogota.md` (ese archivo se mantiene como fuente única del diseño del producto). Este documento cubre: stack técnico, estado de APIs de música, legalidad de scraping, auditoría de venues, y plan de ejecución del MVP.

---

## 1. Stack técnico decidido

- **Frontend:** Next.js (TypeScript), desplegado en Vercel (plan Hobby).
  - ⚠️ El plan Hobby de Vercel es explícitamente para uso **no comercial/personal**. Si el proyecto empieza a monetizar, hay que migrar a Pro (~USD 20/mes) o a otro hosting.
- **Backend:** Python + FastAPI (o funciones serverless de Vercel en Python, para evitar mantener un host de backend separado).
- **Base de datos:** Supabase (Postgres + Auth + Storage). Free tier: 500 MB DB, pausa tras 1 semana de inactividad (se reactiva con el primer request).
- **Scraping/ingesta programada:** GitHub Actions (cron), respetando `robots.txt` de cada sitio.
- **Mapas:** MapLibre GL + tiles OpenStreetMap/Protomaps (se evita Google Maps por costo).
- **Railway** se descartó como host de backend: ya no tiene tier gratis real (solo USD 5 de crédito por 30 días, luego USD 1/mes sin acumular).

### Bloqueador estructural clave descubierto
Spotify deprecó (27 nov 2024) para apps nuevas: `audio-features`, `audio-analysis`, `recommendations`, `related-artists` y los previews de 30s. Esto invalida el plan original de "Radar de tendencias" basado en Spotify API + librosa para BPM/tonalidad/energía. Búsqueda básica y metadata de Spotify sí siguen vivos. Pivote recomendado: usar Deezer (charts por país) + Last.fm (tags/scrobbles) como reemplazo, y dejar el análisis real de audio (BPM/energía con librosa/Essentia) para cuando haya una fuente de audio propia y legal (ej. Jamendo).

---

## 2. Estado verificado de APIs de música (documentación oficial revisada una por una)

### Funcionan bien (self-service, sin aprobación manual)
- **MusicBrainz** — gratis, sin key para consultas básicas. Límite estricto: 1 req/segundo (banean IP si te pasas), requiere User-Agent identificable. Artistas, releases, labels, works.
- **Discogs** — gratis, requiere registrar app (no aprobación manual). 25 req/min sin auth, 60 req/min autenticado.
- **Jamendo** — gratis hasta 35,000 req/mes. Catálogo real Creative Commons.
- **iTunes Search** (Apple) — sin auth, sin signup, ~20 req/min.
- **Radio Browser** (api.radio-browser.info) — 100% libre, open source, sin registro.
- **Mixcloud** — lectura abierta sin aprobación (solo escritura pide OAuth).
- **Deezer** — API abierta, incluye endpoint de charts por país (`/chart`).
- **Genius** — OAuth, letras y metadata crowdsourced.
- **Last.fm** — apiKey simple, tags/scrobbles/listening data.
- **Musixmatch** — apiKey, letras + metadata.
- **Lyrics.ovh** — sin auth, proyecto open source activo.
- **Napster** — gratis, self-service confirmado, límite generoso 500 req/seg. Cobertura de catálogo Colombia/LatAm **no confirmable por documentación** (ver sección 2.1).
- **Openwhyd** — Data Export API 100% libre sin auth: perfiles públicos, playlists, "hot tracks".

### Funcionan pero con letra pequeña / no aptas para producción
- **TheAudioDB** — key gratuita solo test/dev, limitada al artista "coldplay". Producción real requiere Patreon $8/mes.
- **AI Mastering** — responde, pero la empresa está priorizando su versión offline sobre la API.
- **TasteDive** — API legacy de lo que ahora es Qloo (empresa pivotó a producto B2B pago en 2019).
- **KSoft.Si Lyrics** — pensada para bots de Discord, requiere aprobación manual y quedarte en su Discord.

### Cerradas para proyecto personal/educativo
- **Songkick** — cita textual: "no estamos aprobando solicitudes de API para proyectos estudiantiles, educativos o de hobbyistas".
- **Bandsintown** — solo da acceso a artistas o representantes; no-artistas deben justificar caso de uso, no aceptan proyectos educativos.
- **Bandcamp** — el API real es Account/Sales/Merch para labels y partners, no para descubrir catálogo.

### Rotas / muertas / muriendo
- **SoundCloud** — registro de apps nuevas cerrado desde hace años.
- **MuseScore** (developers.musescore.com) — dominio muerto (DNS no resuelve).
- **Songlink / Odesli** — aviso oficial de cierre ("Shutting Down July 31st 2026" — fecha ya pasada).
- **Metal Archives** — no existe API oficial, solo scrapers no oficiales de terceros.
- **Genrenator** (tal como está linkeado en public-apis) — dominio muerto; el real vive en binaryjazz.us.

### No verificadas a fondo / riesgo legal / baja prioridad
- **Verome** — proyecto comunitario no oficial que scrapea YouTube Music vía proxies (riesgo legal real, viola ToS de YouTube). Solo para experimentar, nunca en producto público.
- **Vagalume** — enfocada 100% en música brasileña/portugués, baja relevancia para Colombia.
- **Audiomack** — docs no aclaran si el signup es self-service.
- **KKBOX, JioSaavn, Gaana** — mercados de Taiwán/Hong Kong e India, sin relación con Bogotá.
- **Phishin** — archivo de una sola banda (Phish), irrelevante.
- **Sunor (Suno)** — es generación de música por IA, no detección. Uso indirecto posible: generar datasets etiquetados "IA" para entrenar el Detector de música generada por IA.
- **Ticketmaster Discovery API / International Discovery API** — Colombia NO está en la lista de países soportados de ninguna de las dos. Ticketmaster opera en Colombia desde 2025 (compró La Tiquetera) pero esa operación no está integrada a su API pública.

### 2.1 Napster — investigación de cobertura LatAm (resuelta, resultado: no concluyente por vía documental)
Se revisaron developer.prod.napster.com, developer-beta.napster.com y páginas de terceros (jentic.com, publicapis.io/rapidapi). **Ninguna fuente documental publica una lista de países/territorios cubiertos por el catálogo.** La documentación solo describe capacidades funcionales (búsqueda, metadata, top artists, historial de escucha), sin mencionar Latinoamérica, Colombia ni restricciones geográficas.
- **Conclusión:** esto no se puede confirmar sin probar la API directamente (registrar API key gratuita y hacer una búsqueda real de artistas colombianos/latinoamericanos conocidos).
- **Siguiente paso recomendado:** registrar key gratis en developer.prod.napster.com y correr 3-5 queries de prueba (ej. buscar "Bomba Estéreo", "Andrés Cepeda", "Karol G") antes de construir el pipeline del módulo Scout de emergentes sobre Napster. Si el catálogo no responde bien para artistas colombianos, se cae de la lista de fuentes para ese módulo sin afectar el resto (Jamendo + Openwhyd siguen siendo la base).

### Mapa recomendado por módulo (fuentes gratuitas apiladas)
- **Directorio/wiki de la escena local:** MusicBrainz (principal) + Discogs + Genius.
- **Scout de emergentes:** Jamendo (principal) + Openwhyd (señal social) + Napster (si se confirma catálogo LatAm con prueba directa, ver 2.1).
- **Radar de tendencias:** Deezer charts + Last.fm (reemplaza a Spotify audio-features) + Openwhyd como señal cruzada.
- **Mapa de escena en vivo / Calendario de eventos:** ninguna API gratuita lo cubre — depende 100% de scraping (ver sección 3).
- **Motor de similitud sonora:** Essentia (pipeline propio) + Jamendo como fuente de audio legal.
- **Detector de música generada por IA:** clasificador propio; Jamendo (audio humano) + Sunor/Suno (ejemplos IA) como datasets.

---

## 3. Legalidad del scraping de eventos/venues

### Decisión tomada
Se descartó la vía de contactar venues/partnership como primer paso. Se va directo por scraping técnico.

### Marco legal general
- **hiQ Labs v. LinkedIn:** acceder a datos públicos sin login no viola por sí solo leyes de acceso no autorizado — no es un permiso general para cualquier scraping.
- Violar los Términos de Servicio de un sitio no es delito automáticamente, pero le da a la plataforma base contractual para bloquear/demandar.
- `robots.txt` no tiene fuerza legal, es señal de buena fe — ignorarlo debilita cualquier defensa si algo escala.

### Meta v. Bright Data (hallazgo reciente, relevante para Instagram/Facebook)
Corte del Distrito Norte de California (juez Edward Chen) falló que los ToS de Meta solo aplican a usuarios con sesión iniciada — scrapear contenido público de Instagram/Facebook **sin login** no viola sus términos. Matices importantes:
- Es fallo de corte de distrito, no precedente definitivo — apelable.
- Solo resuelve el reclamo de incumplimiento contractual; el de "interferencia dolosa" sigue sin resolver.
- No cubre derechos de autor: extraer texto (fecha, nombre, lineup) es distinto a reusar fotos/flyers.
- **El obstáculo real sigue siendo técnico:** se probó directamente y el `robots.txt` de Instagram bloquea el rastreo de páginas de perfil incluso sin login — esto es independiente del fallo legal. Instagram además pide login tras pocas vistas y tiene detección de bots activa.
- Conclusión aplicada: Instagram/Facebook quedan como fuente secundaria/manual, no como pipeline automatizado.

### Marco colombiano — Ley 1581 de 2012 (protección de datos personales)
Aplica solo a personas naturales, no a marcas/bandas/venues/eventos. 4 categorías: pública, semiprivada, privada, sensible. Requiere consentimiento previo/expreso/informado para tratar datos privados o sensibles.
- Nombre de venue, dirección, aforo, género, precio de boleta, fecha → NO es dato personal, seguro de scrapear.
- Nombre artístico publicado con fines promocionales → riesgo bajo.
- Nombre real de persona privada, foto personal, contacto, dato biométrico/salud/orientación → SÍ requiere consentimiento; evitar capturar si aparece incidentalmente.
- Si el proyecto maneja cuentas de usuario/datos personales a escala, hay que registrar la base de datos en el RNBD (Registro Nacional de Bases de Datos). No aplica en fase MVP de solo eventos públicos.

### Riesgo por tipo de fuente
| Fuente | Riesgo | Nota |
|---|---|---|
| Sitio propio del venue | Bajo | Ninguno de los auditados publica schema.org/Event — requiere parser de HTML a medida |
| Instagram / Facebook | Medio (matizado por Meta v. Bright Data) | Bloqueado técnicamente por robots.txt de Instagram — tratar como fuente manual |
| Plataformas de boletería (Tuboleta, Ticketmaster CO, Eticket) | Alto | Anti-bot activo, ToS contra scraping de precio/inventario |
| Agregadores de terceros (blogs de agenda) | Medio | Mismo problema de ToS sin ser fuente oficial |

### Decisión sobre Tuboleta — no evadir su bloqueo anti-IA
El `robots.txt` de Tuboleta bloquea explícitamente por nombre a ClaudeBot, GPTBot, Amazonbot, Google-Extended. Se descartó construir un scraper que evadiera ese bloqueo (cambiarle el User-Agent no cambia que sigue siendo un sistema automatizado corriendo en el pipeline diario — evadir una señal explícita de "no queremos bots de IA" debilita cualquier defensa de buena fe).

**Investigación de exclusividad (resuelta):** se comparó el listado de Tuboleta Bogotá (59 eventos, ago-nov 2026) contra el sitio propio de Movistar Arena (movistararena.co/en/events/), el venue con más presencia en ambos listados. Los mismos eventos aparecen en los dos lados (Jorge Drexler, WWE Bogotá, Jhon Alex Castaño, Jorge Celedón, Robbie Williams, Laura & Brenda, 5 Seconds of Summer, etc.) — **Tuboleta no es exclusiva para Movistar Arena, es un canal de venta duplicado de la misma cartelera que ya está en el sitio del venue.** Teatro Jorge Eliécer Gaitán es un escenario público (Idartes, `idartes.gov.co/es/agenda/teatro-jeg`) con agenda propia fuera de Tuboleta. Teatro Cafam es el caso más dudoso: su ticketing corre sobre un subdominio propio de Tuboleta (`cafam.checkout.tuboleta.com`), aunque cafam.com.co también publica programación editorial de "temporada de teatro" sin pasar por ahí.
- **Conclusión aplicada:** no se justifica invertir en el bookmarklet manual de Tuboleta para el MVP — las fuentes ya priorizadas (sitios propios de venue + Idartes para teatros públicos) cubren la gran mayoría de la cartelera relevante sin tocar una plataforma que bloquea bots de IA explícitamente. Se deja como pendiente de fase 2 solo si aparece un venue específico (ej. Teatro Cafam) donde se confirme que Tuboleta es la única fuente viable.

---

## 4. Auditoría de venues candidatos

| Venue | Estado | Fuente recomendada |
|---|---|---|
| Movistar Arena | Sitio propio (movistararena.co), robots.txt abierto | Scraping directo |
| Ace of Spades | ⚠️ **Corregido al implementar (2026-08-27):** el sitio redirige a `/new/`, un WordPress recién montado sin listado de eventos — solo el post "Hello world!" de ejemplo, un botón de reservas por WhatsApp y `wp-json` sin custom post types. No hay nada que scrapear. Difusión real: Instagram (@aceofspadesclub1) | Carga manual periódica hasta que publiquen cartelera |
| Lourdes Music Hall | Sitio propio (lourdesmusichall.com), robots.txt estándar | Scraping directo |
| Royal Center | Sitio propio (royalcenter.com.co), robots.txt permisivo — publica "Próximos Eventos" con fechas | Scraping directo |
| Latino Power | Tienda de boletas propia (tickets.latinopower.com.co), robots.txt estándar. **Hallazgo (2026-08-27):** corre el plugin *The Events Calendar*, que expone API REST pública y estructurada en `/wp-json/tribe/events/v1/events` (fechas con timezone, venue con dirección, costo). No requiere parsear HTML | API JSON — la mejor fuente de las seis |
| Capital Live Concerts | No es venue suelto — es la sala de Rockal Live / ROCKAL SAS (promotor real, con sitio propio y presencia en X/FB/LinkedIn). Tiene página de vendedor activa en eTicketaBlanca con eventos reales | Página de vendedor Rockal Live en eTicketaBlanca (`tickets.eticketablanca.com/seller/rockal-live-dltt`) |
| Boro Room | Sin sitio propio. Difusión casi 100% Instagram (@boro_room, activa). No tiene organizador fijo en eTicketaBlanca — cada show lo vende una productora distinta (ej. Sin Error Producciones tuvo solo 1 evento histórico ahí) | Sin fuente automatizable estable — carga manual periódica |
| The Bonfire | Mismo patrón que Boro Room: sin sitio propio, difusión en TikTok/Instagram, sin organizador fijo identificado en eTicketaBlanca | Sin fuente automatizable estable — carga manual periódica |
| Teatro Jorge Eliécer Gaitán *(nuevo, hallado vía investigación de exclusividad Tuboleta)* | Escenario público de Idartes, agenda propia en `idartes.gov.co/es/agenda/teatro-jeg` | Scraping directo (sitio institucional, sin bloqueo anti-IA conocido) |
| Teatro Cafam *(nuevo, mismo hallazgo)* | ⚠️ **Resuelto al implementar (2026-08-27):** cafam.com.co está detrás de Radware Bot Manager. **Todo** el dominio (no solo rutas admin) responde 302 a un challenge en `validate.perfdrive.com`, incluida la home y `wp-json`. Sortearlo iría contra la regla de no evadir bloqueos anti-bot | Carga manual periódica — queda descartado como pipeline automatizado |

### Plataformas de boletería auditadas
- **Tuboleta** — bloquea bots de IA explícitamente (ver sección 3). Evitar. Confirmado no-exclusiva para Movistar Arena (ver arriba).
- **eTicketaBlanca** — robots.txt estándar, sin bloqueo anti-IA. Sin schema.org/Event. Tiene páginas de venue (a veces vacías) y páginas de vendedor/organizador — el scraper debe apuntar a la que tenga los eventos reales, no asumir. No tiene un listado general de eventos vigentes navegable (la página `/eventos/` visible es de eventos pasados).
- **Páramo Presenta** — la página `/eventos` carga contenido dinámicamente vía JavaScript, sin JSON-LD. Requiere navegador headless (Playwright/Puppeteer), no fetch simple.
- **Rockal Live** — confirmado como promotor real (organiza shows en Capital Live Concerts), no solo tienda de merch.

### Conclusión técnica clave
Ningún sitio auditado publica `schema.org/Event` (JSON-LD) — hay que construir parsers de HTML a medida por sitio. **Matiz encontrado al implementar Fase 2:** dos de los seis sí exponen datos estructurados por otra vía — Latino Power vía la API REST de *The Events Calendar*, y Rockal Live vía el `__NEXT_DATA__` que eTicketaBlanca embebe en el HTML (es una app Next.js). Antes de escribir un parser de HTML conviene revisar si el sitio corre WordPress con plugin de eventos o un framework JS con estado embebido.

### Trampas de datos encontradas al implementar los parsers (2026-08-27)
Verificadas contra los sitios reales; hay tests de regresión en `services/api/tests/`.
- **Idartes miente en la zona horaria.** El atributo `<time datetime="2026-08-27T20:00:00Z">` está marcado como UTC pero el valor es hora **local** de Bogotá — la misma tarjeta muestra "8:00 pm". Tomarlo como UTC guardaba cada evento 5 horas antes.
- **Royal Center publica la fecha sin año** ("29 DE AGOSTO"). Inferir "la próxima ocurrencia futura" empuja los eventos ya pasados que siguen publicados un año hacia adelante, con una fecha falsa pero verosímil. Se resuelve con una ventana de tolerancia hacia el pasado.
- **La URL de boletería no sirve como identidad del evento.** Los venues la editan y reutilizan: en Lourdes, dos shows distintos ("Todos tus muertos" y "Lucho Al Attaque") comparten el mismo link de Passline, y la tarjeta de Bloodbath apunta a otros dos artistas. Identificar por URL perdía un evento real y duplicaba otros. Se usa título + fecha.
- **Las carteleras repiten eventos** (ej. el slider de destacados de Movistar Arena). Postgres rechaza un upsert con la misma clave dos veces en el mismo lote, así que hay que deduplicar antes de escribir.

### Trampas del frontend encontradas al implementar el mapa (2026-08-27)
- **MapLibre GL 6 se queda sin worker bajo Turbopack, y falla en silencio.** La v6 dejó de inlinear su worker como blob: ahora lo resuelve con `new URL('./maplibre-gl-worker.mjs', import.meta.url)` y **descarta el resultado si `import.meta.url` no empieza por `http(s):`**. Turbopack no le da una URL http ni en `next dev` ni en `next build`, así que `getWorkerUrl()` devuelve `""`. El síntoma engaña: el canvas, los marcadores, los controles y la atribución se dibujan bien, no hay excepción ni advertencia en consola, y el estilo, el TileJSON y el sprite se descargan con 200 — pero **no se pide ni una sola tesela** y el mapa queda en negro. La pista que lo delata es esa: peticiones de estilo sí, de teselas ninguna. Se resuelve copiando `maplibre-gl-worker.mjs` y su hermano `maplibre-gl-shared.mjs` a `public/` (`apps/web/scripts/copiar-worker-maplibre.mjs`, enganchado a `predev`/`prebuild`) y llamando a `setWorkerUrl()`. Ojo: afecta también al build de producción, no es un problema solo de dev.
- **La hoja de estilos de MapLibre pisa la del sitio.** Se importa desde el componente cliente, así que Next la inyecta *después* de `globals.css`: con la misma especificidad gana ella. El popup viene con `background:#fff` fijo y sobre la paleta oscura dejaba texto blanco sobre blanco. Los overrides en `globals.css` llevan una clase de más (`.maplibregl-popup .maplibregl-popup-content`) para ganar sin `!important`.
- **Nominatim devuelve la calle cuando no encuentra el lugar.** "CARRERA 13 #66-80" resolvió a un punto de Usaquén a más de 7 km del Royal Center — dentro de Bogotá, así que el filtro por bounding box no lo detectaba. Hay que mirar `addresstype` y rechazar los resultados demasiado gruesos (`road`, `suburb`, `city`…). Ver `services/api/bogota_music_intel/geocode.py`.

---

## 5. Plan de ejecución del MVP

**Ritmo de dedicación confirmado: medio tiempo** (varias horas, varios días a la semana). El cronograma original de 30-60 días asumía dedicación más intensiva; con medio tiempo, cada "semana" del plan probablemente toma 1.5-2 semanas reales de calendario. Se mantiene el plan por fases (no por fecha fija) y se ajusta el ritmo real semana a semana.

**Nombre del proyecto: placeholder confirmado — `bogota-music-intel`.** Se usa como nombre de repo, dominio de trabajo y namespace de carpetas/paquetes mientras se define el nombre final de marca. Convenciones derivadas:
- Repo: `bogota-music-intel`
- Paquete backend (FastAPI): `bogota_music_intel` (snake_case por convención de Python)
- Paquete frontend (Next.js): `bogota-music-intel-web` o carpeta `apps/web` dentro de un monorepo, según se decida la estructura en Fase 1
- Proyecto Supabase / variables de entorno: prefijo `bmi_` o `BOGOTA_MUSIC_INTEL_`

Alcance: los 3 módulos priorizados — Mapa de escena en vivo, Calendario agregador de eventos, Radar de tendencias. Directorio/wiki y API pública quedan para fase 2/futura.

1. **Fase 1 — Infraestructura:** repo `bogota-music-intel`, scaffold Next.js + FastAPI, proyecto Supabase, esqueleto de GitHub Actions, dominio si aplica.
2. **Fase 2 — Scraper base:** parsers a medida para Movistar Arena, Ace of Spades, Lourdes Music Hall, Royal Center, Latino Power, la página de vendedor de Rockal Live, y los dos hallazgos nuevos (Teatro Jorge Eliécer Gaitán vía Idartes, Teatro Cafam vía su sitio propio); almacenamiento en Supabase.
3. **Fase 3 — Calendario de eventos:** pipeline cron diario + vista de listado/detalle.
4. **Fase 4 — Mapa de escena en vivo:** MapLibre + capa de venues activos con los datos ya recolectados.
5. **Fase 5 — Radar de tendencias:** Deezer charts (CO) + Last.fm tags, vista de tendencias. (Napster se suma aquí solo si la prueba directa de cobertura LatAm, sección 2.1, sale positiva.)
6. **Fase 6 — Pulido y deploy:** testing con datos reales, deploy final en Vercel, borrador de la pieza narrativa insignia.
7. **Fase 7 (buffer):** iterar según feedback, sumar Boro Room/The Bonfire vía carga manual, mejorar UI, avanzar la pieza insignia.

### Pendiente de definir
- Nombre e identidad definitiva del proyecto (placeholder `bogota-music-intel` activo mientras tanto).
- Probar Napster con queries reales de artistas colombianos antes de incluirlo en el módulo Scout de emergentes / Radar de tendencias (ver 2.1).
- ~~Confirmar si Teatro Cafam necesita fuente manual~~ — **resuelto 2026-08-27:** sí, es manual. Todo el dominio está detrás de un WAF (ver sección 4).

---

## 6. Filtrado editorial — pendiente para después de Fase 4

Definido con Juan el 2026-08-27, tras revisar la cartelera ya poblada. **La plataforma prioriza y promueve los toques de artistas locales**, y hoy el pipeline mete todo lo que publica cada sala.

### Qué se está colando (medido sobre los 58 eventos reales en base)

**No es música:**
- `THE JUANPIS LIVE SHOW: "SI NOS ORGANIZAMOS CABEMOS TODOS"` — comedia/late night (Movistar Arena)
- `WWE Bogota 2026` — lucha libre (Movistar Arena)
- `HOMBRES A LA PLANCHA` — teatro (Royal Center)
- `'CONTINENTAL'`, `'Ella' de Luisa Fernanda Hoyos` — teatro (Teatro JEG)
- `Einstein on the Beach` — ópera/multidisciplinar (Teatro JEG)

**Es música pero no es artista local:** Robbie Williams, Helloween, 5 Seconds of Summer, Opeth, Of Monsters and Men, Blonde Redhead, Jorge Drexler, Gustavo Santaolalla, Cosculluela, Tini, Los Mirlos, Todos tus muertos, Inspector, Ky Mani Marley… (mayoría de la cartelera de Movistar Arena y buena parte de Royal Center).

### El obstáculo: la categoría de la fuente no alcanza
Solo **17 de 58** eventos traen `category`, y viene únicamente de dos fuentes:

| Fuente | Con categoría | Valores |
|---|---|---|
| Idartes Teatro JEG | 9/9 | Música, Teatro, Multidisciplinar |
| Rockal Live | 8/8 | Pop, Hip Hop/Rap, Reggaeton, Rock/Punk/Metal, Otro |
| Movistar Arena | 0/12 | — |
| Royal Center | 0/12 | — |
| Lourdes Music Hall | 0/9 | — |
| Latino Power | 0/8 | — |

Las dos salas que más ruido meten (Movistar Arena y Royal Center) son justamente las que no publican categoría. Filtrar por `category` resolvería el teatro de Idartes y poco más.

### Dos decisiones distintas, no una
Conviene separarlas antes de implementar:
1. **¿Es música en vivo?** WWE y una obra de teatro claramente no van. Esto es exclusión.
2. **¿Es artista local?** Un show de Robbie Williams en el Movistar *sí* es parte de la escena en vivo de Bogotá, aunque no sea local. Acá la pregunta es si se excluye o se muestra en segundo plano, destacando lo local. **Sin resolver — es decisión de producto de Juan.**

### Caminos técnicos a evaluar (ninguno elegido aún)
- **Resolver el artista contra MusicBrainz** (ya validada como API viable, sección 2): da país de origen del artista, que es exactamente el dato que falta. Ojo con su límite de 1 req/seg y con que el título del evento trae ruido a limpiar antes de consultar (`| BRITPOP`, `EN BOGOTÁ`, `2026`, `TOUR`).
- **Lista de exclusión por patrones** para lo obviamente no-musical (WWE, stand-up, obra de teatro). Barato y efectivo para los casos duros, pero no escala solo.
- **Marcar en vez de borrar:** guardar todo con una bandera (`es_local`, `tipo`) y decidir en la vista. Preserva el dato crudo y permite cambiar el criterio sin re-scrapear — coherente con cómo se resolvió la unificación de duplicados.

Cualquiera que se elija: **no perder el evento en la ingesta**. Mejor guardarlo clasificado y filtrarlo al mostrar, para poder revisar qué se está descartando.

---

### Estado de ejecución
- **Fases 1 a 4 completadas** (2026-08-27). Seis scrapers en producción alimentando Supabase; cuatro venues quedan en carga manual con el motivo documentado en `services/api/bogota_music_intel/scrapers/registry.py`. Calendario y mapa en `apps/web`.
- Geocodificación: 5 de 9 salas ubicadas. Las otras cuatro (Auditorio Mayor, Capital Live Concerts, **Lourdes Music Hall — 7 eventos próximos**, Teatro Libre Sala Centro) no existen como POI en OpenStreetMap y se listan aparte bajo el mapa. Se prefiere no ubicarlas antes que poner un pin en el lugar equivocado: buscar "Lourdes, Chapinero" devuelve con toda confianza la iglesia, no la sala.
- Siguiente: los dos pendientes acordados (filtrado editorial y look & feel) y la Fase 5 (radar de tendencias).
