# Fuentes, legalidad y auditoría de venues

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


---

### Idartes deja de entrar acotada

Juan revirtió el 2026-09-01 su propia decisión del 2026-08-28 de no sumar fuentes distritales y de acotar Idartes a `/agenda/concierto/`. El motivo de entonces —ensuciaban la cartelera— dejó de existir con la cola.

Lo que importa registrar no es el filtro que se fue sino **qué pasó con la señal que lo hacía**. La ruta de la ficha es la única señal confiable de esa fuente (sección 3, "la categoría que publica una fuente no siempre coincide con su propia ficha"), así que en vez de tirarla **dejó de filtrar y pasó a clasificar**: se mapea a `category`, que es lo que después mira el clasificador.

La regla y por qué es así, verificado contra la agenda real ese día:

| Ruta | Etiqueta del listado | Queda como |
|---|---|---|
| `concierto` | Música | Música |
| `presentacion-de-danza` | **Música** ← miente | **Danza** — gana la ruta |
| `presentacion-de-danza` | Teatro | Danza |
| `obra-de-teatro` | Teatro | Teatro |
| `presentacion` | Música | Música — la ruta es ambigua, gana la etiqueta |
| `presentacion` | Multidisciplinar | Multidisciplinar |

`presentacion` a secas no está en el mapa porque es ambigua de verdad: ahí conviven "Gaitán al Aire Vol. 57: Ancestral Beats" (música) y "Einstein on the Beach" (ópera), y para las dos la etiqueta acierta.

**Efecto lateral bueno:** recuperó a Ancestral Beats, que era la única entrada de `artistas_locales.py` sin evento en base — su show vive bajo `/agenda/presentacion/` y el filtro lo dejaba fuera.

**El costo de equivocarse cambió de lado**, y eso es lo que hace razonable el cambio: antes un concierto mal enrutado desaparecía sin dejar rastro; ahora lo peor que pasa es un borrador de más.


### El riesgo que apareció en el camino: un lote incompleto borra

Un `ReadTimeout` de visitbogota dejó **51 eventos de 66**. Eso no es perder 15 eventos: es **borrarlos**. `_prune_missing_events` elimina los eventos futuros de una fuente que no vinieron en el lote, así que un scrape parcial poda en silencio lo que sí existía.

La primera reacción fue envolver cada ficha en un `try/except` para "no perder la fuente entera por una ficha". **Es exactamente al revés**, y por eso quedó anotado: con poda de por medio, saltarse una ficha equivale a borrarla. Un lote incompleto no permite concluir nada sobre lo que falta.

El scraper es estricto a propósito: si una ficha falla, falla la fuente, no se guarda nada y no se poda nada. Cuesta un día de atraso con reintento automático del cron, contra borrar eventos reales sin que nadie se entere.

Vale para cualquier fuente futura que pagine o que pida una ficha por evento.


### `images.remotePatterns`: una lista blanca necesita quien avise (2026-09-01)

`next/image` rechaza cualquier host que no esté en `images.remotePatterns` de `apps/web/next.config.ts`. No degrada: **lanza y rompe la tarjeta**. Al sumar visitbogota nadie agregó su host, y la ingesta estuvo un día guardando 51 imágenes de un host no permitido; se supo cuando se publicó el primer evento y Juan abrió la página.

La lista sigue siendo explícita y no un comodín, a propósito: el optimizador de Next descarga y sirve cualquier URL que se le permita, así que abrirla lo convertiría en un proxy de imágenes para cualquiera.

Lo que se agregó no es la línea que faltaba sino el aviso: `moderacion_cli` compara los hosts que llegan contra `remotePatterns`, **leyéndola del propio `next.config.ts`** —mantener dos copias las desincronizaría— y lo dice en el log del cron. De paso salieron los dos hosts del radar (Deezer y Last.fm), que ya no existen.

Generaliza: cuando se elige una lista blanca sobre un comodín, el costo real no es escribirla, es **enterarse tarde de que le falta una entrada**. Eso se paga una sola vez con un chequeo automático.

