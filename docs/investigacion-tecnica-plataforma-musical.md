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

> ⚠️ **Lo de abajo se verificó leyendo documentación, no llamando a las APIs.** El 2026-08-28 se llamaron de verdad las que importan para los módulos actuales y para la Fase 5, y **cuatro entradas resultaron inexactas** — ver 2.2. Antes de construir sobre cualquier fila de estas listas, probala.

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

### 2.2 Verificación por uso (2026-08-28) — qué pasó al llamarlas de verdad

Se llamaron con `httpx` desde la máquina de Juan. Cuatro correcciones a las listas de arriba:

| Entrada | Decía | Es |
|---|---|---|
| **Napster** | "funciona bien, self-service, 500 req/seg" | **Muerta.** `api.napster.com`, `developer.napster.com` y `developer.prod.napster.com` **no resuelven DNS**. Solo responde `www.napster.com`, que hoy es otro producto. Esto cierra el pendiente 2.1 sin necesidad de probar catálogo. |
| **Deezer** | "incluye endpoint de charts por país (`/chart`)" | **`/chart/{id}` es por género/editorial, no por país.** `/chart/0` es el global. No hay chart de Colombia como país. |
| **Songlink / Odesli** | "aviso de cierre, fecha ya pasada" | Confirmado cerrada: devuelve `401 PUBLIC_API_ACCESS_DEPRECATED`. |
| **Discogs** | "requiere registrar app" | La **búsqueda básica funciona sin token** (`/database/search?type=artist` devuelve 200). El registro hace falta para el resto y para subir el límite. |

Confirmadas vivas y respondiendo: MusicBrainz, Deezer, iTunes Search, Radio Browser, Lyrics.ovh, Openwhyd, Mixcloud, Discogs. Con key y vivas (responden el error de credencial, o sea que el servicio existe y el alta es self-service): Last.fm, Jamendo, Genius, Musixmatch.

#### El hallazgo que sí sirve para la Fase 5 (y el que lo tumbó después)
Deezer no tiene charts por país, **pero sí una editorial "Música colombiana" (id 498)**, y funciona: `GET /editorial/498/charts` devuelve tracks y artistas reales de la escena (Systema Solar, Kraken, Junior Jein, Totó La Momposina; KAROL G, Ryan Castro, Feid). Para esta plataforma es **mejor** que un chart de país, que estaría lleno de pop global.

Ojo con un detalle editorial ya conocido: esa lista es de *género*, no de nacionalidad — entre los artistas aparece Bad Bunny. Es el mismo problema que ya se resolvió en la cartelera, y el radar reusa la misma lista curada + MusicBrainz para resolverlo.

⚠️ **Pausado el 2026-08-28: la editorial geolocaliza por IP, no por id — ver 2.3.** El hallazgo de arriba se verificó llamando a la API de verdad, pero desde Bogotá. Llamada desde el runner de GitHub Actions que corre la ingesta, la misma URL con el mismo id 498 devuelve un chart genérico sin nada colombiano. No sirve para producción tal como está.

**Last.fm aporta el eje que a Deezer le falta**: tiene `geo.gettopartists?country=colombia`, o sea popularidad por país. Es un parámetro explícito de la consulta, no depende de la IP de quien pregunta —a diferencia de Deezer, no tiene el problema de 2.3—. Key sacada el 2026-08-28.

#### La pregunta que se fue a responder: ¿alguna API cubre el hueco de MusicBrainz?
El problema conocido es que MusicBrainz conoce a los artistas locales pero **sin país**, y por eso hay ocho curados a mano. Se probó con esos ocho:

- **Deezer: no expone país del artista.** Ni siquiera de Karol G o Bomba Estéreo. No sirve para esto.
- **iTunes Search: tampoco.** Encuentra a los seis locales, pero sus campos son `artistId`, `artistName`, `artistType`, `primaryGenre…` — no hay país. Sirve para confirmar que un artista existe, no de dónde es.
- **Wikidata** (que no estaba en el doc) **es la única con datos de país estructurados**, y aun así falla acá: de los seis locales solo tiene entidad para Todo Copas —que resuelve bien, "Colombian hip-hop group" → Colombia—. El Kalvo, Atake Mapalé, Los Yoryis y Ancestral Beats no existen. Y **"Mukangu" devuelve un lugar de Kenia**: el mismo falso positivo que ya obligó al guardia de parecido en MusicBrainz.

**Conclusión: ninguna API resuelve el origen del artista local emergente.** No es un problema de elegir mal la fuente; es que estos artistas no están en las bases globales. La lista curada a mano no es un parche temporal, es la respuesta. Se cierra la búsqueda.

### 2.1 Napster — investigación de cobertura LatAm (cerrada el 2026-08-28: la API ya no existe)
Se revisaron developer.prod.napster.com, developer-beta.napster.com y páginas de terceros (jentic.com, publicapis.io/rapidapi). **Ninguna fuente documental publica una lista de países/territorios cubiertos por el catálogo.** La documentación solo describe capacidades funcionales (búsqueda, metadata, top artists, historial de escucha), sin mencionar Latinoamérica, Colombia ni restricciones geográficas.
- **Resuelto de otra forma el 2026-08-28: la pregunta ya no aplica.** Al ir a registrar la key se encontró que **los tres dominios están caídos a nivel DNS** (`api.napster.com`, `developer.napster.com`, `developer.prod.napster.com`). No hay catálogo que probar. Napster sale de la lista de fuentes.
- Consecuencia para el **Scout de emergentes**: se queda con Jamendo + Openwhyd, que era el plan si la prueba salía mal. No hace falta buscar reemplazo ahora.
- Vale como recordatorio del método: la investigación documental dejó esto abierto meses; **un `GET` lo cerró en un segundo**. Cuando una duda se pueda contestar llamando a la API, llamarla antes que seguir leyendo.

### 2.3 Deezer editorial 498 geolocaliza por IP (descubierto el 2026-08-28, pausado)
La Fase 5 se implementó completa (migración, `deezer.py`, `radar.py`, `radar_cli.py`, frontend en `/tendencias`, paso nuevo en el cron) y se corrió a mano desde el equipo de Juan (Bogotá): trajo Systema Solar, Kraken, KAROL G, Feid — el chart colombiano esperado. Se hizo commit y push, y se disparó el cron real (`workflow_dispatch`) para verificar de punta a punta.

**La corrida en GitHub Actions guardó otra cosa.** Mismo endpoint, mismo id de editorial (498), sin ningún error ni código de estado distinto: devolvió un chart genérico —Dolly Parton, Drake, Taylor Swift, The Beatles, Eminem— sin un solo artista colombiano en 50. Comparado con una llamada hecha en el momento desde la IP de Bogotá (verificada contra ipinfo.io: `186.84.89.98`, Bogotá, AS10620 Telmex Colombia), que sí devolvió el chart correcto.

**Conclusión: la editorial de Deezer geolocaliza la respuesta por la IP de quien pregunta, no solo por el id que se pide.** El nombre "editorial" sugiere contenido curado y estable por id, y no lo es — es sensible a la ubicación del servidor que llama, sin documentarlo y sin ninguna señal de error que lo delate. Se probó agregar `country=CO` y `relation=CO` como parámetros; no cambiaron el resultado desde Bogotá, pero no se pudo confirmar el efecto real desde una IP no colombiana (no hay una forma de simular eso en este entorno).

**Consecuencia:** la ingesta corre en GitHub Actions (no en Colombia), así que este eje del radar no sirve para producción tal como está. Se pausó: se borraron las 115 filas `deezer_editorial` ya guardadas (dato no verificado, incluida la foto mala de esa corrida), `deezer.py` queda intacto sin llamarse desde `radar.py`, y el frontend de `/tendencias` muestra solo el eje de Last.fm con una nota explicando por qué. El radar sigue siendo útil con un solo eje: Last.fm no tiene este problema porque `country=colombia` es un parámetro explícito de la consulta, no depende de dónde corre el servidor.

**Para retomarlo hace falta una de estas tres cosas**, ninguna probada todavía: (a) confirmar si algún parámetro documentado de Deezer fuerza el país sin depender de IP —lo intentado hasta ahora no funcionó, pero se intentó sin poder verificarlo desde afuera de Colombia—; (b) rutear la llamada a través de un proxy o función serverless con salida en Colombia; o (c) resignarse a que Deezer solo sirve corrido a mano desde Colombia, nunca desde el cron.

**Nota de método:** esto es el mismo error que ya cerró la sección 2.1 (Napster) un nivel más abajo. "Se verificó llamando a la API" no alcanza si se llama siempre desde el mismo lugar — la respuesta puede depender de dónde se llama, no solo de qué se pide. La próxima vez que una fuente geolocalice contenido (charts, precios, disponibilidad), probarla también desde el entorno real donde va a correr en producción, no solo desde la máquina de desarrollo.

### Mapa recomendado por módulo (fuentes gratuitas apiladas)
- **Directorio/wiki de la escena local:** MusicBrainz (principal) + Discogs + Genius.
- **Scout de emergentes:** Jamendo (principal) + Openwhyd (señal social). ~~Napster~~ sale: la API dejó de existir (ver 2.1).
- **Radar de tendencias (Fase 5) — implementado el 2026-08-28, un solo eje activo.** Last.fm `geo.gettopartists?country=colombia` funciona en producción. Deezer editorial 498 ("Música colombiana") está pausado: geolocaliza por IP y no sirve corrido desde GitHub Actions — ver 2.3. Openwhyd como señal cruzada queda para más adelante, sin arrancar.
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

### Auditoría de `robots.txt` de fuentes de eventos (2026-08-31)

Hecha al buscar cómo tapar el hueco de cobertura: el scraping actual solo ve las salas que publican su propia cartelera, y deja fuera lo que se vende por ticketera o se anuncia por redes. Se pidió el `robots.txt` de nueve sitios y se miró el bloque `User-agent: *` y los agentes de IA nombrados.

| Fuente | ¿Nos deja? | Nota |
|---|---|---|
| **visitbogota.co** | ✅ | **El hallazgo.** Agenda oficial del distrito, sobre Drupal; su `robots.txt` solo veda rutas de sistema (`/core/`, `/admin/`, `/user/…`). `/es/agenda-de-eventos` está abierto. **Agrega eventos vendidos por Tuboleta** — el Carlos Vives del Movistar aparece ahí. |
| **ticketlive.com.co** | ✅ | Ticketera; publica salas que ya seguimos (Lourdes Music Hall). |
| **mitaquilla.com.co** | ✅ | Ticketera; publicaba el Bloodbath de Lourdes. |
| **feverup.com** | ✅ | Agregador; tiene ficha de Lourdes Music Hall. |
| idartes.gov.co, tickets.eticketablanca.com | ✅ | Ya en uso. |
| **tuboleta.com** | ❌ | Bloquea ClaudeBot, GPTBot, CCBot, Google-Extended. Sin cambios: sigue vedada. |
| **bandsintown.com** | ❌ | Bloquea los mismos cuatro. Ya estaba cerrada por API; ahora también por `robots.txt`. |
| **songkick.com** | ❌ | Igual que Bandsintown. |

**Consecuencia:** hay cuatro fuentes abiertas sin explotar, y una de ellas —la agenda del distrito— cubre parte de lo que se vende por Tuboleta **sin tocar Tuboleta**. No es evadir el bloqueo: es tomar el dato de quien sí nos deja.

Lo que **no** cambia: Tuboleta, Bandsintown y Songkick siguen fuera del pipeline automático. Para esos, y para Instagram, la vía es **pegar, no traer**: el admin copia el texto o el flyer en el formulario y el sistema prellena. La distinción es real y no hay que difuminarla — si el admin pega una URL y *nuestro servidor* la va a buscar, sigue siendo nuestro agente entrando donde no lo dejan; si pega el contenido, no hay robot.

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

### El script anti-parpadeo del tema no puede ir con `next/script` (2026-08-31)

Salió de un error de consola que vio Juan navegando: *"Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client"*, apuntando al `<Script strategy="beforeInteractive">` del `layout.tsx`.

El error de consola era el síntoma menor. **Mirando el HTML servido, el script nunca se emitía como etiqueta ejecutable**: Next lo empuja a una cola, `self.__next_s`, que procesa su propio runtime al arrancar. O sea que el tema guardado quedaba atado a que cargara el bundle de JS, y no podía aplicarse antes del primer pintado — exactamente lo contrario de lo que el comentario del código afirmaba desde el 2026-08-28.

La documentación de Next lo dice sin vueltas y contradice el nombre de la estrategia: los scripts `beforeInteractive` *"se precargan y se buscan antes que cualquier código propio, pero su ejecución **no bloquea la hidratación**"*. Para un anti-parpadeo eso no alcanza: hace falta que corra mientras el navegador parsea el HTML.

**En localhost no se ve el defecto**, y eso es lo que lo mantuvo escondido: medido en el navegador, el CSS y el primer chunk de JS terminan en el mismo milisegundo (902 ms los dos), así que la ventana de parpadeo es de 0 ms. En producción, con el bundle llegando por red después del CSS, la ventana existe.

Arreglado con un `<script dangerouslySetInnerHTML>` crudo en el `<head>`, que React renderiza en el HTML del servidor y el navegador ejecuta al parsear. Verificado en el HTML servido —la etiqueta está, la cola `__next_s` ya no— y en el navegador, sin errores de consola al navegar entre rutas.

**La lección, que ya es la tercera del mismo tipo en este proyecto:** el mapa en negro con CI verde, Deezer geolocalizando por IP, y ahora esto. Las tres se veían bien desde donde se estaba mirando. Acá ni siquiera el navegador alcanzaba: hubo que mirar el HTML que sale del servidor, porque en el DOM ya inspeccionado el `<script>` **sí aparece** — lo inyecta el runtime de Next después.

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
5. **Fase 5 — Radar de tendencias — implementada el 2026-08-28, un eje activo.** Last.fm en producción; Deezer pausado por geolocalización de IP (ver 2.3). Sección 7 tiene el detalle completo de la implementación.
6. **Fase 6 — Pulido y deploy:** testing con datos reales, deploy final en Vercel, borrador de la pieza narrativa insignia.
7. **Fase 7 (buffer):** iterar según feedback, sumar Boro Room/The Bonfire vía carga manual, mejorar UI, avanzar la pieza insignia.

### Pendiente de definir
- Nombre e identidad definitiva del proyecto (placeholder `bogota-music-intel` activo mientras tanto).
- ~~Probar Napster con queries reales antes de incluirlo~~ — **cerrado 2026-08-28:** la API ya no existe, sale de la lista de fuentes (ver 2.1). No hace falta probarla.
- ~~Confirmar si Teatro Cafam necesita fuente manual~~ — **resuelto 2026-08-27:** sí, es manual. Todo el dominio está detrás de un WAF (ver sección 4).
- Encontrar una forma real de traer el eje de Deezer sin depender de la IP del servidor (ver 2.3), o resignarse a que quede fuera del cron.

---

## 6. Filtrado editorial — implementado el 2026-08-27

Definido con Juan el 2026-08-27, tras revisar la cartelera ya poblada. **La plataforma prioriza y promueve los toques de artistas locales**, y hasta ese momento el pipeline metía todo lo que publica cada sala.

### Las dos decisiones de producto (tomadas por Juan, 2026-08-27)

Estaban trabadas porque son dos preguntas distintas y solo Juan podía contestarlas:

1. **Lo que no es música en vivo se excluye siempre** de la cartelera visible: comedia, lucha libre, teatro, ópera. No son el producto.
2. **Los artistas internacionales NO se excluyen**: se muestran, pero en segundo plano respecto a los locales. Un show de Robbie Williams en el Movistar es parte de la escena en vivo de Bogotá aunque no sea un toque local.

La segunda decisión es la que evita convertir el filtro en una tijera: excluir todo lo internacional habría borrado media cartelera y con ella el contexto de la escena.

### El problema que se resolvió (medido sobre los 58 eventos reales en base)

**No es música** — estos seis son los que hoy quedan fuera de la cartelera:
- `THE JUANPIS LIVE SHOW: "SI NOS ORGANIZAMOS CABEMOS TODOS"` — comedia/late night (Movistar Arena)
- `WWE Bogota 2026` — lucha libre (Movistar Arena)
- `HOMBRES A LA PLANCHA` — teatro (Royal Center)
- `'CONTINENTAL'`, `'Ella' de Luisa Fernanda Hoyos` — teatro (Teatro JEG)
- `Einstein on the Beach` — ópera/multidisciplinar (Teatro JEG)

**Es música pero no es artista local:** Robbie Williams, Helloween, 5 Seconds of Summer, Opeth, Of Monsters and Men, Blonde Redhead, Jorge Drexler, Gustavo Santaolalla, Cosculluela, Tini, Los Mirlos, Todos tus muertos, Inspector, Ky Mani Marley… (mayoría de la cartelera de Movistar Arena y buena parte de Royal Center).

### El obstáculo: la categoría de la fuente no alcanza (por eso hacen falta las otras tres señales)
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

### Cómo quedó implementado

Se marca, no se borra: la ingesta sigue guardando todo crudo y la clasificación se escribe encima, en cuatro columnas nuevas de `events` (`event_type`, `is_local`, `classification_source`, `classified_at` — migración `supabase/migrations/20260828000000_clasificacion_editorial.sql`). Cambiar el criterio no obliga a volver a scrapear el pasado.

El clasificador vive en `services/api/bogota_music_intel/classify.py` y aplica cuatro señales, **de la más confiable a la más frágil, ganando la primera que contesta**:

| Orden | Señal | Dónde | Por qué en ese lugar |
|---|---|---|---|
| 1 | Lista curada a mano | `clasificacion_manual.py` | Alguien lo verificó en la fuente. Exige `evidencia`, igual que `coordenadas_curadas.py` |
| 2 | Categoría de la fuente | `exclusion_patterns.py` | La publicó la sala; no la inventamos nosotros |
| 3 | Patrón en el título | `exclusion_patterns.py` | Heurística nuestra, para las fuentes sin categoría |
| 4 | MusicBrainz | `musicbrainz.py` | Solo para el origen del artista |

Se corre aparte del scraping: `python -m bogota_music_intel.classify_cli [--dry-run] [--todas]`. Por defecto solo toca lo que llegó sin clasificar, así que es incremental. A diferencia de la geocodificación —que se deja a mano porque la política de Nominatim pide no automatizarla— este paso sí corre en el cron: MusicBrainz solo limita el ritmo.

**Los patrones se mantienen deliberadamente pocos y estrechos.** La tentación es ensancharlos hasta atrapar todo, pero el costo es asimétrico: un patrón ancho saca un toque real de la cartelera y nadie se entera nunca. Por eso no hay patrón para `live show` —esa frase también aparece en títulos de conciertos— y "THE JUANPIS LIVE SHOW" se cura a mano.

### Resultado medido sobre los 58 eventos reales (2026-08-27)

**6 fuera de cartelera**, que son exactamente los seis que se estaban colando:

| Evento | Cómo se detectó |
|---|---|
| `'CONTINENTAL'`, `'Ella'` | categoría `Teatro` de Idartes |
| `Einstein on the Beach` | categoría `Multidisciplinar` de Idartes |
| `WWE Bogota 2026` | patrón `\bwwe\b` |
| `THE JUANPIS LIVE SHOW` | curado a mano |
| `HOMBRES A LA PLANCHA` | curado a mano |

`HOMBRES A LA PLANCHA` es el caso que obliga a que exista la lista curada: es una obra de teatro en el Royal Center cuyo título se lee **exactamente igual que el nombre de una banda**, y esa fuente no publica categoría. No hay regla honesta que lo saque sin sacar también música.

### Resultado final (2026-08-27, tras la categoría fiesta y el arreglo de la limpieza)

Sobre los mismos 58 eventos: **6 fuera de cartelera, 5 fiestas, 5 locales, 34 internacionales, 8 sin origen resuelto.** En pantalla quedan 44 conciertos y 3 fiestas próximas (más una sin fecha), tras unificar duplicados entre fuentes.

Los "sin resolver" bajaron de 20 a 8, y casi todo ese rescate vino de **arreglar la limpieza de títulos, no de curar a mano**. Es el hallazgo de proceso más útil de esta fase: la primera lectura fue "hay 20 eventos que necesitan lista curada", y la mitad eran fallas de código que se repetían con cada evento futuro. Conviene agotar lo automatizable antes de empezar a curar, porque curar no escala.

El caso que lo resume: `10 AÑOS Y NO AZARAN - LA MUCHACHA EN BOGOTÁ`. La búsqueda se quedaba con el primer tramo, que es el nombre de la gira, y perdía a La Muchacha — que MusicBrainz sí resuelve como colombiana. Ahora se prueban varios candidatos del título en orden, y solo se paga la petición extra cuando el primero no resolvió. Lo mismo recuperó a Sara Curruchich (GT), Shing02 (JP) y Rayos Láser (AR).

### El hallazgo incómodo: MusicBrainz cubre mal la escena local

Aun después del arreglo, solo 5 eventos quedaron confirmados como locales, y 4 de los 5 son de música popular con catálogo comercial (Jorge Celedón, Jhon Alex Castaño, Jhonny Rivera) o se resolvieron a mano (Todo Copas). La quinta, La Muchacha, apareció solo porque se arregló la búsqueda.

De los 8 que siguen sin origen, **cinco existen en MusicBrainz pero sin país**: El Kalvo, PABLOPABLO, Ancestral Beats, Slaughter to Prevail y El plan de la mariposa. Es decir: MusicBrainz resuelve bien al internacional consagrado y mal justamente al artista local emergente, que es a quien la plataforma existe para promover.

Consecuencia de diseño: **el `null` no se penaliza**. `is_local` tiene tres estados y los tres significan cosas distintas —`true` local, `false` internacional confirmado, `null` no se pudo resolver— y el ranking solo baja al `false`. Si lo desconocido contara como "no local", la cartelera hundiría los toques que debería destacar.

Para cerrar ese hueco hace falta una **lista curada de artistas locales**, mismo patrón que las coordenadas curadas. Es trabajo de conocimiento de escena, no técnico.

### Trampas encontradas al implementarlo (verificadas contra el servicio real)

- **El límite de peticiones tiene que vivir dentro del módulo que consulta la API, no en el llamador.** La primera versión espaciaba desde el CLI y dejaba escapar dos peticiones pegadas al arrancar; MusicBrainz devolvió **503 en la cuarta consulta** y tumbó la corrida entera. Con el control adentro (`musicbrainz.py`), las 52 consultas pasaron sin un solo 503.
- **MusicBrainz también corta con `ReadTimeout`, no solo con 503.** Apareció en la primera corrida real contra la base, ya con el 503 resuelto: un timeout suelto volvió a tumbar el proceso entero. Se atrapa `httpx.TransportError` (cubre timeouts y cortes de conexión) con el mismo reintento. Moraleja: al integrar una API externa no alcanza con manejar el código de error que devuelve, hay que manejar también que no devuelva nada.
- **`503` y los timeouts no son "no encontrado".** Hay que distinguir "no pude preguntar" de "pregunté y no está": si se guarda "origen desconocido" cuando el servicio estaba caído, el evento queda dado por resuelto para siempre, porque el CLI solo mira lo que está sin clasificar. Por eso existe `MusicBrainzNoDisponible` y esos eventos se dejan sin escribir. Esto ya se pagó solo: cuando el timeout cortó la corrida a mitad, volver a lanzar el CLI retomó exactamente donde había quedado.
- **Un match de puntaje alto no alcanza.** MusicBrainz siempre contesta algo. Sin un segundo filtro de parecido del nombre, `Laura & Brenda` resolvía a la artista `Laura` y heredaba su país. Se exige `score >= 90` **y** parecido `>= 0.88` sobre el nombre normalizado.
- **Royal Center separa con un espacio duro:** el título real es `AKRIILA -\xa0 TOUR LUCY`, con `\xa0` (no-break space). Se ve idéntico en pantalla y rompe cualquier `split(" - ")` ingenuo. Hay test de regresión.
- Limpiar el título antes de consultar es obligatorio: las salas titulan el evento, no al artista (`ROBBIE WILLIAMS | BRITPOP`, `PABLOPABLO EN BOGOTÁ`, `Gustavo Santaolalla llega a Bogotá con el Ronroco Tour`).

### Limitación conocida

La clasificación es por fila, y la deduplicación entre fuentes ocurre después, en el frontend. Si un mismo evento no-musical lo publicaran dos fuentes, harían falta dos entradas curadas. Hoy no pasa, pero desaparece solo cuando la deduplicación se mueva a la ingesta (ver deuda técnica registrada en `CLAUDE.md`).

---

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

## 8. Normalización de títulos de evento (Fase 6) — revisada el 2026-08-31

Los títulos crudos se muestran formateados: **"Artista | Gira"**, con **" & " entre varios artistas de cartel** (la barra es solo para lo que viene *después* del artista). `events.title` sigue guardando lo que publicó la fuente — esto es capa de lectura, en `apps/web/src/lib/tituloEvento.ts`, con la misma deuda consciente que `dedupe.ts`: cuando exista la API pública conviene moverlo a la ingesta.

La primera versión (2026-08-29) se escribió contra unos pocos ejemplos. Juan encontró varios títulos mal normalizados y la revisión del 2026-08-31 se hizo **título por título contra los 53 que hay en la base**, no contra casos inventados. Vale como método: un formateador de texto se prueba contra el corpus real o no se prueba.

### El defecto de fondo de la primera versión

`tituloCaso` **bajaba mayúsculas que la fuente había puesto a mano**: "Lucho Al Attaque" quedaba "Lucho al Attaque" y "Juantxo Skalari/ The Skatalites" quedaba "the Skatalites". La regla ahora es asimétrica: **solo sube mayúsculas, nunca las baja**, salvo que el título entero venga gritado en mayúscula sostenida —ahí sí se rearma completo—. Una sala que escribe en mayúsculas no está diciendo nada sobre el nombre del artista; una que escribió "Al" con mayúscula sí. Al revés, "Todos tus muertos" y "El plan de la mariposa" hay que subirlos.

Tres excepciones, todas con test: una palabra que mezcla letras y dígitos se deja quieta (`MADE4RAP`, `A-1`), una sigla aislada dentro de un título en caja mixta también (`WWE Bogota 2026` daba "Wwe"), y dos o más mayúsculas seguidas dentro de un título en caja mixta se tratan como grito (`Shing02, SPIN MASTER A-1` → `Spin Master A-1`).

### Las reglas automáticas, y por qué son estrechas

- **El ruido de sala y de ciudad no es parte del nombre de nadie.** "AKRIILA EN BOGOTÁ" → "Akriila"; "Blonde Redhead llega al Teatro Jorge Eliécer Gaitán" → "Blonde Redhead". Se borra **únicamente** cuando lo que sigue a la preposición nombra la ciudad o la sala real del evento — por eso `tituloParaMostrar` recibe el nombre de la sala. Sin ese requisito, "en vivo" o "en concierto" se llevarían medio título por delante.
- **Lo que viene detrás del lugar es la gira, no basura**: "Gustavo Santaolalla llega a Bogotá con el Ronroco Tour" → "Gustavo Santaolalla | Ronroco Tour"; "Todo copas en Latino Power Bogota 20 Años" → "Todo Copas | 20 Años".
- **El año suelto al final es cómo el Movistar Arena desambigua sus fichas** ("Alvaro Diaz 2026", "WWE Bogota 2026"), no parte del nombre. No se toca si el título ya trae separador, porque ahí el año está dentro de la gira.
- **Partir un cartel de varios artistas es conservador a propósito.** La barra solo parte si todos los pedazos quedan con 4 o más caracteres —eso salva a "AC/DC"— y la "y" solo parte cuando una coma o una barra ya marcaron que es una lista: sin ese requisito, "10 AÑOS Y NO AZARAN" se convertiría en dos artistas inexistentes.
- **Un nombre repetido dos veces se colapsa solo si se ve la costura** (minúscula pegada a mayúscula): "BloodbathBloodbath" → "Bloodbath", pero "PABLOPABLO" —que es literalmente "PABLO"+"PABLO"— no se toca. Es el mismo criterio de siempre: la regla se estrecha hasta que no pueda destrozar un caso legítimo.

### Lo que ninguna regla honesta puede resolver

**No hay señal en el texto para distinguir "artista - gira" de "artista - artista".** "ROBBIE WILLIAMS | BRITPOP" y "Lenny Tavarez – J quiles" se ven exactamente igual, y el segundo son dos artistas. Se probó lo obvio —buscar palabras de gira ("tour", "aniversario") en el lado derecho— y falla en los dos sentidos: "BRITPOP", "EL REY DEL CHUPE" y "LA HISTORIA MÍA" son giras sin ninguna de esas palabras. Así que el caso frecuente (gira) es la regla y el otro se cura a mano.

Lo mismo para todo lo que exige saber algo que el título no dice: la gira que la sala no publica (Movistar titula "Alvaro Diaz 2026"; la gira se llama **Omakase Tour** y aparece solo en el enlace de compra de esa misma página), el título al revés con la gira adelante ("10 AÑOS Y NO AZARAN - LA MUCHACHA" es La Muchacha), y el formato del show pegado al nombre ("RAYOS LASER ACÚSTICO" es Rayos Láser tocando acústico).

Todo eso vive en `apps/web/src/lib/titulosCurados.ts`, con evidencia y test que la exige, igual que `artistas_locales.py`. Dos niveles, y el general va primero: **`GRAFIAS`** va por nombre de artista, así el show siguiente del mismo artista entra solo; **`TITULOS`** va por título crudo exacto y son solo cinco entradas, porque deja de engancharse si la sala cambia una coma — mismo riesgo que `eventos_excluidos.py`.

### Limitación conocida: la dedupe se queda con el registro más completo, no con el mejor titulado

Akriila llega por Royal Center como "AKRIILA - TOUR LUCY" y por Rockal Live como "AKRIILA EN BOGOTÁ". `unificarDuplicados` se queda con la segunda porque trae precio, hora y género, así que la cartelera muestra "Akriila" **sin la gira**, aunque la otra fuente sí la publicaba.

No es un defecto de la normalización y no está resuelto. Arreglarlo significa que la fila unificada tome el título de una fuente y el resto de los campos de otra, y ahí el título mostrado deja de corresponder al `source_url` de la fila que se muestra. **Es una decisión de producto pendiente de Juan**: ¿vale mostrar un título que no está en la página a la que lleva el enlace?

---

## 9. Fase 5 (nueva) — moderación: el scraping propone, el admin publica

Diseñada con Juan el 2026-08-31, al reemplazar el radar por el directorio. **La base está construida y corriendo desde ese mismo día**; falta el formulario de admin, la cobertura y el directorio.

**Ningún evento se publica solo.** El cron sigue corriendo igual, pero lo que trae entra como **borrador** a una cola de revisión; el admin verifica, completa y publica.

### Por qué, y por qué encaja

El problema que lo motivó no es de calidad sino de **sesgo de cobertura**: las seis fuentes actuales tiran a salas grandes, donde tocan los internacionales. El toque local en un bar chico, anunciado solo por historia de Instagram, es estructuralmente invisible para el pipeline — y el propósito de la plataforma es promover justamente ese toque.

⚠️ **Corrección de un dato que se llegó a proponer como titular editorial:** "de 44 conciertos anunciados en Bogotá, 7 son de artistas locales". Ese 16% **no mide la escena de Bogotá: mide qué salas scrapeamos.** Es honesto como "de lo que publican estas seis fuentes" y sería falso como afirmación sobre la ciudad. La moderación y la carga manual existen para que la plataforma deje de tener ese sesgo sin saberlo.

No es una arquitectura nueva: es **"guardar crudo, filtrar y clasificar en lectura"** una vuelta más, la misma forma que ya tiene el paso de clasificación.

### Las dos capas

- **`events` (crudo)** — una fila por fuente, como hoy. El admin nunca la toca; el cron la reescribe libremente en cada corrida.
- **Evento canónico (publicado)** — una fila por show real, con los valores aprobados, enlazada a **una o varias** filas crudas.

Al revisar un borrador el admin hace una de dos cosas: **publicar como nuevo** o **adjuntar a un canónico existente** ("es el mismo show que ya publiqué"). Un evento cargado a mano es un canónico sin fuente cruda; si mañana un scraper lo encuentra, se adjunta.

Esto resuelve tres cosas de una:

1. **Identidad única del evento.** Hoy el upsert garantiza unicidad solo *dentro* de una fuente (`source` + `source_event_id`), por eso el mismo show llega dos veces desde Royal Center y Rockal Live. El canónico es la identidad que faltaba, y cubre también el duplicado entre el cron y el admin.
2. **Salda la deuda de la dedupe.** Estaba anotado que `dedupe.ts` tenía que moverse del frontend a la ingesta cuando existiera la API pública. Acá se mueve, y mejor: deja de ser lógica de producto y pasa a ser **un sugeridor en la pantalla de revisión** ("esto se parece a X, ¿es el mismo?"), donde decide un humano y no una heurística.
3. **Mata el problema del título del duplicado** (§ 8, "Akriila pierde Tour Lucy"): el canónico puede tomar el título de una fuente y el precio de otra, porque las tiene todas colgando. La pregunta de producto que quedaba abierta ahí se responde sola.

### El scraper no puede pisar lo que decidió el admin

Verificado en el código el 2026-08-31, y **no es una promesa de diseño sino comportamiento ya en producción**: el upsert de `save_events` sube un diccionario con solo sus propias columnas, así que nunca toca `event_type`, `is_local` ni `classification_source`. Por eso la clasificación sobrevive a todas las corridas del cron desde el 27 de agosto. Las columnas del admin funcionan igual: el scraper no las menciona.

**La condición que hace que funcione:** las ediciones del admin van en **columnas propias, nunca encima de las scrapeadas**. El scraper sí reescribe `title`, `starts_at` y `price_text` en cada corrida; una corrección hecha en el mismo campo se pierde al día siguiente. Lo que se muestra = valor del admin si existe, si no el crudo.

### Toda sobrescritura del origen pasa por aprobación

Como el canónico guarda su propia copia de lo aprobado y el crudo se actualiza libre, comparar los dos detecta cuándo la fuente se movió después de la aprobación. Ese evento vuelve a la cola **etiquetado**, con el cambio a la vista (`precio: $102.000 → $118.000`), para que el admin apruebe o rechace. Aplica a cualquier campo: precio, sala, nombre, fecha.

Esto convierte la moderación de un filtro de entrada en **verificación continua**, que es lo que hoy no existe: un evento publicado se desactualiza en silencio.

Lo mismo con la desaparición: hoy `_prune_missing_events` borra sin avisar el evento futuro que salió de la cartelera. Un evento **publicado** que desaparece del origen debe avisarle al admin en vez de esfumarse — puede ser una cancelación real o que la sala rehizo su web.

### Qué pasa con los filtros de exclusión

- **`eventos_excluidos.py` (lista de eventos puntuales) se retira.** Existía porque borrar una fila no alcanzaba: el cron la devolvía. Con borradores, "no lo quiero" es simplemente no publicarlo — reversible y visible, sin la contrapartida de que sacar una entrada no recupera el pasado.
- **Las reglas (`classify.py`, `exclusion_patterns.py`) ascienden.** Dejan de filtrar la cartelera y pasan a **ordenar la cola**: lo que no es música cae en un cajón aparte en vez de mezclarse con los toques. Es más útil ahí que en la lectura.

**Y con eso una regla dura cambia de signo.** Estaba escrito que *"excluir es caro y silencioso: un evento que no aparece no deja rastro para nadie"*, y por eso las reglas se mantenían estrechas. Bajo moderación **eso deja de ser cierto**: un evento mal filtrado sigue siendo visible para el admin, en su cajón. Las reglas de exclusión pueden volverse **más agresivas, no menos** — lo contrario de lo que había que hacer hasta ahora.

### La cola es chica, medido

`scraped_at` no está en el upsert del scraper, así que marca cuándo entró un evento **por primera vez**. Al 2026-08-31:

    2026-08-27:  52   <- carga inicial
    2026-08-30:   1

**Un evento nuevo en cuatro días.** El riesgo razonable de este diseño —que el humano se vuelva el cuello de botella— no aplica con este volumen, así que no hace falta inventar excepciones de auto-publicación para fuentes "confiables": todo pasa por revisión. Si el volumen sube al sumar fuentes, se revisa.

### Alcance de la fase

| Parte | Qué |
|---|---|
| **Base** | Estado `borrador`/`publicado`, evento canónico con sus fuentes, columnas de edición del admin separadas de las del scraper, `evidencia` obligatoria a nivel de base para lo cargado a mano |
| **Superficie** | Formulario de admin sobre Supabase Auth: cola de revisión ordenada por fecha del evento, con todo prellenado, y "evento nuevo" como borrador vacío |
| **Cobertura** | Scrapers nuevos para las cuatro fuentes abiertas de § 3; pegado manual de texto o flyer para lo que no se puede traer |
| **Módulo** | Directorio de salas y artistas, alimentado por lo ya curado |

Dos consecuencias sobre el trabajo anterior, que conviene saber antes de construir:

- **La normalización de títulos (§ 8) cambia de trabajo**: deja de tener que *acertar* y pasa a *proponer un buen borrador* para que el admin edite menos. Las cinco entradas de `TITULOS` en `titulosCurados.ts` quedan sobrando —un humano corrigiendo el borrador es estrictamente mejor que curar por título exacto—; `GRAFIAS` sí sobrevive, porque se aplica sola a los shows futuros del mismo artista.
- **El formulario de admin sube de "cuando la fricción moleste" a prerequisito.** Lo necesitan la cola de revisión, la carga manual y el directorio. Y un evento tiene fecha: editar un `.py` y correr un CLI no sirve. Es una desviación consciente de la convención de "lo curado vive en git con evidencia y tests" — se compensa haciendo `evidencia` obligatoria en la base, que es la base exigiendo lo que allá exigía un test.

### Instagram como salida, no como fuente

Se evaluó y se descartó **scrapear una cuenta propia** (subir la info a Instagram o X y volver a bajarla). Es técnicamente posible —leer los posts de tu propia cuenta de Instagram no requiere app review, alcanza con modo desarrollo y rol de tester; X no tiene tier gratuito para cuentas nuevas desde febrero de 2026 y cobra por lectura— pero es un viaje de ida y vuelta a través de una base de datos peor: obligaría a escribir un parser de nuestros propios datos sobre un caption, que es peor fuente que la página de una sala.

**La dirección correcta es la inversa: la plataforma es la fuente, las redes son la salida.** El admin cura en la plataforma y la plataforma publica sola ("esta semana en Bogotá: 5 toques locales"). Mismo esfuerzo, los datos quedan estructurados, publicar es la dirección que las plataformas sí soportan, y la cuenta se vuelve distribución — que es un pendiente abierto del doc de producto (§ 7) y parte del pivote editorial de Juan. Queda anotado para después del MVP.

### Estado de la base (2026-08-31)

Hecho y verificado:

- Migración `supabase/migrations/20260831000000_moderacion.sql`, aplicada por Juan en el SQL editor.
- `deduplicacion.py` y `moderacion.py` (lógica pura, sin credenciales) + `moderacion_cli.py`, con 16 tests.
- Backfill corrido: **51 canónicos de 53 filas crudas**, todos `publicado`, 0 huérfanos, 0 crudos sin canónico. Se unieron los dos duplicados esperados —Akriila y MADE4RAP, que llegan por dos fuentes cada uno—, el mismo resultado que daba la dedupe del frontend.
- **Idempotencia comprobada contra datos reales**: una corrida normal inmediatamente después reporta `0 borradores nuevos, 0 con cambios en el origen, 0 publicados sin fuente`. Es la prueba de que el snapshot no inventa cambios.
- Paso `Moderation queue` en el cron, después de `Classify events`.
- La cartelera, el mapa y el detalle leen `canonical_events`. Verificado en navegador: 39 conciertos, 2 fiestas y 41 eventos en el mapa — **los mismos números que antes de la mudanza**, que es la señal de que no se perdió ni se duplicó nada.
- `apps/web/src/lib/dedupe.ts` borrado con sus 15 tests: la lógica vive ahora en Python, con los suyos.

⚠️ **Los 51 del backfill tienen `reviewed_at` en null, a propósito.** Nadie los revisó: se publicaron para que la cartelera no se vaciara al cambiar de modelo. Esto ya se cobró un error al escribir la página de detalle: el aviso de procedencia decía "y revisados a mano" para todos, lo cual era falso para los 51. Ahora esa frase solo aparece cuando `reviewed_at` existe. Vale como recordatorio de que la regla de no inventar datos también aplica a lo que el sitio dice **sobre sí mismo**, no solo a los datos de los eventos.

El aviso de procedencia además distingue tres casos, porque no puede afirmar lo mismo en los tres: una fuente ("la cartelera oficial de la sala"), varias (los dominios reales, no los slugs internos como `rockal_live`), y ninguna (evento cargado a mano, con su evidencia).

### Limpieza del 2026-08-31 (posterior al backfill)

- **Radar borrado del repo.** `radar.py`, `radar_cli.py`, `lastfm.py`, `deezer.py`, `/tendencias`, `trending.ts`, `TendenciaCard.tsx`, sus 9 tests, el link del nav, el paso del cron, `save_trending_snapshot` en `storage.py` y `lastfm_api_key` en `config.py`. Verificado que no queda ninguna referencia viva y que `/tendencias` da 404. La sección 7 de este documento queda como registro de lo que existió.
  - **La tabla `trending_artists` sigue en pie**, con 215 filas de `lastfm_geo`. La migración para soltarla está escrita y **sin aplicar** (`20260831010000_baja_radar.sql`): borra datos irrecuperables —cada fila era la foto de un momento— y no le hace daño a nadie quedarse. Es decisión de Juan.
- **Los tres `not_music` pasaron a `descartado`.** Estaban en `publicado` y a la vez filtrados por el criterio editorial, que es una contradicción: `status` contesta "¿va al sitio?" y `event_type` contesta "¿qué es?". Un `not_music` publicado dice "aprobado" sobre algo que nunca se muestra. Las filas crudas no se tocan: borrarlas las traería de vuelta en la corrida siguiente.
- **Defecto encontrado y corregido en el propio modelo de moderación**, un día después de escribirlo: la clasificación editorial se hereda del crudo **al crear el borrador**, así que un evento que MusicBrainz resolvía tarde —503, o el problema de CI de arriba— se quedaba con `event_type` en null en el canónico **para siempre**. El canónico ya existía cuando llegó la respuesta. Lo arregla un paso nuevo del CLI (`clasificacion_pendiente`) que **solo rellena huecos y nunca sobrescribe**: si el admin corrigió el tipo a mano, su decisión gana sobre lo que diga MusicBrainz mañana. Se detectó revisando la base, no con los tests — los tests probaban lo que el código hacía, no lo que faltaba que hiciera.
