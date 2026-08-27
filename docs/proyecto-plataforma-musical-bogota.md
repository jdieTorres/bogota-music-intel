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
| **Radar de tendencias** | Detecta patrones sonoros (BPM, tonalidad, energía) en lo que suena en Bogotá/Colombia semana a semana | Spotify API + librosa | Periodistas, curadores |
| **Scout de emergentes** | Identifica artistas colombianos con crecimiento anómalo antes de volverse masivos | SoundCloud, Bandcamp, Spotify for Artists (scraping ético) | Sellos, bookers, medios |
| **Panel de salud de catálogo** | Dashboard para que artistas independientes vean sus métricas unificadas | Spotify for Artists + redes sociales | Artistas locales |
| **Motor de similitud sonora** | Recomendaciones y playlists por mood/sonido, con foco en catálogo local | Essentia (embeddings de audio) | Oyentes, curadores |
| **Detector de música generada por IA** | Clasifica si un track fue hecho con IA — relevante por el debate actual sobre autenticidad artística | Modelos de clasificación de audio (features espectrales + ML) | Sellos, plataformas, periodistas |
| **Mapa de escena en vivo** | Datos de venues, festivales, precios de boletas y giras en la ciudad, con capas interactivas | Scraping de venues + eventos + fuentes abiertas | Público general, prensa |
| **Calendario agregador de eventos** | Todos los conciertos/festivales de la semana en un solo lugar | Scraping de venues, redes, Songkick/Bandsintown si aplica | Público general |
| **Directorio / wiki de la escena local** | Perfil de artistas, sellos, salas, colectivos, con datos abiertos y editable tipo wiki | Curación manual + colaborativa | Toda la comunidad musical |
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

## 5. Priorización — MVP sugerido

Módulos recomendados para el lanzamiento inicial (los más rápidos de mostrar y con mayor gancho visual/editorial):

1. **Mapa de escena en vivo** (con al menos 1-2 capas del punto 3)
2. **Calendario agregador de eventos**
3. **Radar de tendencias**

El **directorio/wiki** y la **API pública** quedan como fase 2 y fase futura respectivamente, dado que requieren más curación de contenido (directorio) o una base de usuarios ya consolidada (API).

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
