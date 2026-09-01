# Bogotá Music Intel

Plataforma de inteligencia musical de la escena de Bogotá/Colombia. Proyecto
personal de Juan, y su vehículo de pivote de carrera: de desarrollo de software
hacia periodismo y creación de contenido en la industria musical.

`bogota-music-intel` es un **slug de trabajo**, no el nombre final.

---

## Lo primero que hay que entender

**La plataforma prioriza y promueve los toques de artistas locales.** No es una
cartelera genérica de eventos de la ciudad: si algo entra al producto, tiene
que servir a ese propósito. Es criterio de diseño, no solo de filtrado — aplica
al scraping, al ranking y a cómo se presenta cada evento.

**Ningún evento se publica solo.** El cron propone; lo que trae entra como
borrador a una cola y Juan verifica, completa y publica. Lo que se muestra sale
de `canonical_events`, no de `events`.

---

## Dónde está cada cosa

Este archivo es el índice y las reglas transversales. **Lo específico de cada
área vive en su propio `CLAUDE.md` — leerlo antes de trabajar ahí.**

| Ruta | Cuándo leerlo |
|---|---|
| `ESTADO.md` | **Siempre al empezar.** Pendientes, cifras y lo que quedó a medias. |
| `context/producto/CLAUDE.md` | Qué es el producto, el MVP, las fases. |
| `context/editorial/CLAUDE.md` | Qué se publica, las cuatro categorías, el origen del artista, el género. |
| `context/ingesta/CLAUDE.md` | Scrapers, fuentes, listas curadas, títulos, bloqueos, límites de API. |
| `context/moderacion/CLAUDE.md` | El modelo canónico, la cola, `/admin`, salas, duplicados. |
| `context/frontend/CLAUDE.md` | `apps/web`, Next.js 16, el mapa, el tema, imágenes. |
| `context/infraestructura/CLAUDE.md` | Supabase, migraciones, CI, secrets, deploy. |
| `context/look-and-feel/CLAUDE.md` | **Antes de tocar `globals.css`, `layout.tsx` o cualquier UI.** |
| `context/archivo/CLAUDE.md` | Antes de proponer una fuente de datos de música o reabrir el radar. |

**Las cifras y los pendientes van en `ESTADO.md`, no acá.** Este archivo y los
`context/*/CLAUDE.md` son criterio que no caduca; `ESTADO.md` es la foto de
hoy.

---

## Stack

- **Frontend:** Next.js 16 (TypeScript) en Vercel, plan Hobby (⚠️ no
  comercial). Lee Supabase directo.
- **Backend:** Python + FastAPI (`services/api`, paquete
  `bogota_music_intel`). Capa de ingesta, no de lectura.
- **Base de datos:** Supabase (Postgres + Auth + Storage).
- **Ingesta:** GitHub Actions (cron), respetando `robots.txt`.
- **Mapas:** MapLibre GL 6 + tiles de OpenFreeMap (sin API key ni límite).
- **Geocodificación:** Nominatim, más coordenadas curadas a mano.

Monorepo: `apps/web` + `services/api`. Detalle en
`context/infraestructura/CLAUDE.md`.

---

## Reglas duras

No negociables. Cada una se pagó con un error, y varias con dos.

- **Nunca inventar un dato: un "no sabemos" honesto vale más que un valor
  verosímil pero falso.** Decidió tres cosas distintas: no poner un pin en el
  lugar equivocado, no relajar la búsqueda de Nominatim hasta que "acierte", y
  no mostrar "12:00 a. m." cuando la fuente solo publicó fecha. Ante la duda,
  se muestra el hueco.
- **"No sé" y "confirmado que no" son estados distintos y no se colapsan.**
  `is_local` es `null`/`true`/`false` y el ranking solo castiga al `false`; un
  503 de MusicBrainz no se guarda como "artista desconocido"; un match con
  puntaje alto pero nombre distinto se rechaza en vez de aceptarse a medias.
  Cada vez que se juntan los dos estados, el sistema afirma algo que nadie
  verificó.
- **Guardar crudo, filtrar y clasificar en lectura.** La ingesta no descarta;
  el criterio editorial se aplica al leer. Así, cuando cambie el criterio, no
  hay que volver a scrapear el pasado.
- **Ningún razonamiento sobre horas se hace sobre el texto ISO — hay que
  convertir a hora de Bogotá primero.** Colombia es UTC-5 todo el año:
  medianoche local es `T05:00:00Z` y un show de las 7 p. m. se guarda como
  `T00:00:00Z` del día siguiente. Buscar `"T00:00:00"` en la cadena responde
  sobre UTC y da lo contrario de lo que se busca. Este error ya se cometió dos
  veces; los dos tienen test de regresión.
- **El límite de peticiones de una API se respeta dentro del módulo que la
  consulta, nunca en el llamador.** Dejarlo del lado del CLI parece más
  flexible y falla.
- **A una API se le pregunta llamándola, no leyendo su documentación.** La
  investigación documental de APIs de música se armó leyendo docs oficiales, y
  al llamarlas cuatro entradas resultaron falsas. Una duda que se pueda
  contestar con un `GET` no merece más investigación documental.
- **Y hay que llamarla desde donde va a correr en producción, no solo en
  local.** Pasó con Deezer (geolocaliza por IP y desde CI devuelve otro chart,
  sin error) y otra vez con MusicBrainz. Que le haya pasado a dos de tres
  fuentes externas sugiere que **el default a asumir es que una API responde
  distinto desde CI**. Si algo depende de una API y solo se probó local,
  tratalo como no probado.
- **Verificar el frontend en un navegador de verdad, no solo en el HTML
  servido.** El mapa estuvo en negro con CI verde, tests pasando, `tsc` limpio
  y build correcto.
- **En pantalla no van nombres de archivo nuestros.** Al lector no le dicen
  nada y le piden entender cómo está hecho el sistema. La nota para quien
  mantiene el código va en el código. Vale para estados vacíos y mensajes de
  error, que es donde da la tentación de explicar de más.
- **La categoría que publica una fuente no siempre coincide con su propia
  ficha**, y cuál de las dos señales sirve se mide fuente por fuente, no se
  hereda.
- **Una señal que sirve para filtrar suele servir mejor para clasificar.**
  Antes de sacar una regla que dejó de hacer falta, preguntarse si el dato que
  usaba sirve un paso más adelante.
- **Una lista que hay que mantener a mano necesita algo que avise cuando le
  falta una entrada.** Cuando se elige una lista blanca sobre un comodín, el
  costo no es escribirla: es **enterarse tarde de que le falta algo**, y eso
  se paga una vez con un chequeo automático.
- **Lo curado exige `evidencia`, y hay tests que lo verifican.** La
  nacionalidad, la coordenada o la grafía tiene que venir de una fuente
  consultable, **nunca de memoria ni de criterio propio**.
- **No evadir bloqueos anti-bots.** El `robots.txt` de Tuboleta bloquea
  explícitamente a ClaudeBot/GPTBot; Bandsintown, Songkick e Instagram
  bloquean igual. Para esas fuentes la vía es **pegar, no traer**: si el admin
  pega una URL y nuestro servidor la va a buscar, sigue siendo nuestro agente
  entrando donde no lo dejan.
- **Las migraciones las aplica Juan a mano** en el SQL Editor de Supabase.
  Ninguna sesión puede aplicar una por su cuenta: no hay CLI ni cadena de
  conexión. Entregarla y pedirla, no darla por corrida.
- **Antes de dar el CI por bueno, mirar los dos workflows.** `Tests` y
  `Scraper cron` son distintos y uno no dice nada del otro.

---

## Mantener esta documentación

La skill **`/actualizar-estado`** pone al día `ESTADO.md`, este archivo y los
`context/*/CLAUDE.md` con el estado real. Correrla al cerrar una fase o una
sesión de trabajo. Es la vía preferida: trae el procedimiento de verificación
—qué mirar en el repo en vez de fiarse de la memoria de la conversación— y las
reglas de redacción.

**Dónde escribir cada cosa**, que es lo que mantiene esto corto:

- Un hecho que caduca (una cifra, un pendiente, algo sin desplegar) → `ESTADO.md`.
- Una regla o un criterio de un área → el `CLAUDE.md` de esa área.
- Una regla que vale para todo el proyecto → "Reglas duras", acá.
- Una investigación, una medición o el relato de un bug → el `.md` de detalle
  de la carpeta correspondiente.
- Algo que dejó de estar vivo → `context/archivo/`.
- Si está en el código, en los tests o en el historial de git → **en ningún
  lado**.
