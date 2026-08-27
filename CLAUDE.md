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
- Confirmar si Teatro Cafam necesita fuente manual además de su sitio propio (cafam.com.co), dado que su ticketing corre sobre un subdominio de Tuboleta.
- Nombre e identidad de marca definitiva del proyecto (el placeholder de arriba es solo de trabajo).

## Reglas duras (no negociables, ya decididas en investigación previa)
- No evadir el bloqueo anti-bots-IA de Tuboleta (robots.txt bloquea explícitamente a ClaudeBot/GPTBot). No construir scraper para ese sitio.
- Ningún venue auditado publica schema.org/Event — todos los parsers de scraping son a medida por sitio, no hay atajo genérico.
- Instagram/Facebook: robots.txt de Instagram bloquea rastreo de perfiles incluso sin login — tratar como fuente manual, no pipeline automatizado.
