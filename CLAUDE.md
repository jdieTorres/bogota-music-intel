# Bogotá Music Intel — contexto del proyecto

Plataforma de inteligencia musical enfocada en la escena de Bogotá/Colombia. Proyecto personal de Juan como vehículo de pivote de carrera: de desarrollo de software hacia periodismo, distribución y creación de contenido en la industria musical. Sirve como portafolio técnico + carta de presentación editorial + base de un producto sostenible a mediano plazo.

Slug de trabajo (placeholder, nombre final sin definir): **`bogota-music-intel`**.

**Principio editorial (definido por Juan, 2026-08-27):** la plataforma prioriza y promueve **los toques de artistas locales**. No es una cartelera genérica de eventos de la ciudad: si algo entra al producto, tiene que servir a ese propósito. Esto es criterio de diseño, no solo de filtrado — aplica al scraping, al ranking de la cartelera y a cómo se presenta cada evento.

En la práctica se traduce en tres categorías, no dos (`events.event_type`):
- **`music`** — concierto con un artista de cartel. Se ordena poniendo primero a los locales.
- **`fiesta`** — noche o ciclo que programa la sala, sin artista de cartel ("Noches Bomm", "THE JAZZ ROOM"). Es escena local por naturaleza. **Va en su propia pestaña** (`/fiestas`): ordenar una noche de club junto a un show del Movistar no compara nada.
- **`not_music`** — comedia, lucha libre, teatro. Fuera de la cartelera.

Documentación completa en `docs/`:
- `docs/proyecto-plataforma-musical-bogota.md` — diseño de producto: los 9 módulos, capas del mapa interactivo, ideas evaluadas y descartadas, priorización del MVP.
- `docs/investigacion-tecnica-plataforma-musical.md` — investigación técnica: stack, estado real de APIs de música probadas una por una, legalidad de scraping de eventos/venues, auditoría de venues candidatos, plan de ejecución del MVP.

Hay además una skill del proyecto en `.claude/skills/`: **`/actualizar-estado`** pone al día este archivo y `docs/` con el estado real —lo que quedó a medias, el siguiente paso y las decisiones aún sin registrar—. Correrla al cerrar una fase o una sesión de trabajo. Es la vía preferida para actualizar este archivo: trae el procedimiento de verificación (qué mirar en el repo en vez de fiarse de la memoria de la conversación) y las reglas de redacción.

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

### Acordados con Juan para después de Fase 4
1. ~~**Filtrar lo que no son toques de artistas locales.**~~ **Hecho y en la base el 2026-08-27.** Las dos decisiones de producto que lo bloqueaban las tomó Juan: lo que no es música se excluye siempre; los internacionales no se excluyen, van en segundo plano. Cómo quedó y qué se midió: `docs/investigacion-tecnica-plataforma-musical.md`, sección 6.
2. **Look & feel / personalidad de la web.** Juan quiere trabajarlo en conjunto y con calma; se estima varias sesiones, no un retoque puntual. Alcance y punto de partida en `docs/proyecto-plataforma-musical-bogota.md`, sección 8. **Es el único de los dos que sigue abierto.**

### Las tres listas curadas (crecen con el conocimiento de escena de Juan)
MusicBrainz resuelve bien al internacional consagrado y mal al local emergente, que es lo contrario de lo que esta plataforma necesita. El mecanismo para cerrar ese hueco ya está; lo que falta es contenido, y decidir quién entra le toca a Juan.

- `services/api/bogota_music_intel/artistas_locales.py` — origen de artistas que MusicBrainz no cubre. Confirmados sin país: **El Kalvo, PABLOPABLO, Juantxo Skalari, Ancestral Beats, Slaughter to Prevail**. Ya cargado: Todo Copas (verificado en la fuente).
- `services/api/bogota_music_intel/ciclos_curados.py` — fiestas y ciclos, **por nombre y no por id de evento**, para que la edición siguiente ("Vol. 5") entre sola.
- `services/api/bogota_music_intel/coordenadas_curadas.py` — coordenadas de salas (ver "4 salas sin geocodificar").

Las tres exigen un campo `evidencia`, y hay un test que lo verifica. La regla: la nacionalidad o la coordenada tiene que venir de una fuente consultable, nunca de memoria.

## Estado de implementación
- **Fase 1 (infraestructura) — hecha.** Monorepo con `apps/web` (Next.js) y `services/api` (FastAPI), Supabase conectado, GitHub Actions con cron diario **configurado pero nunca ejecutado** (ver "Lo que quedó a medias").
- **Fase 2 (scrapers) — hecha.** Seis fuentes activas en `services/api/bogota_music_intel/scrapers/`. `registry.py` es la fuente de verdad de qué venues son automatizables y cuáles requieren carga manual (con el motivo verificado de cada uno). Correr con `python -m bogota_music_intel.scrape_cli [--dry-run] [--source X]`.
- **Fase 3 (calendario) — hecha.** Listado por día y detalle en `apps/web` (Next.js 16, App Router). El frontend lee Supabase directo con la publishable key (RLS deja SELECT público); FastAPI queda como capa de ingesta y base de la API pública futura, no en el camino de lectura del calendario.
- **Fase 4 (mapa) — hecha** (verificada en navegador real, dev y producción). `/mapa` con MapLibre GL 6 + tiles de OpenFreeMap (sin API key). La geocodificación es un paso aparte del scraping: `python -m bogota_music_intel.geocode_cli`. 5 de 9 salas ubicadas; las que Nominatim no encuentra se listan sin ubicar antes que inventarles un pin.
- **Filtrado editorial — hecho, aplicado en la base y verificado en el servidor de desarrollo.** Clasifica en vez de borrar: `python -m bogota_music_intel.classify_cli [--dry-run] [--todas]`, que corre aparte del scraping y solo mira lo que llegó sin clasificar. La cartelera y el mapa leen esa clasificación (`apps/web/src/lib/editorial.ts` tiene el criterio; los dos lo importan de ahí). Sobre los 58 eventos reales: 6 fuera de cartelera, 3 locales, 29 internacionales, 20 sin origen resuelto. Detalle en `docs/investigacion-tecnica-plataforma-musical.md`, sección 6.

Datos en base al 2026-08-27 (recontar con una consulta, no citar de memoria): **58 eventos, 9 salas**, todos clasificados. En la cartelera se ven **48**: 58 menos los 6 excluidos por criterio editorial, menos los duplicados que se unifican entre fuentes.

### Lo que quedó a medias (pendientes operativos)
- **El aspecto visual del filtrado no se ha mirado con ojos humanos.** Juan aplicó la migración el 2026-08-27 y la clasificación quedó corrida sobre los 58 eventos. Lo verificado contra el servidor de desarrollo: la home renderiza la cartelera (no el estado de error), los 6 no-musicales no aparecen, `/mapa` tampoco los muestra, y en los 6 días que mezclan local con internacional el orden es correcto en los 6. Eso cubre el comportamiento, **no la apariencia**: el filtro y el orden se renderizan en el servidor, así que se pueden comprobar en el HTML —a diferencia del mapa, que era canvas del lado del cliente—, pero nadie ha mirado todavía si la cartelera *se ve* bien con menos eventos.
- **Nunca se ha desplegado a Vercel.** Todo se ha verificado en local. Hacen falta las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el proyecto de Vercel. Vercel corre `npm run build`, así que el `prebuild` que copia el worker de MapLibre se dispara solo.
- **El cron diario de scraping nunca ha llegado a ejecutarse.** Sigue siendo cierto al 2026-08-27: **todas** las corridas del repo son del workflow `Tests` disparadas por `push`; `scraper.yml` tiene 0. (Para recontar sin token: `curl -s "https://api.github.com/repos/jdieTorres/bogota-music-intel/actions/runs?per_page=100"` y mirar los `name`. Eran 9 corridas cuando se escribió esto y ya son 11 — el número envejece solo, lo que importa es que ninguna sea de `Scraper cron`.) Todos los datos en base vienen de corridas manuales en la máquina de Juan. Consecuencia no obvia: **los secrets `BMI_SUPABASE_URL` y `BMI_SUPABASE_SERVICE_ROLE_KEY` nunca se han ejercitado** — si un nombre no coincide, nadie se ha enterado todavía. `scraper.yml` declara `workflow_dispatch`, así que se puede lanzar a mano desde la pestaña Actions sin esperar a las 9:00. Desde el 2026-08-27 ese workflow tiene además un segundo paso, `Classify events`, que tampoco se ha ejercitado nunca.
- **4 salas sin geocodificar**: Auditorio Mayor (2 eventos), Capital Live Concerts (1), **Lourdes Music Hall (7 — el hueco más grande)** y Teatro Libre Sala Centro (1). La vía es `coordenadas_curadas.py`, que **exige un campo `evidencia`**. Verificado el 2026-08-27, y esto cierra la discusión: **no hay geocodificador que arreglar**. Se probó la dirección libre, la intersección y la API estructurada de Nominatim, y en las tres OpenStreetMap devuelve `house_number = null` — **no tiene numeración de casas en Bogotá**. "Carrera 13 #48-90" devuelve cuatro puntos repartidos entre Usme y Usaquén, porque solo matchea el nombre de la calle. Tres de las cuatro salas sí tienen dirección publicada; lo que falta es el punto, y lo tiene que poner una persona mirando un mapa.
  - **Lourdes Music Hall: Cra 13 #64-56, Chapinero** — encontrada el 2026-08-27 (la base la tenía en null); falta la coordenada.
  - **Teatro Libre Sala Centro** tiene evidencia lista para curar: OSM tiene el POI `amenity/theatre` "Escuela Teatro Libre" en `4.597347,-74.070088`, sobre la Calle 12B en La Candelaria, que coincide con la dirección publicada (Calle 12B #2-44).
- **Rotar la secret key de Supabase.** Juan la pegó en el chat el 2026-08-27; el repo es público. Recomendado, sin confirmar que se haya hecho.
- Opcional: añadir el secret `BMI_SUPABASE_PUBLISHABLE_KEY` al repo para que el CI prerenderice contra la base real en vez de contra placeholders.

### Siguiente paso concreto
No hay nada a medio escribir en el código. El bloque de trabajo acordado que queda es el **look & feel**, que Juan pidió trabajar en conjunto y con calma — y que ahora arranca sobre una cartelera de 48 eventos en vez de 58, con menos ruido.

Antes o en paralelo, la decisión que más mueve la aguja del principio editorial es la **lista curada de artistas locales** (ver "Nuevo pendiente"): hoy solo 3 eventos están confirmados como locales, así que "priorizar lo local" casi no se nota todavía.

Después viene la Fase 5 (radar de tendencias: Deezer charts + Last.fm) y la Fase 6 (pulido y deploy).

⚠️ `apps/web` corre **Next.js 16**, que cambió convenciones respecto a versiones anteriores: `params`/`searchParams` son Promises, existen los helpers globales `PageProps<'/ruta'>` y `LayoutProps<'/ruta'>`, y Turbopack es el default. Antes de escribir código de frontend, leé la guía correspondiente en `apps/web/node_modules/next/dist/docs/` (así lo pide `apps/web/AGENTS.md`).

⚠️ Turbopack deja a **MapLibre GL 6 sin su worker** y el mapa queda en negro **sin un solo error en consola** (dev y build por igual). Ya está resuelto con `apps/web/scripts/copiar-worker-maplibre.mjs` + `setWorkerUrl()`; el detalle está en `docs/investigacion-tecnica-plataforma-musical.md`, sección "Trampas del frontend". Si el mapa vuelve a quedar en negro, lo primero a mirar es si el navegador pide teselas — no si hay errores.

Antes de tocar un parser, leé la sección "Trampas de datos" de `docs/investigacion-tecnica-plataforma-musical.md`: varias suposiciones razonables (la zona horaria que declara el sitio, la URL como identidad del evento) resultaron falsas contra los sitios reales y ya tienen tests de regresión en `services/api/tests/`.

## Decisiones transversales tomadas durante la implementación (2026-08-27)
Valen para todo el proyecto, no solo para el módulo donde salieron:

- **Nunca inventar un dato: un "no sabemos" honesto vale más que un valor verosímil pero falso.** Es el criterio que decidió tres cosas distintas: no poner un pin en el lugar equivocado (mejor listar la sala como "sin ubicar"), no relajar la búsqueda de Nominatim hasta que "acierte", y no mostrar "12:00 a. m." cuando la fuente solo publicó fecha. Ante la duda, se muestra el hueco.
- **"No sé" y "confirmado que no" son estados distintos y no se colapsan.** Corolario del anterior, y ya decidió cuatro cosas en el filtrado editorial: `is_local` es `null`/`true`/`false` y el ranking solo castiga al `false`; `event_type` en `null` se sigue mostrando; un 503 de MusicBrainz no se guarda como "artista desconocido" sino que deja el evento sin clasificar para reintentarlo; y un match de la API con puntaje alto pero nombre distinto se rechaza en vez de aceptarse a medias. Cada vez que se juntan los dos estados, el sistema termina afirmando algo que nadie verificó.
- **Excluir es caro y silencioso.** Un evento que no aparece en la cartelera no deja ningún rastro para el usuario ni para nosotros. Por eso las reglas de exclusión se mantienen estrechas y lo que no se puede detectar con una regla honesta se cura a mano con evidencia, en vez de ensanchar la regla hasta que atrape el caso.
- **Guardar crudo, filtrar y clasificar en lectura.** La ingesta no descarta eventos; el criterio editorial se aplica al leer. Así, cuando cambie el criterio, no hay que volver a scrapear el pasado. Es lo que permitió que el filtrado editorial se implementara como cuatro columnas nuevas y un paso de clasificación aparte, sin tocar los scrapers: reclasificar todo es `classify_cli --todas` y no cuesta nada.
- **La deduplicación entre fuentes vive hoy en el frontend** (`apps/web/src/lib/dedupe.ts`), porque la cartelera es su único consumidor. Es deuda técnica consciente: cuando exista la API pública hay que moverla a la ingesta para que todos los clientes vean la misma cartelera ya canonizada.
- **Paleta oscura fija** en `apps/web/src/app/globals.css` (tokens `--background`, `--surface`, `--accent`…), elegida porque la cartelera se consulta de noche y el color lo deben poner los afiches. Es el punto de partida del trabajo de look & feel, no una decisión cerrada.
- **Verificar el frontend en un navegador de verdad, no solo en el HTML servido.** El mapa estuvo en negro con CI verde, tests pasando, tsc limpio, build correcto y HTML servido bien. Ninguna de esas señales lo detecta.

## Reglas duras (no negociables, ya decididas en investigación previa)
- **Ningún razonamiento sobre horas se hace sobre el texto ISO — hay que convertir a hora de Bogotá primero.** Colombia es UTC-5 todo el año: medianoche local es `T05:00:00Z` y un show de las 7 p. m. se guarda como `T00:00:00Z` del día siguiente. Buscar `"T00:00:00"` en la cadena responde sobre UTC y da lo contrario de lo que se busca. Este error ya se cometió dos veces (el desfase de 5 horas de Idartes y la detección de "sin hora publicada"); los dos tienen test de regresión, en `services/api/tests/` y en `apps/web/src/lib/fechas.test.ts`.
- **El límite de peticiones de una API se respeta dentro del módulo que la consulta, nunca en el llamador.** Dejarlo del lado del CLI parece más flexible y falla: la primera versión del clasificador espaciaba desde el bucle y dejaba escapar dos peticiones pegadas al arrancar, y MusicBrainz devolvió 503 a la cuarta consulta tumbando la corrida entera. Con el control adentro de `musicbrainz.py`, las 52 consultas pasaron limpias. Vale igual para Nominatim.
- No evadir el bloqueo anti-bots-IA de Tuboleta (robots.txt bloquea explícitamente a ClaudeBot/GPTBot). No construir scraper para ese sitio.
- Ningún venue auditado publica schema.org/Event — todos los parsers de scraping son a medida por sitio, no hay atajo genérico.
- Instagram/Facebook: robots.txt de Instagram bloquea rastreo de perfiles incluso sin login — tratar como fuente manual, no pipeline automatizado.
