# APIs de música — estado verificado (archivo)

> Material archivado el 2026-09-01. Ninguna de estas fuentes está en uso hoy salvo MusicBrainz (sus reglas vivas están en `context/ingesta/CLAUDE.md`). Se conserva para no volver a evaluar lo ya descartado.

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

