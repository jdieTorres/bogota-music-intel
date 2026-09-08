# Estado del proyecto

Última actualización: **2026-09-08**, recontado contra la base con el MCP
después de la primera corrida del cron sin MusicBrainz.

Acá van los pendientes, las cifras y lo que quedó a medias. **`CLAUDE.md` y los
`context/*/CLAUDE.md` son reglas y criterio; este archivo es la foto de hoy.**
Si algo de acá se vuelve permanente, sube a un `CLAUDE.md`; si algo de un
`CLAUDE.md` caduca, baja acá.

---

## 1. Bloqueado en Juan (nadie más lo puede destrabar)

- 🔥 **La cuenta de Anthropic no tiene saldo, y eso deja el lector de afiches
  sin probar.** La key está en `apps/web/.env.local` y la API la acepta; lo que
  devuelve es *"Your credit balance is too low"*. Se recarga en
  `console.anthropic.com` → Plans & Billing. Es la única dependencia paga del
  proyecto y leer un afiche cuesta cerca de US$0,01.
- **La cartelera sigue encabezada por el Movistar Arena.** De 38 eventos en
  pantalla, **9 son de esa sala** — más que ninguna otra — y otros 5 de Royal
  Center. Son publicados de antes del giro: la cola se vació pero la cartelera
  no. Se sacan con "No va" en `/admin`, que es reversible; **"Borrar" no**,
  porque su bloqueo es por `(fuente, id)` y una fuente nueva lo esquiva.
- **8 de 19 salas publicadas sin foto**: La Mecánica, La Media Torta, Parque el
  Country, Proyecto Kinder, Teatro Astor Plaza, Teatro Cafam, Teatro Colón y
  Teatro Mayor Julio Mario Santo Domingo. Se pegan como URL en `/admin` →
  Salas, con vista previa.
- **2 de 19 salas publicadas sin coordenada**: La Mecánica y Teatro Cafam. Se
  arregla pegando el punto desde Google Maps en `/admin` → Salas.
- **4 salas por aprobar**: Parque de la 93, Teatro Panorama, Ágora Bogotá
  Centro de Convenciones y Museo de Arte Moderno de Bogotá MAMBO. Ojo:
  aprobarlas mueve el denominador de las dos líneas de arriba.
- **El género: 6 de 50 publicados muestran chip.** Otros 5 tienen `category`
  pero es taxonomía de la fuente —3 "Música", 1 "Conciertos", 1 "Otro"— y
  `generoVisible` la esconde a propósito. Ninguna fuente publica género real
  salvo Rockal Live: o lo escribe Juan en `/admin` o el chip no existe.
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

- 🟠 **El lector de afiches está escrito y a medio probar.** Lo verificado de
  punta a punta es la subida al bucket —hay un evento con su afiche servido
  desde Storage— y que un POST sin sesión de admin recibe 401 o 403. **La
  extracción nunca corrió**, por el saldo. Lo que hay que mirar cuando corra no
  es si acierta el título: es **que devuelva vacío donde el afiche no dice
  nada**. Los tres casos que lo prueban son un afiche sin año, uno sin hora y
  uno de una sala que no está cargada.
- **`/admin` no se ha visto renderizado desde los cambios del 2026-09-08.**
  Pide sesión, así que `npm run capturas` —que cubre las cinco páginas
  públicas— no llega ahí. Compila, los tipos cierran y los tests pasan, pero
  este proyecto ya tuvo el mapa en negro con el CI entero en verde. Sin
  verificar: el bloque de carga de afiche, los dos campos de fecha, y que
  guardar un evento al que se llegó con `?evento=` devuelva a su ficha pública.
- **6 eventos del Movistar cuelgan solo de `visitbogota`, que ya no corre.**
  LosPetitFellas (9 oct), Kris R (23 oct), Aterciopelados (30 oct), Reykon (6
  nov), Todos Somos Ángeles Rock Fest (8 nov) y Juanes (19 nov). Recuperar
  `movistar_arena` **no los reenganchó**: el sitio de la sala publica una
  ventana de un mes y esos seis caen fuera. Se reenganchan solos cuando su
  fecha entre en la ventana; hasta entonces, si el Movistar mueve una de esas
  fechas nadie se entera. El detalle en `context/ingesta/fuentes-y-legalidad.md`.
- **Nunca se ha desplegado a Vercel.** Todo se ha verificado en local. Hacen
  falta `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
  ahora también `ANTHROPIC_API_KEY` en el proyecto de Vercel. ⚠️ El route
  handler del afiche declara `maxDuration = 60`, que es el tope del plan Hobby:
  **eso solo se prueba desplegado**, porque el límite es del entorno y no del
  código.
- **El sitio no se ha visto en un dispositivo real.** Las 30 capturas de
  `npm run capturas` cubren escritorio y móvil en los dos modos, pero son
  Chromium headless a tamaño simulado: no dicen nada de un teléfono de verdad
  ni de Safari.
- **24 publicados sin revisar** (de 50). Tienen `reviewed_at` en null y eso es
  correcto: nadie los revisó. El número baja solo a medida que Juan toca cada
  evento por otro motivo.
- **12 publicados ya pasaron de fecha** y siguen en `publicado`. No se ven —la
  cartelera filtra por `starts_at >= hoy`— así que no es un bug, pero explica
  por qué "50 publicados" y "38 en pantalla" no cuadran.
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
| Filas crudas | **113** — visitbogota 56 *(congeladas)*, royal 14, movistar 13, lourdes 9, latino 8, rockal 8, idartes 5 |
| Crudas sin clasificar | **0** |
| Canónicos | **101** — 50 publicados, **0 borradores**, 51 descartados |
| En pantalla | **29 toques, 2 fiestas, 7 festivales**, en 13 salas |
| Salas | **23** — 19 publicadas, 4 por aprobar |
| Coordenadas | **17 de 19** salas publicadas ubicadas |
| Fotos de sala | **11 de 19** |
| Afiche | **49 de 50** publicados lo tienen |
| Precio | **17 de 50** publicados |
| Género visible | **6 de 50** |
| Escena local marcada | **4 de 50** — se marca a mano y nada la calcula |
| Bloqueados | **36** `(fuente, id)` — visitbogota 26, idartes 7, movistar 3 |
| Duplicados sugeridos | **0** |
| Tests | **221 backend + 74 frontend**, verdes en local y en CI (`8048df2`) |

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

Por orden de lo que destraba más:

1. **Recargar el saldo y probar el lector de afiches.** Es lo único que
   convierte la feature más grande de la semana en algo usable, y es la vía
   principal por la que entra la escena desde que salió `visitbogota`.
2. **Desplegar a Vercel.** Nunca se ha hecho, y hay dos cosas que solo se
   prueban ahí: el tope de 60 s del route handler y el sitio en un teléfono de
   verdad.
3. **Sacar de la cartelera lo masivo que quedó publicado**, o la portada la
   sigue encabezando el Movistar.
4. **Fuentes que sí lleguen a la escena.** Quedan `ticketlive.com.co` y
   `mitaquilla.com.co` —las dos auditadas como abiertas y las dos venden para
   clubes— más `feverup.com`. Y una pista sin auditar: **Passline**, a donde
   apuntan los botones de compra de Lourdes.
5. **El directorio de la escena local**, el único módulo del MVP que no ha
   arrancado.
