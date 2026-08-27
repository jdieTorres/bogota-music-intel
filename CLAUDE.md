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
- Mapas: MapLibre GL 6 + tiles de **OpenFreeMap** (sin API key ni límite de uso; se evaluó Protomaps pero no hizo falta). La atribución a OpenStreetMap se agrega a mano: el estilo no la trae.
- Geocodificación: Nominatim (1 petición/segundo, User-Agent identificable), con coordenadas curadas a mano para lo que no está en OpenStreetMap.

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

### Acordados con Juan para después de Fase 4 (siguen siendo el siguiente bloque de trabajo)
1. **Filtrar lo que no son toques de artistas locales.** Hoy se cuela de todo: "THE JUANPIS LIVE SHOW" (comedia), "WWE Bogota 2026" (lucha libre), obras de teatro ("HOMBRES A LA PLANCHA", "'CONTINENTAL'"). Detalle técnico y opciones evaluadas en `docs/investigacion-tecnica-plataforma-musical.md`, sección "Filtrado editorial".
2. **Look & feel / personalidad de la web.** Juan quiere trabajarlo en conjunto y con calma; se estima varias sesiones, no un retoque puntual. Alcance y punto de partida en `docs/proyecto-plataforma-musical-bogota.md`, sección 8.

## Estado de implementación
- **Fase 1 (infraestructura) — hecha.** Monorepo con `apps/web` (Next.js) y `services/api` (FastAPI), Supabase conectado, GitHub Actions con cron diario.
- **Fase 2 (scrapers) — hecha.** Seis fuentes activas en `services/api/bogota_music_intel/scrapers/`. `registry.py` es la fuente de verdad de qué venues son automatizables y cuáles requieren carga manual (con el motivo verificado de cada uno). Correr con `python -m bogota_music_intel.scrape_cli [--dry-run] [--source X]`.
- **Fase 3 (calendario) — hecha.** Listado por día y detalle en `apps/web` (Next.js 16, App Router). El frontend lee Supabase directo con la publishable key (RLS deja SELECT público); FastAPI queda como capa de ingesta y base de la API pública futura, no en el camino de lectura del calendario.
- **Fase 4 (mapa) — hecha** (verificada en navegador real, dev y producción). `/mapa` con MapLibre GL 6 + tiles de OpenFreeMap (sin API key). La geocodificación es un paso aparte del scraping: `python -m bogota_music_intel.geocode_cli`. 5 de 9 salas ubicadas; las que Nominatim no encuentra se listan sin ubicar antes que inventarles un pin.

Datos en base al 2026-08-27: **58 eventos, 9 salas** (52 eventos en la cartelera tras unificar duplicados entre fuentes).

### Lo que quedó a medias (pendientes operativos, ninguno bloquea el desarrollo)
- **Nunca se ha desplegado a Vercel.** Todo se ha verificado en local. Hacen falta las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el proyecto de Vercel. Vercel corre `npm run build`, así que el `prebuild` que copia el worker de MapLibre se dispara solo.
- **El cron diario de scraping nunca ha llegado a ejecutarse** (dispara a las 9:00 de Bogotá). Todos los datos en base vienen de corridas manuales. Se puede lanzar a mano desde la pestaña Actions para comprobar que funciona en CI y no solo en la máquina de Juan.
- **4 salas sin geocodificar**: Auditorio Mayor (2 eventos), Capital Live Concerts (1), **Lourdes Music Hall (7 — el hueco más grande)** y Teatro Libre Sala Centro (1). Ninguna existe como POI en OpenStreetMap. La vía para resolverlas es `services/api/bogota_music_intel/coordenadas_curadas.py`, que **exige un campo `evidencia`** por coordenada; no relajar la búsqueda de Nominatim para forzarlas (buscar "Lourdes, Chapinero" devuelve con toda confianza la iglesia, no la sala).
- **Rotar la secret key de Supabase.** Juan la pegó en el chat el 2026-08-27; el repo es público. Recomendado, sin confirmar que se haya hecho.
- Opcional: añadir el secret `BMI_SUPABASE_PUBLISHABLE_KEY` al repo para que el CI prerenderice contra la base real en vez de contra placeholders.

### Siguiente paso concreto
No hay nada a medio escribir en el código. Lo siguiente es **elegir con Juan entre los dos pendientes acordados de arriba**, que él enmarcó explícitamente como "para después de la Fase 4":
1. El **filtrado editorial** está bloqueado en una decisión de producto que solo Juan puede tomar: ¿los artistas internacionales se excluyen del todo, o se muestran en segundo plano mientras se destacan los locales? Sin esa respuesta no tiene sentido elegir el camino técnico.
2. El **look & feel** no está bloqueado, pero Juan pidió trabajarlo en conjunto y con calma.

Después de eso viene la Fase 5 (radar de tendencias: Deezer charts + Last.fm) y la Fase 6 (pulido y deploy).

⚠️ `apps/web` corre **Next.js 16**, que cambió convenciones respecto a versiones anteriores: `params`/`searchParams` son Promises, existen los helpers globales `PageProps<'/ruta'>` y `LayoutProps<'/ruta'>`, y Turbopack es el default. Antes de escribir código de frontend, leé la guía correspondiente en `apps/web/node_modules/next/dist/docs/` (así lo pide `apps/web/AGENTS.md`).

⚠️ Turbopack deja a **MapLibre GL 6 sin su worker** y el mapa queda en negro **sin un solo error en consola** (dev y build por igual). Ya está resuelto con `apps/web/scripts/copiar-worker-maplibre.mjs` + `setWorkerUrl()`; el detalle está en `docs/investigacion-tecnica-plataforma-musical.md`, sección "Trampas del frontend". Si el mapa vuelve a quedar en negro, lo primero a mirar es si el navegador pide teselas — no si hay errores.

Antes de tocar un parser, leé la sección "Trampas de datos" de `docs/investigacion-tecnica-plataforma-musical.md`: varias suposiciones razonables (la zona horaria que declara el sitio, la URL como identidad del evento) resultaron falsas contra los sitios reales y ya tienen tests de regresión en `services/api/tests/`.

## Decisiones transversales tomadas durante la implementación (2026-08-27)
Valen para todo el proyecto, no solo para el módulo donde salieron:

- **Nunca inventar un dato: un "no sabemos" honesto vale más que un valor verosímil pero falso.** Es el criterio que decidió tres cosas distintas: no poner un pin en el lugar equivocado (mejor listar la sala como "sin ubicar"), no relajar la búsqueda de Nominatim hasta que "acierte", y no mostrar "12:00 a. m." cuando la fuente solo publicó fecha. Ante la duda, se muestra el hueco.
- **Guardar crudo, filtrar y clasificar en lectura.** La ingesta no descarta eventos; el criterio editorial se aplica al leer. Así, cuando cambie el criterio, no hay que volver a scrapear el pasado. Esto condiciona cómo se implementará el filtrado editorial pendiente.
- **La deduplicación entre fuentes vive hoy en el frontend** (`apps/web/src/lib/dedupe.ts`), porque la cartelera es su único consumidor. Es deuda técnica consciente: cuando exista la API pública hay que moverla a la ingesta para que todos los clientes vean la misma cartelera ya canonizada.
- **Paleta oscura fija** en `apps/web/src/app/globals.css` (tokens `--background`, `--surface`, `--accent`…), elegida porque la cartelera se consulta de noche y el color lo deben poner los afiches. Es el punto de partida del trabajo de look & feel, no una decisión cerrada.
- **Verificar el frontend en un navegador de verdad, no solo en el HTML servido.** El mapa estuvo en negro con CI verde, tests pasando, tsc limpio, build correcto y HTML servido bien. Ninguna de esas señales lo detecta.

## Reglas duras (no negociables, ya decididas en investigación previa)
- **Ningún razonamiento sobre horas se hace sobre el texto ISO — hay que convertir a hora de Bogotá primero.** Colombia es UTC-5 todo el año: medianoche local es `T05:00:00Z` y un show de las 7 p. m. se guarda como `T00:00:00Z` del día siguiente. Buscar `"T00:00:00"` en la cadena responde sobre UTC y da lo contrario de lo que se busca. Este error ya se cometió dos veces (el desfase de 5 horas de Idartes y la detección de "sin hora publicada"); los dos tienen test de regresión, en `services/api/tests/` y en `apps/web/src/lib/fechas.test.ts`.
- No evadir el bloqueo anti-bots-IA de Tuboleta (robots.txt bloquea explícitamente a ClaudeBot/GPTBot). No construir scraper para ese sitio.
- Ningún venue auditado publica schema.org/Event — todos los parsers de scraping son a medida por sitio, no hay atajo genérico.
- Instagram/Facebook: robots.txt de Instagram bloquea rastreo de perfiles incluso sin login — tratar como fuente manual, no pipeline automatizado.
