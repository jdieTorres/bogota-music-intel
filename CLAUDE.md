# Bogotá Music Intel — contexto del proyecto

Plataforma de inteligencia musical enfocada en la escena de Bogotá/Colombia. Proyecto personal de Juan como vehículo de pivote de carrera: de desarrollo de software hacia periodismo, distribución y creación de contenido en la industria musical. Sirve como portafolio técnico + carta de presentación editorial + base de un producto sostenible a mediano plazo.

Slug de trabajo (placeholder, nombre final sin definir): **`bogota-music-intel`**.

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
- Nombre e identidad de marca definitiva del proyecto (el placeholder de arriba es solo de trabajo).

## Estado de implementación
- **Fase 1 (infraestructura) — hecha.** Monorepo con `apps/web` (Next.js) y `services/api` (FastAPI), Supabase conectado, GitHub Actions con cron diario.
- **Fase 2 (scrapers) — hecha.** Seis fuentes activas en `services/api/bogota_music_intel/scrapers/`. `registry.py` es la fuente de verdad de qué venues son automatizables y cuáles requieren carga manual (con el motivo verificado de cada uno). Correr con `python -m bogota_music_intel.scrape_cli [--dry-run] [--source X]`.
- **Fase 3 (calendario) — hecha.** Listado por día y detalle en `apps/web` (Next.js 16, App Router). El frontend lee Supabase directo con la publishable key (RLS deja SELECT público); FastAPI queda como capa de ingesta y base de la API pública futura, no en el camino de lectura del calendario.
- **Siguiente: Fase 4** — mapa de escena en vivo (MapLibre + capa de venues).

⚠️ `apps/web` corre **Next.js 16**, que cambió convenciones respecto a versiones anteriores: `params`/`searchParams` son Promises, existen los helpers globales `PageProps<'/ruta'>` y `LayoutProps<'/ruta'>`, y Turbopack es el default. Antes de escribir código de frontend, leé la guía correspondiente en `apps/web/node_modules/next/dist/docs/` (así lo pide `apps/web/AGENTS.md`).

Antes de tocar un parser, leé la sección "Trampas de datos" de `docs/investigacion-tecnica-plataforma-musical.md`: varias suposiciones razonables (la zona horaria que declara el sitio, la URL como identidad del evento) resultaron falsas contra los sitios reales y ya tienen tests de regresión en `services/api/tests/`.

## Reglas duras (no negociables, ya decididas en investigación previa)
- No evadir el bloqueo anti-bots-IA de Tuboleta (robots.txt bloquea explícitamente a ClaudeBot/GPTBot). No construir scraper para ese sitio.
- Ningún venue auditado publica schema.org/Event — todos los parsers de scraping son a medida por sitio, no hay atajo genérico.
- Instagram/Facebook: robots.txt de Instagram bloquea rastreo de perfiles incluso sin login — tratar como fuente manual, no pipeline automatizado.
