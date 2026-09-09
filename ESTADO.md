# Estado del proyecto

Última actualización: **2026-09-09**, recontado contra la base con el MCP
después de que ticketlive corriera en producción y Juan aprobara sus eventos y
sus salas.

Acá van los pendientes, las cifras y lo que quedó a medias. **`CLAUDE.md` y los
`context/*/CLAUDE.md` son reglas y criterio; este archivo es la foto de hoy.**
Si algo de acá se vuelve permanente, sube a un `CLAUDE.md`; si algo de un
`CLAUDE.md` caduca, baja acá.

---

## 1. Bloqueado en Juan (nadie más lo puede destrabar)

- 🔥 **5 de 22 salas publicadas sin coordenada, y tres son las nuevas**: Ace Of
  Spades, La Sucursal y Teatro Republik, más La Mecánica y Teatro Cafam. Juan lo
  dejó anotado para después (2026-09-09). Duele más que antes: esas tres salas
  son las que traen la escena, y sin punto se listan bajo el mapa como "sin
  ubicar" en vez de aparecer en él. Se arregla pegando el punto desde Google
  Maps en `/admin` → Salas.
- **11 de 22 salas publicadas sin foto**, incluidas las tres nuevas — que son
  justo las que más ganarían con una, porque nadie las conoce. Se pegan como URL
  en `/admin` → Salas, con vista previa.
- **2 salas por aprobar**: Ágora Bogotá Centro de Convenciones y Museo de Arte
  Moderno de Bogotá MAMBO. Ninguna tiene eventos vigentes, así que no corre
  prisa.
- **El género: 10 de 56 publicados lo tienen**, con 7 en uso —Pop, Rock, Hip
  Hop/Rap, Popular, Reggaeton, Jazz, Vallenato—. Desde el 2026-09-08 **ninguna
  fuente lo escribe**: `generos` es columna propia (`text[]`, varios por evento)
  y la llena Juan en `/admin`. Ya no hay taxonomías que se cuelen, pero tampoco
  entra ninguno solo.
- **La escena local marcada: 4 de 56.** Mismo caso: desde que se dio de baja
  MusicBrainz nada la calcula. La marca rosa solo sale si Juan la pone.
- **La fecha de vencimiento del token de Supabase hay que anotarla.** El
  2026-09-08 Juan generó uno nuevo con escritura en Database y Migrations, y
  reemplazó al de solo lectura que vencía el 2026-12-06. Los tokens scoped
  siempre vencen y el máximo del desplegable son 90 días; **si tomó el máximo
  vence alrededor del 2026-12-07**, pero eso no se verificó. Al vencer, el MCP
  responde `Unauthorized` sin decir que caducó.

### Preguntas abiertas — hay que hacérselas a Juan, no resolverlas por cuenta propia

- **¿Se les devuelve el año al título de los festivales que ya están
  revisados?** A los festivales viejos el normalizador les quitó el año cuando
  todavía eran `music`, y **no se re-normalizaron porque tienen `reviewed_at`**
  — no hay forma de distinguir "Juan dejó ese título" de "Juan nunca lo miró",
  y pisar una edición del admin es lo que el modelo de moderación prohíbe. Si
  Juan confirma que esos títulos no fueron decisión suya, es una corrida y ya.
- **¿Se borra el secret `BMI_LASTFM_API_KEY`?** Ya no lo usa nadie.
- **¿Se suelta `canonical_events.price_text`?** Desde el 2026-09-02 no la lee
  nadie: el precio sale de `price_kind`/`price_min`/`price_max`. Se conservó
  porque soltarla borra datos irrecuperables. En `events` **sí se queda**: ahí
  es la evidencia cruda de lo que publicó la fuente.

---

## 2. Lo que quedó a medias

- **El lector de afiches funciona y deja huecos.** Juan lo probó el 2026-09-08
  con saldo cargado: lee, y **los campos que el afiche no dice quedan vacíos con
  su explicación en las notas**, que era lo único que hacía falta medir. Queda
  sin ejercitar el caso extremo —un afiche sin año— pero el comportamiento de
  fondo está comprobado.
- **`/admin` no se ha visto renderizado desde los cambios del 2026-09-08.**
  Pide sesión, así que `npm run capturas` —que cubre las cinco páginas
  públicas— no llega ahí. Compila, los tipos cierran y los tests pasan, pero
  este proyecto ya tuvo el mapa en negro con el CI entero en verde. Sin
  verificar: el bloque de carga de afiche, los dos campos de fecha, y que
  guardar un evento al que se llegó con `?evento=` devuelva a su ficha pública.
- **`latino_power` falló dos corridas seguidas y a la tercera pasó sin tocar
  nada.** Su API devolvió 200 con un cuerpo que no era JSON —una página de
  desafío de WAF—, y `.json()` murió con un mensaje mudo. **Era transitorio**,
  no un bloqueo de IP: es el mismo susto que dio MusicBrainz en agosto, donde un
  fallo se leyó como "esta API trata distinto a CI" y ocho días después resultó
  ruido. El error ahora dice el estado, el `content-type`, el cuerpo y las
  cabeceras que delatan al WAF, así que si vuelve se diagnostica de un vistazo.
- **6 eventos del Movistar cuelgan solo de `visitbogota`, que ya no corre.**
  LosPetitFellas (9 oct), Kris R (23 oct), Aterciopelados (30 oct), Reykon (6
  nov), Todos Somos Ángeles Rock Fest (8 nov) y Juanes (19 nov). Recuperar
  `movistar_arena` **no los reenganchó**: el sitio de la sala publica una
  ventana de un mes y esos seis caen fuera. Se reenganchan solos cuando su
  fecha entre en la ventana; hasta entonces, si el Movistar mueve una de esas
  fechas nadie se entera. El detalle en `context/ingesta/fuentes-y-legalidad.md`.
- **Nunca se ha desplegado a Vercel, y queda pospuesto a propósito** —
  decisión de Juan el 2026-09-08: el producto todavía está cambiando de forma y
  desplegar ahora sería congelar una foto que va a durar días. No es un
  bloqueo, es una espera. Cuando toque hacen falta `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `ANTHROPIC_API_KEY` en el proyecto
  de Vercel. ⚠️ Y hay algo que **solo se prueba desplegado**: el route handler
  del afiche declara `maxDuration = 60`, el tope del plan Hobby, y ese límite
  es del entorno y no del código.
- **El sitio no se ha visto en un dispositivo real.** Las 30 capturas de
  `npm run capturas` cubren escritorio y móvil en los dos modos, pero son
  Chromium headless a tamaño simulado: no dicen nada de un teléfono de verdad
  ni de Safari.
- **21 publicados sin revisar** (de 56). Tienen `reviewed_at` en null y eso es
  correcto: nadie los revisó. El número baja solo a medida que Juan toca cada
  evento por otro motivo.
- **12 publicados ya pasaron de fecha** y siguen en `publicado`. No se ven —la
  cartelera filtra por `starts_at >= hoy`— así que no es un bug, pero explica
  por qué "56 publicados" y "44 en pantalla" no cuadran.
- **Sin verificar, porque no se ve desde fuera del dashboard:** si el proyecto
  de Supabase todavía expone las **claves legacy JWT** (`anon` /
  `service_role`). Son un juego de credenciales aparte que la rotación de las
  `sb_*` del 2026-08-28 no tocó.
- **Opcional:** añadir el secret `BMI_SUPABASE_PUBLISHABLE_KEY` al repo para
  que el CI prerenderice contra la base real en vez de contra placeholders.

---

## 3. Las cifras

⚠️ **Envejecen con cada corrida del cron y con cada sesión de triage:
recontarlas con una consulta, no citarlas de memoria.** Recontadas el
**2026-09-08** contra la base, con el MCP.

| | |
|---|---|
| Fuentes activas | **7** — movistar_arena, royal_center, lourdes, latino_power, rockal_live, idartes, ticketlive |
| Filas crudas | **125** — visitbogota 56 *(congeladas)*, royal 15, movistar 13, ticketlive 10, lourdes 9, latino 9, rockal 8, idartes 5 |
| Crudas sin clasificar | **0** |
| Canónicos | **110** — 56 publicados, 1 borrador, 53 descartados |
| En pantalla | **33 toques, 5 fiestas, 6 festivales**; el mapa cuenta 10 salas y 44 eventos |
| Salas | **24** — 22 publicadas, 2 por aprobar |
| Coordenadas | **17 de 22** salas publicadas ubicadas |
| Fotos de sala | **11 de 22** |
| Precio | **22 de 56** publicados |
| Género | **10 de 56** publicados, 7 géneros en uso, ninguno compuesto |
| Escena local marcada | **4 de 56** — se marca a mano y nada la calcula |
| Bloqueados | **36** `(fuente, id)` — visitbogota 26, idartes 7, movistar 3 |
| Duplicados sugeridos | **0** |
| Tests | **239 backend + 69 frontend**, verdes en local y en CI |

Cómo leerlas sin equivocarse:

- ⚠️ **El estado de un canónico es `status`, no `published_at`.** Hay
  descartados que conservan la fecha en la que estuvieron publicados, y es
  correcto que la conserven.
- ⚠️ **Las 56 filas de visitbogota están congeladas, no vivas.** La fuente
  salió del registry el 2026-09-08; sus filas quedan como registro y no se
  actualizan. Lo mismo vale para `scraped_at`, que es "cuándo se vio por
  primera vez" y no "última corrida": el upsert no lo reescribe.
- **Los tests bajaron de 275 a 221 y no se perdió cobertura**: se fueron los 54
  que probaban MusicBrainz y el origen del artista, junto con el código.
- **La escena local marcada bajó de 35 a 4 a propósito.** El 2026-09-08 se
  pusieron en `null` los 70 canónicos cuyo `is_local` venía de MusicBrainz —
  medía nacionalidad y la pantalla decía "escena local"— y quedaron los 6 que
  venían de la lista curada, de los cuales 4 están publicados.
- **Las fiestas y los festivales tienen `is_local = null` y eso es correcto.**
  No hay un artista de cartel a quien preguntarle.

---

## 4. El siguiente paso

**Decidido con Juan el 2026-09-09, en este orden:**

1. 🎯 **El directorio de la escena local.** Es el único módulo del MVP que no ha
   arrancado —mapa y calendario están hechos— y el que convierte esto en lo que
   dice ser: la referencia de la escena, no una cartelera más. Para el pivote de
   Juan hacia periodismo importa que produzca material propio, no que agregue lo
   que otros publican.

   Ya está sembrado sin que nadie haya hecho nada: los artistas que tocan en La
   Sucursal, Ace Of Spades, Latino Power y Teatro Republik ya están en la base.

   ⚠️ **Lo que hay que saber antes de diseñarlo**, y está medido, no supuesto:

   - **El artista no existe como entidad en ninguna capa.** No hay tabla; lo
     único que hay es el booleano `is_local` sobre el evento. Hay que crearla, y
     conviene copiar la forma de moderación de `venues` (borrador/publicado,
     `reviewed_at`, evidencia) en vez de inventar otra.
   - **No hay fuente legal del audio de esta escena.** Está verificado y
     archivado dos veces: fue lo que mató el Motor de similitud sonora. La
     rockola que quiere Juan **embebe reproductores de terceros, no aloja
     nada** — YouTube es la única con control programático real de la cola, que
     es lo que separa una rockola de una pared de iframes. El vinilo que gira
     es CSS.
   - **Ninguna API conoce al artista local emergente.** Se probaron MusicBrainz,
     Deezer, iTunes y Wikidata (`context/archivo/apis-de-musica.md`). El
     directorio se llena a mano, y eso no es un parche: es el activo.

   El boceto del módulo está en el plan de la sesión del 2026-09-08,
   `~/.claude/plans/como-vas-quiero-armar-prancy-bubble.md`, fase 4.

2. **Desplegar a Vercel.** Pospuesto por Juan mientras el producto cambiaba de
   forma, y esa razón se está agotando: el pipeline lleva dos corridas estables.
   **Nada de lo construido lo ha visto nadie más que Juan.** Hacen falta
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
   `ANTHROPIC_API_KEY` en Vercel, y hay dos cosas que **solo se prueban ahí**: el
   tope de 60 s del route handler del afiche y el sitio en un teléfono real.

3. **Más fuentes.** `mitaquilla.com.co` quedó confirmada abierta el 2026-09-08 —
   con el User-Agent correcto, ver `context/ingesta/fuentes-y-legalidad.md`— y
   `feverup.com` sigue sin explorar. Passline queda fuera: está detrás de una
   sala de espera virtual, y meter un cron ahí ocuparía puestos en una cola de
   compra.
