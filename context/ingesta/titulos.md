# Normalización de títulos de evento


Los títulos crudos se muestran formateados: **"Artista | Gira"**, con **" & " entre varios artistas de cartel** (la barra es solo para lo que viene *después* del artista). `events.title` sigue guardando lo que publicó la fuente — esto es capa de lectura, en `apps/web/src/lib/tituloEvento.ts`, con la misma deuda consciente que `dedupe.ts`: cuando exista la API pública conviene moverlo a la ingesta.

La primera versión (2026-08-29) se escribió contra unos pocos ejemplos. Juan encontró varios títulos mal normalizados y la revisión del 2026-08-31 se hizo **título por título contra los 53 que hay en la base**, no contra casos inventados. Vale como método: un formateador de texto se prueba contra el corpus real o no se prueba.

### El defecto de fondo de la primera versión

`tituloCaso` **bajaba mayúsculas que la fuente había puesto a mano**: "Lucho Al Attaque" quedaba "Lucho al Attaque" y "Juantxo Skalari/ The Skatalites" quedaba "the Skatalites". La regla ahora es asimétrica: **solo sube mayúsculas, nunca las baja**, salvo que el título entero venga gritado en mayúscula sostenida —ahí sí se rearma completo—. Una sala que escribe en mayúsculas no está diciendo nada sobre el nombre del artista; una que escribió "Al" con mayúscula sí. Al revés, "Todos tus muertos" y "El plan de la mariposa" hay que subirlos.

Tres excepciones, todas con test: una palabra que mezcla letras y dígitos se deja quieta (`MADE4RAP`, `A-1`), una sigla aislada dentro de un título en caja mixta también (`WWE Bogota 2026` daba "Wwe"), y dos o más mayúsculas seguidas dentro de un título en caja mixta se tratan como grito (`Shing02, SPIN MASTER A-1` → `Spin Master A-1`).

### Las reglas automáticas, y por qué son estrechas

- **El ruido de sala y de ciudad no es parte del nombre de nadie.** "AKRIILA EN BOGOTÁ" → "Akriila"; "Blonde Redhead llega al Teatro Jorge Eliécer Gaitán" → "Blonde Redhead". Se borra **únicamente** cuando lo que sigue a la preposición nombra la ciudad o la sala real del evento — por eso `tituloParaMostrar` recibe el nombre de la sala. Sin ese requisito, "en vivo" o "en concierto" se llevarían medio título por delante.
- **Lo que viene detrás del lugar es la gira, no basura**: "Gustavo Santaolalla llega a Bogotá con el Ronroco Tour" → "Gustavo Santaolalla | Ronroco Tour"; "Todo copas en Latino Power Bogota 20 Años" → "Todo Copas | 20 Años".
- **El año suelto al final es cómo el Movistar Arena desambigua sus fichas** ("Alvaro Diaz 2026", "WWE Bogota 2026"), no parte del nombre. No se toca si el título ya trae separador, porque ahí el año está dentro de la gira.
- **Partir un cartel de varios artistas es conservador a propósito.** La barra solo parte si todos los pedazos quedan con 4 o más caracteres —eso salva a "AC/DC"— y la "y" solo parte cuando una coma o una barra ya marcaron que es una lista: sin ese requisito, "10 AÑOS Y NO AZARAN" se convertiría en dos artistas inexistentes.
- **Un nombre repetido dos veces se colapsa solo si se ve la costura** (minúscula pegada a mayúscula): "BloodbathBloodbath" → "Bloodbath", pero "PABLOPABLO" —que es literalmente "PABLO"+"PABLO"— no se toca. Es el mismo criterio de siempre: la regla se estrecha hasta que no pueda destrozar un caso legítimo.

### Lo que ninguna regla honesta puede resolver

**No hay señal en el texto para distinguir "artista - gira" de "artista - artista".** "ROBBIE WILLIAMS | BRITPOP" y "Lenny Tavarez – J quiles" se ven exactamente igual, y el segundo son dos artistas. Se probó lo obvio —buscar palabras de gira ("tour", "aniversario") en el lado derecho— y falla en los dos sentidos: "BRITPOP", "EL REY DEL CHUPE" y "LA HISTORIA MÍA" son giras sin ninguna de esas palabras. Así que el caso frecuente (gira) es la regla y el otro se cura a mano.

Lo mismo para todo lo que exige saber algo que el título no dice: la gira que la sala no publica (Movistar titula "Alvaro Diaz 2026"; la gira se llama **Omakase Tour** y aparece solo en el enlace de compra de esa misma página), el título al revés con la gira adelante ("10 AÑOS Y NO AZARAN - LA MUCHACHA" es La Muchacha), y el formato del show pegado al nombre ("RAYOS LASER ACÚSTICO" es Rayos Láser tocando acústico).

Todo eso vive en `apps/web/src/lib/titulosCurados.ts`, con evidencia y test que la exige, igual que `artistas_locales.py`. Dos niveles, y el general va primero: **`GRAFIAS`** va por nombre de artista, así el show siguiente del mismo artista entra solo; **`TITULOS`** va por título crudo exacto y son solo cinco entradas, porque deja de engancharse si la sala cambia una coma — mismo riesgo que `eventos_excluidos.py`.

### Limitación conocida: la dedupe se queda con el registro más completo, no con el mejor titulado

Akriila llega por Royal Center como "AKRIILA - TOUR LUCY" y por Rockal Live como "AKRIILA EN BOGOTÁ". `unificarDuplicados` se queda con la segunda porque trae precio, hora y género, así que la cartelera muestra "Akriila" **sin la gira**, aunque la otra fuente sí la publicaba.

No es un defecto de la normalización y no está resuelto. Arreglarlo significa que la fila unificada tome el título de una fuente y el resto de los campos de otra, y ahí el título mostrado deja de corresponder al `source_url` de la fila que se muestra. **Es una decisión de producto pendiente de Juan**: ¿vale mostrar un título que no está en la página a la que lleva el enlace?

---


### Un bug que solo encontró una fuente nueva

`XXXIV Congreso Internacional AEDEM 2026 en Bogotá | Economía, innovación` quedaba normalizado con **dos barras**: al quitar el "en Bogotá", el separador que venía después quedaba al principio de la gira y se volvía a unir con otro `|`.

Los 53 títulos con que se verificó el normalizador no lo encontraron porque **ninguna de las seis fuentes anteriores titula así**. Vale como argumento a favor de sumar fuentes aunque cuesten triage: cada una ejercita el parser de una forma que las anteriores no.

