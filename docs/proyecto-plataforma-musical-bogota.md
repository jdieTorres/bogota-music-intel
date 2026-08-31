# Plataforma de Inteligencia Musical — Bogotá / Colombia

## 1. Origen y propósito

Proyecto personal concebido como puente de carrera entre ingeniería de software y la industria musical (periodismo, distribución y creación de contenido). Funciona como:

- Portafolio técnico de entrada para roles en plataformas musicales.
- Carta de presentación editorial para conseguir una nota de prueba en medios de música.
- Base potencial para un producto/negocio sostenible a mediano plazo.

**Enfoque geográfico:** escena musical de Bogotá, escalable a Colombia y, a futuro lejano, a otras ciudades/países.

---

## 2. Módulos del producto

| Módulo | Función | Fuente de datos | Público objetivo |
|---|---|---|---|
| ~~**Radar de tendencias**~~ *(fuera del MVP, 2026-08-31)* | Detecta patrones sonoros (BPM, tonalidad, energía) en lo que suena en Bogotá/Colombia semana a semana | ~~Spotify API + librosa~~ — Spotify deprecó `audio-features`; se implementó con Last.fm y quedó fuera del MVP (ver § 5) | Periodistas, curadores |
| **Scout de emergentes** ⚠️ | Identifica artistas colombianos con crecimiento anómalo antes de volverse masivos | ~~SoundCloud, Bandcamp, Spotify for Artists~~ — las tres cerradas o sin API. Los reemplazos (Jamendo, Openwhyd) **no cubren la escena local**: medido el 2026-08-31, ver § 5 | Sellos, bookers, medios |
| **Panel de salud de catálogo** | Dashboard para que artistas independientes vean sus métricas unificadas | Spotify for Artists + redes sociales | Artistas locales |
| **Motor de similitud sonora** | Recomendaciones y playlists por mood/sonido, con foco en catálogo local | Essentia (embeddings de audio) | Oyentes, curadores |
| **Detector de música generada por IA** | Clasifica si un track fue hecho con IA — relevante por el debate actual sobre autenticidad artística | Modelos de clasificación de audio (features espectrales + ML) | Sellos, plataformas, periodistas |
| **Mapa de escena en vivo** | Datos de venues, festivales, precios de boletas y giras en la ciudad, con capas interactivas | Scraping de venues + eventos + fuentes abiertas | Público general, prensa |
| **Calendario agregador de eventos** | Todos los conciertos/festivales de la semana en un solo lugar | Scraping de venues, redes, Songkick/Bandsintown si aplica | Público general |
| **Directorio / wiki de la escena local** ⭐ *(en el MVP desde 2026-08-31)* | Perfil de artistas, sellos, salas, colectivos, con datos abiertos y editable tipo wiki | Curación manual + colaborativa, sobre la cartelera ya scrapeada | Toda la comunidad musical |
| **Pieza insignia narrativa** | Reportaje de datos sobre la escena bogotana; carta de presentación editorial | Combinación de todos los módulos anteriores | Medios, portafolio |
| **API pública de datos** *(fase futura/lejana)* | Expone los datos agregados para que otros devs/periodistas construyan sobre el proyecto | Todos los módulos | Desarrolladores, periodistas externos |

---

## 3. Capas del mapa interactivo

- Mapa de venues activos: bares, teatros, salas — frecuencia de eventos, capacidad, género predominante.
- Mapa sonoro por localidad: géneros dominantes en Chapinero, Teusaquillo, Suba, etc.
- Heatmap temporal: actividad musical de la ciudad por día de la semana o temporada.
- Rutas de gira: recorrido de artistas que tocan en varias ciudades de Colombia.
- "Migración de género": animación temporal de cómo se expande geográficamente un género (champeta, reguetón, indie) a través de los años.

---

## 4. Ideas adicionales evaluadas (no seleccionadas por ahora)

Quedan como backlog para fases futuras si el proyecto escala:

- Índice de "economía musical" de Bogotá (apertura/cierre de venues, tendencia de precios de boletas).
- Matching de colaboración entre artistas/productores usando el motor de similitud sonora.
- Alianza editorial con un medio local (Shock, El Espectador cultura, Radiónica) como canal de distribución.

---

## 5. Priorización — MVP

Los tres módulos del lanzamiento inicial:

1. **Mapa de escena en vivo** (con al menos 1-2 capas del punto 3)
2. **Calendario agregador de eventos**
3. **Directorio / wiki de la escena local**

La **API pública** sigue siendo fase futura: necesita una base de usuarios que todavía no existe.

### Cambio del 2026-08-31: el Directorio reemplaza al Radar de tendencias

Decisión de Juan. El **Radar de tendencias sale del MVP** y el **Directorio entra en su lugar** — el directorio estaba pospuesto justamente por "requerir más curación de contenido", y esa curación resultó ser el activo del proyecto, no su costo. El código del radar (`radar.py`, `lastfm.py`, `deezer.py`, `/tendencias`) queda en el repo sin borrar; solo deja de ser parte del alcance priorizado.

Por qué el radar deja de tener sentido acá:

- **Su dato era prestado.** El eje que quedaba vivo, Last.fm `geo.gettopartists?country=colombia`, lo puede consultar cualquiera. El directorio corre sobre datos propios: la cartelera scrapeada más el conocimiento de escena curado a mano.
- **Contradecía el principio editorial.** El propio hallazgo del radar es que *"lo más escuchado en Colombia está dominado por lo internacional"*. Una plataforma cuyo propósito es promover toques locales no gana destacando eso.
- **El otro eje nunca funcionó** (Deezer geolocaliza por IP — ver investigación técnica § 2.3), así que el módulo vivía con la mitad de lo diseñado.

Por qué el directorio y no los otros candidatos, evaluados el 2026-08-31:

- **Scout de emergentes — descartado con evidencia.** Su propósito es encontrar al artista colombiano *antes* de que sea masivo, y sus fuentes no lo tienen. Openwhyd, llamada ese día con los seis locales curados del proyecto, devolvió **0 coincidencias reales de 6**, mientras que Bomba Estéreo (20/20), Systema Solar (20/20) y Karol G (15/20) sí aparecen. Cubre justo a quien ya no necesita ser descubierto. Es la quinta confirmación del mismo patrón (ver investigación técnica § 2.2). *Jamendo no se probó*: hace falta un `client_id` que el proyecto no tiene.
- **Panel de salud de catálogo — descartado.** Depende de Spotify for Artists, que no tiene API pública: exige que cada artista entre con su propia cuenta. Además sirve a un artista por vez, no a la escena.
- **Motor de similitud sonora — descartado.** Essentia necesita audio y no hay fuente legal del audio de esta escena. Jamendo es Creative Commons global, no Bogotá.
- **Detector de música generada por IA — descartado.** No tiene relación con la escena de Bogotá: es un proyecto de ML que podría vivir en cualquier ciudad, y el pivote de carrera de Juan es hacia periodismo y contenido, no ML.
- **Pieza insignia narrativa — no compite: es la salida, no un módulo.** Es contenido, no una sección con pipeline propio, y se alimenta de los demás. Mejora mucho cuando el directorio exista.

**El contraargumento, aceptado:** el MVP se queda sin su único módulo analítico — mapa, calendario y directorio contestan *dónde, cuándo y quién*, ninguno contesta *qué está pasando*. Se compensa desde el directorio: la ficha de una sala con su historial de programación ("qué parte de su cartelera es local") es análisis sobre datos propios, y por eso más defendible que un chart que cualquiera puede consultar.

---

## 6. Nota de arquitectura

Diseño modular desde el día uno: cada módulo como pipeline independiente (ingesta → procesamiento → almacenamiento) que alimenta un dashboard/frontend central. Esto permite:

- Lanzar el MVP con 2-3 módulos sin bloquear el desarrollo del resto.
- Sumar módulos de forma incremental sin reescribir la base.
- Exponer una API pública a futuro sin refactor mayor, si el pipeline de datos ya está desacoplado del frontend.

---

## 7. Próximos pasos pendientes de definir

- [x] Nombre e identidad del proyecto — placeholder de trabajo: `bogota-music-intel` (nombre de marca final aún sin definir)
- [x] Stack técnico definitivo (frontend, backend, base de datos, hosting) — ver `investigacion-tecnica-plataforma-musical.md`
- [x] Plan de ejecución del MVP (por fases, ritmo medio tiempo) — ver `investigacion-tecnica-plataforma-musical.md` sección 5
- [x] Fuentes de datos concretas y validación de legalidad de scraping por fuente — ver `investigacion-tecnica-plataforma-musical.md` secciones 2-4
- [ ] Estrategia de distribución/pitch a medios para la pieza insignia
- [ ] Identidad visual y personalidad de la web — ver sección 8

---

## 8. Identidad visual y personalidad — pendiente para después de Fase 4

Definido con Juan el 2026-08-27. Quiere trabajarlo **en conjunto y sin apuro**: no es un retoque de colores, es darle carácter propio a la web. Se estima que toma varias sesiones.

### Punto de partida (lo que hay hoy)
La Fase 3 dejó una base deliberadamente sobria, pensada para no estorbar mientras se definía el resto: fondo oscuro casi neutro, un rojo (`#ff4d3d`) como único acento, tipografía Geist por defecto del scaffold, tarjetas de listado con el afiche a la izquierda. Funciona, pero es genérica — podría ser la cartelera de cualquier ciudad.

### Preguntas abiertas a resolver juntos
- **Qué debe transmitir.** ¿Fanzine de escena, publicación editorial seria, archivo/base de datos, cartel de concierto? Esto decide todo lo demás.
- **Nombre y marca.** Sigue siendo `bogota-music-intel` de placeholder. El nombre y el look se definen mejor a la vez que por separado.
- **Tipografía.** Es lo que más personalidad da y hoy es la del scaffold.
- **El rol del afiche.** Cada evento trae su arte, con estéticas muy dispares entre salas. Decidir si la interfaz se hace neutra para dejarlos brillar, o si impone una identidad fuerte por encima.
- **Cómo se ve la prioridad de lo local** (ver principio editorial en `CLAUDE.md`): si los toques de artistas locales se destacan, eso debe notarse en el diseño, no solo en el orden de la lista.

### Nota de alcance
Este trabajo depende de decisiones de gusto de Juan, no de criterios técnicos. Conviene abordarlo con propuestas visuales concretas para reaccionar sobre ellas, en vez de preguntar en abstracto.
