# Filtrado editorial — cómo se implementó (2026-08-27)


Definido con Juan el 2026-08-27, tras revisar la cartelera ya poblada. **La plataforma prioriza y promueve los toques de artistas locales**, y hasta ese momento el pipeline metía todo lo que publica cada sala.

### Las dos decisiones de producto (tomadas por Juan, 2026-08-27)

Estaban trabadas porque son dos preguntas distintas y solo Juan podía contestarlas:

1. **Lo que no es música en vivo se excluye siempre** de la cartelera visible: comedia, lucha libre, teatro, ópera. No son el producto.
2. **Los artistas internacionales NO se excluyen**: se muestran, pero en segundo plano respecto a los locales. Un show de Robbie Williams en el Movistar es parte de la escena en vivo de Bogotá aunque no sea un toque local.

La segunda decisión es la que evita convertir el filtro en una tijera: excluir todo lo internacional habría borrado media cartelera y con ella el contexto de la escena.

### El problema que se resolvió (medido sobre los 58 eventos reales en base)

**No es música** — estos seis son los que hoy quedan fuera de la cartelera:
- `THE JUANPIS LIVE SHOW: "SI NOS ORGANIZAMOS CABEMOS TODOS"` — comedia/late night (Movistar Arena)
- `WWE Bogota 2026` — lucha libre (Movistar Arena)
- `HOMBRES A LA PLANCHA` — teatro (Royal Center)
- `'CONTINENTAL'`, `'Ella' de Luisa Fernanda Hoyos` — teatro (Teatro JEG)
- `Einstein on the Beach` — ópera/multidisciplinar (Teatro JEG)

**Es música pero no es artista local:** Robbie Williams, Helloween, 5 Seconds of Summer, Opeth, Of Monsters and Men, Blonde Redhead, Jorge Drexler, Gustavo Santaolalla, Cosculluela, Tini, Los Mirlos, Todos tus muertos, Inspector, Ky Mani Marley… (mayoría de la cartelera de Movistar Arena y buena parte de Royal Center).

### El obstáculo: la categoría de la fuente no alcanza (por eso hacen falta las otras tres señales)
Solo **17 de 58** eventos traen `category`, y viene únicamente de dos fuentes:

| Fuente | Con categoría | Valores |
|---|---|---|
| Idartes Teatro JEG | 9/9 | Música, Teatro, Multidisciplinar |
| Rockal Live | 8/8 | Pop, Hip Hop/Rap, Reggaeton, Rock/Punk/Metal, Otro |
| Movistar Arena | 0/12 | — |
| Royal Center | 0/12 | — |
| Lourdes Music Hall | 0/9 | — |
| Latino Power | 0/8 | — |

Las dos salas que más ruido meten (Movistar Arena y Royal Center) son justamente las que no publican categoría. Filtrar por `category` resolvería el teatro de Idartes y poco más.

### Cómo quedó implementado

Se marca, no se borra: la ingesta sigue guardando todo crudo y la clasificación se escribe encima, en cuatro columnas nuevas de `events` (`event_type`, `is_local`, `classification_source`, `classified_at` — migración `supabase/migrations/20260828000000_clasificacion_editorial.sql`). Cambiar el criterio no obliga a volver a scrapear el pasado.

El clasificador vive en `services/api/bogota_music_intel/classify.py` y aplica cuatro señales, **de la más confiable a la más frágil, ganando la primera que contesta**:

| Orden | Señal | Dónde | Por qué en ese lugar |
|---|---|---|---|
| 1 | Lista curada a mano | `clasificacion_manual.py` | Alguien lo verificó en la fuente. Exige `evidencia`, igual que `coordenadas_curadas.py` |
| 2 | Categoría de la fuente | `exclusion_patterns.py` | La publicó la sala; no la inventamos nosotros |
| 3 | Patrón en el título | `exclusion_patterns.py` | Heurística nuestra, para las fuentes sin categoría |
| 4 | MusicBrainz | `musicbrainz.py` | Solo para el origen del artista |

Se corre aparte del scraping: `python -m bogota_music_intel.classify_cli [--dry-run] [--todas]`. Por defecto solo toca lo que llegó sin clasificar, así que es incremental. A diferencia de la geocodificación —que se deja a mano porque la política de Nominatim pide no automatizarla— este paso sí corre en el cron: MusicBrainz solo limita el ritmo.

**Los patrones se mantienen deliberadamente pocos y estrechos.** La tentación es ensancharlos hasta atrapar todo, pero el costo es asimétrico: un patrón ancho saca un toque real de la cartelera y nadie se entera nunca. Por eso no hay patrón para `live show` —esa frase también aparece en títulos de conciertos— y "THE JUANPIS LIVE SHOW" se cura a mano.

### Resultado medido sobre los 58 eventos reales (2026-08-27)

**6 fuera de cartelera**, que son exactamente los seis que se estaban colando:

| Evento | Cómo se detectó |
|---|---|
| `'CONTINENTAL'`, `'Ella'` | categoría `Teatro` de Idartes |
| `Einstein on the Beach` | categoría `Multidisciplinar` de Idartes |
| `WWE Bogota 2026` | patrón `\bwwe\b` |
| `THE JUANPIS LIVE SHOW` | curado a mano |
| `HOMBRES A LA PLANCHA` | curado a mano |

`HOMBRES A LA PLANCHA` es el caso que obliga a que exista la lista curada: es una obra de teatro en el Royal Center cuyo título se lee **exactamente igual que el nombre de una banda**, y esa fuente no publica categoría. No hay regla honesta que lo saque sin sacar también música.

### Resultado final (2026-08-27, tras la categoría fiesta y el arreglo de la limpieza)

Sobre los mismos 58 eventos: **6 fuera de cartelera, 5 fiestas, 5 locales, 34 internacionales, 8 sin origen resuelto.** En pantalla quedan 44 conciertos y 3 fiestas próximas (más una sin fecha), tras unificar duplicados entre fuentes.

Los "sin resolver" bajaron de 20 a 8, y casi todo ese rescate vino de **arreglar la limpieza de títulos, no de curar a mano**. Es el hallazgo de proceso más útil de esta fase: la primera lectura fue "hay 20 eventos que necesitan lista curada", y la mitad eran fallas de código que se repetían con cada evento futuro. Conviene agotar lo automatizable antes de empezar a curar, porque curar no escala.

El caso que lo resume: `10 AÑOS Y NO AZARAN - LA MUCHACHA EN BOGOTÁ`. La búsqueda se quedaba con el primer tramo, que es el nombre de la gira, y perdía a La Muchacha — que MusicBrainz sí resuelve como colombiana. Ahora se prueban varios candidatos del título en orden, y solo se paga la petición extra cuando el primero no resolvió. Lo mismo recuperó a Sara Curruchich (GT), Shing02 (JP) y Rayos Láser (AR).

### El hallazgo incómodo: MusicBrainz cubre mal la escena local

Aun después del arreglo, solo 5 eventos quedaron confirmados como locales, y 4 de los 5 son de música popular con catálogo comercial (Jorge Celedón, Jhon Alex Castaño, Jhonny Rivera) o se resolvieron a mano (Todo Copas). La quinta, La Muchacha, apareció solo porque se arregló la búsqueda.

De los 8 que siguen sin origen, **cinco existen en MusicBrainz pero sin país**: El Kalvo, PABLOPABLO, Ancestral Beats, Slaughter to Prevail y El plan de la mariposa. Es decir: MusicBrainz resuelve bien al internacional consagrado y mal justamente al artista local emergente, que es a quien la plataforma existe para promover.

Consecuencia de diseño: **el `null` no se penaliza**. `is_local` tiene tres estados y los tres significan cosas distintas —`true` local, `false` internacional confirmado, `null` no se pudo resolver— y el ranking solo baja al `false`. Si lo desconocido contara como "no local", la cartelera hundiría los toques que debería destacar.

Para cerrar ese hueco hace falta una **lista curada de artistas locales**, mismo patrón que las coordenadas curadas. Es trabajo de conocimiento de escena, no técnico.

### Trampas encontradas al implementarlo (verificadas contra el servicio real)

- **El límite de peticiones tiene que vivir dentro del módulo que consulta la API, no en el llamador.** La primera versión espaciaba desde el CLI y dejaba escapar dos peticiones pegadas al arrancar; MusicBrainz devolvió **503 en la cuarta consulta** y tumbó la corrida entera. Con el control adentro (`musicbrainz.py`), las 52 consultas pasaron sin un solo 503.
- **MusicBrainz también corta con `ReadTimeout`, no solo con 503.** Apareció en la primera corrida real contra la base, ya con el 503 resuelto: un timeout suelto volvió a tumbar el proceso entero. Se atrapa `httpx.TransportError` (cubre timeouts y cortes de conexión) con el mismo reintento. Moraleja: al integrar una API externa no alcanza con manejar el código de error que devuelve, hay que manejar también que no devuelva nada.
- **`503` y los timeouts no son "no encontrado".** Hay que distinguir "no pude preguntar" de "pregunté y no está": si se guarda "origen desconocido" cuando el servicio estaba caído, el evento queda dado por resuelto para siempre, porque el CLI solo mira lo que está sin clasificar. Por eso existe `MusicBrainzNoDisponible` y esos eventos se dejan sin escribir. Esto ya se pagó solo: cuando el timeout cortó la corrida a mitad, volver a lanzar el CLI retomó exactamente donde había quedado.
- **Un match de puntaje alto no alcanza.** MusicBrainz siempre contesta algo. Sin un segundo filtro de parecido del nombre, `Laura & Brenda` resolvía a la artista `Laura` y heredaba su país. Se exige `score >= 90` **y** parecido `>= 0.88` sobre el nombre normalizado.
- **Royal Center separa con un espacio duro:** el título real es `AKRIILA -\xa0 TOUR LUCY`, con `\xa0` (no-break space). Se ve idéntico en pantalla y rompe cualquier `split(" - ")` ingenuo. Hay test de regresión.
- Limpiar el título antes de consultar es obligatorio: las salas titulan el evento, no al artista (`ROBBIE WILLIAMS | BRITPOP`, `PABLOPABLO EN BOGOTÁ`, `Gustavo Santaolalla llega a Bogotá con el Ronroco Tour`).

### Limitación conocida

La clasificación es por fila, y la deduplicación entre fuentes ocurre después, en el frontend. Si un mismo evento no-musical lo publicaran dos fuentes, harían falta dos entradas curadas. Hoy no pasa, pero desaparece solo cuando la deduplicación se mueva a la ingesta (ver deuda técnica registrada en `CLAUDE.md`).

---

