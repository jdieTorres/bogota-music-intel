# Bogotá Music Intel — contexto del proyecto

Plataforma de inteligencia musical enfocada en la escena de Bogotá/Colombia. Proyecto personal de Juan como vehículo de pivote de carrera: de desarrollo de software hacia periodismo, distribución y creación de contenido en la industria musical. Sirve como portafolio técnico + carta de presentación editorial + base de un producto sostenible a mediano plazo.

Slug de trabajo (placeholder, nombre final sin definir): **`bogota-music-intel`**.

**Principio editorial (definido por Juan, 2026-08-27):** la plataforma prioriza y promueve **los toques de artistas locales**. No es una cartelera genérica de eventos de la ciudad: si algo entra al producto, tiene que servir a ese propósito. Esto es criterio de diseño, no solo de filtrado — aplica al scraping, al ranking de la cartelera y a cómo se presenta cada evento.

Documentación completa en `docs/`:
- `docs/proyecto-plataforma-musical-bogota.md` — diseño de producto: los 9 módulos, capas del mapa interactivo, ideas evaluadas y descartadas, priorización del MVP.
- `docs/investigacion-tecnica-plataforma-musical.md` — investigación técnica: stack, estado real de APIs de música probadas una por una, legalidad de scraping de eventos/venues, auditoría de venues candidatos, plan de ejecución del MVP.

**Antes de tomar decisiones de arquitectura o de fuentes de datos, lee esos dos archivos.** Contienen hallazgos ya verificados (ej. qué APIs de música sirven de verdad, cuáles están muertas o bloqueadas para proyectos hobby/educativos, qué venues tienen scraping viable y cuáles no) — no los repitas desde cero ni asumas que Spotify API sigue teniendo audio-features (fue deprecado).

## Stack técnico decidido
- Frontend: Next.js (TypeScript) en Vercel (plan Hobby — ojo, es no comercial).
- Backend: Python + FastAPI.
- Base de datos: Supabase (Postgres + Auth + Storage).
- Scraping/ingesta: GitHub Actions (cron), respetando robots.txt.
- Mapas: MapLibre GL + tiles OpenStreetMap/Protomaps.

## Alcance del MVP (3 módulos priorizados)
1. Mapa de escena en vivo
2. Calendario agregador de eventos
3. Radar de tendencias

Directorio/wiki y API pública quedan para fase 2/futura. Ritmo de dedicación: medio tiempo.

## Convenciones de nombres
- Repo: `bogota-music-intel`
- Paquete backend (FastAPI): `bogota_music_intel`
- Frontend: `apps/web` dentro del monorepo (o `bogota-music-intel-web` si se separa)
- Prefijo de variables de entorno: `BOGOTA_MUSIC_INTEL_` o `bmi_`

## Pendientes activos (no resueltos aún)
- Probar Napster API con queries reales de artistas colombianos (Bomba Estéreo, Karol G, Andrés Cepeda) antes de meterlo al módulo Scout de emergentes — su cobertura LatAm no está documentada, hay que probarla a mano.
- Nombre e identidad de marca definitiva del proyecto (el placeholder de arriba es solo de trabajo). Ligado al trabajo de look & feel de abajo.

### Acordados con Juan para después de Fase 4
1. **Filtrar lo que no son toques de artistas locales.** Hoy se cuela de todo: "THE JUANPIS LIVE SHOW" (comedia), "WWE Bogota 2026" (lucha libre), obras de teatro ("HOMBRES A LA PLANCHA", "'CONTINENTAL'"). Detalle técnico y opciones evaluadas en `docs/investigacion-tecnica-plataforma-musical.md`, sección "Filtrado editorial".
2. **Look & feel / personalidad de la web.** Juan quiere trabajarlo en conjunto y con calma; se estima varias sesiones, no un retoque puntual. Alcance y punto de partida en `docs/proyecto-plataforma-musical-bogota.md`, sección 8.

## Estado de implementación
- **Fase 1 (infraestructura) — hecha.** Monorepo con `apps/web` (Next.js) y `services/api` (FastAPI), Supabase conectado, GitHub Actions con cron diario.
- **Fase 2 (scrapers) — hecha.** Seis fuentes activas en `services/api/bogota_music_intel/scrapers/`. `registry.py` es la fuente de verdad de qué venues son automatizables y cuáles requieren carga manual (con el motivo verificado de cada uno). Correr con `python -m bogota_music_intel.scrape_cli [--dry-run] [--source X]`.
- **Fase 3 (calendario) — hecha.** Listado por día y detalle en `apps/web` (Next.js 16, App Router). El frontend lee Supabase directo con la publishable key (RLS deja SELECT público); FastAPI queda como capa de ingesta y base de la API pública futura, no en el camino de lectura del calendario.
- **Fase 4 (mapa) — hecha.** `/mapa` con MapLibre GL 6 + tiles de OpenFreeMap (sin API key). La geocodificación es un paso aparte del scraping: `python -m bogota_music_intel.geocode_cli`. 5 de 9 salas ubicadas; las que Nominatim no encuentra se listan sin ubicar antes que inventarles un pin.
- **Siguiente:** los dos pendientes acordados de abajo, y Fase 5 (radar de tendencias).

⚠️ `apps/web` corre **Next.js 16**, que cambió convenciones respecto a versiones anteriores: `params`/`searchParams` son Promises, existen los helpers globales `PageProps<'/ruta'>` y `LayoutProps<'/ruta'>`, y Turbopack es el default. Antes de escribir código de frontend, leé la guía correspondiente en `apps/web/node_modules/next/dist/docs/` (así lo pide `apps/web/AGENTS.md`).

⚠️ Turbopack deja a **MapLibre GL 6 sin su worker** y el mapa queda en negro **sin un solo error en consola** (dev y build por igual). Ya está resuelto con `apps/web/scripts/copiar-worker-maplibre.mjs` + `setWorkerUrl()`; el detalle está en `docs/investigacion-tecnica-plataforma-musical.md`, sección "Trampas del frontend". Si el mapa vuelve a quedar en negro, lo primero a mirar es si el navegador pide teselas — no si hay errores.

Antes de tocar un parser, leé la sección "Trampas de datos" de `docs/investigacion-tecnica-plataforma-musical.md`: varias suposiciones razonables (la zona horaria que declara el sitio, la URL como identidad del evento) resultaron falsas contra los sitios reales y ya tienen tests de regresión en `services/api/tests/`.

## Reglas duras (no negociables, ya decididas en investigación previa)
- No evadir el bloqueo anti-bots-IA de Tuboleta (robots.txt bloquea explícitamente a ClaudeBot/GPTBot). No construir scraper para ese sitio.
- Ningún venue auditado publica schema.org/Event — todos los parsers de scraping son a medida por sitio, no hay atajo genérico.
- Instagram/Facebook: robots.txt de Instagram bloquea rastreo de perfiles incluso sin login — tratar como fuente manual, no pipeline automatizado.
