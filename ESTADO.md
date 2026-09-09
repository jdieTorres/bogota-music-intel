# Estado del proyecto

Última actualización: **2026-09-09**, recontado contra la base con el MCP
después de que el directorio de la escena arrancara y Juan cargara su primer
artista.

Acá van los pendientes, las cifras y lo que quedó a medias. **`CLAUDE.md` y los
`context/*/CLAUDE.md` son reglas y criterio; este archivo es la foto de hoy.**
Si algo de acá se vuelve permanente, sube a un `CLAUDE.md`; si algo de un
`CLAUDE.md` caduca, baja acá.

---

## 1. Bloqueado en Juan (nadie más lo puede destrabar)

- 🔥 **El directorio tiene un artista.** Nicolás y los Fumadores, con 6 tracks
  y su Bandcamp. El módulo está construido y probado, pero **una plataforma que
  existe para dar a conocer la escena con un solo artista no da a conocer
  nada**, y esa parte no la puede hacer nadie más: ninguna base global sabe
  quiénes son. Se cargan en `/admin` → Artistas.
- 🔥 **Nadie ha vinculado un cartel todavía**: `event_artists` está en 0. La
  tabla existe y el formulario también, pero hasta que un evento publicado
  tenga sus artistas, **dos de las tres señales de recomendación no tienen de
  dónde salir** ("compartieron cartel" y "también ha tocado en"), y los enlaces
  entre la cartelera y la ficha del artista no existen. Es lo más barato de
  destrabar: se hace al pasar por un evento en la cola.
- 🔥 **5 de 22 salas publicadas sin coordenada, y tres son las nuevas**: Ace Of
  Spades, La Sucursal y Teatro Republik, más La Mecánica y Teatro Cafam. Juan lo
  dejó anotado para después (2026-09-09). Esas tres salas son las que traen la
  escena, y sin punto se listan bajo el mapa como "sin ubicar" en vez de
  aparecer en él. Se arregla pegando el punto desde Google Maps en `/admin` →
  Salas.
- **11 de 22 salas publicadas sin foto**, incluidas las tres nuevas — que son
  justo las que más ganarían con una, porque nadie las conoce. Se pegan como URL
  en `/admin` → Salas, con vista previa.
- **2 salas por aprobar**: Ágora Bogotá Centro de Convenciones y Museo de Arte
  Moderno de Bogotá MAMBO. Ninguna tiene eventos vigentes, así que no corre
  prisa.
- **El género: 10 de 56 publicados lo tienen**, con 7 en uso —Pop, Rock, Hip
  Hop/Rap, Popular, Reggaeton, Jazz, Vallenato—. Desde el 2026-09-08 **ninguna
  fuente lo escribe**: `generos` es columna propia (`text[]`, varios por evento)
  y la llena Juan en `/admin`. Ahora además **es la navegación del directorio**:
  los géneros del filtro salen de los eventos donde tocó cada artista, así que
  un directorio sin géneros se queda sin su único eje de exploración.
- **La escena local marcada: 3 de 56.** Mismo caso: desde que se dio de baja
  MusicBrainz nada la calcula. La marca rosa solo sale si Juan la pone.
- **La fecha de vencimiento del token de Supabase hay que anotarla.** El
  2026-09-08 Juan generó uno nuevo con escritura en Database y Migrations, y
  reemplazó al de solo lectura que vencía el 2026-12-06. Los tokens scoped
  siempre vencen y el máximo del desplegable son 90 días; **si tomó el máximo
  vence alrededor del 2026-12-07**, pero eso no se verificó. Al vencer, el MCP
  responde `Unauthorized` sin decir que caducó.

### Preguntas abiertas — hay que hacérselas a Juan, no resolverlas por cuenta propia

- **¿Entra `impeccable` como skill?** Juan la pidió el 2026-09-09 y no se
  instaló, por dos motivos que convenía que viera antes: su instalador de npm
  baja un **binario precompilado** a `~/.impeccable/bin/` del que dependen sus
  61 detectores, y su propio `DESIGN.md` empuja una estética de casa que
  **prohíbe el magenta como acento de marca** — el color que acá tiene un
  trabajo asignado. Si va, la vía es el plugin
  (`/plugin marketplace add pbakaus/impeccable`) y como consejo, nunca como
  corrector automático. `emil-design-eng` sí entró (MIT).
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

- **El formulario de tracks de `/admin` no se ha visto renderizado.** `/admin`
  pide sesión, así que `npm run capturas` no llega ahí. Compila, los tipos
  cierran y los tests pasan, pero este proyecto ya tuvo el mapa en negro con el
  CI entero en verde. Sin verificar: agregar un track pegando la dirección,
  **editarlo** (título, año, carátula), quitarlo, y la barra de acciones pegada
  al pie. Lo público del directorio sí se probó en un navegador visible con los
  datos reales de Juan.
- **El módulo del directorio no se ha visto en un teléfono de verdad**, como el
  resto del sitio. Sí se midió en Chromium a 390 px, con la cola sembrada a
  mano — el reproductor de YouTube apaisado cabe y los controles bajan a su
  propia fila —, pero eso no dice nada de un teléfono real ni de Safari.
- **`/admin` no se ha visto renderizado desde los cambios del 2026-09-08.**
  Sigue sin verificar el bloque de carga de afiche, los dos campos de fecha, y
  que guardar un evento al que se llegó con `?evento=` devuelva a su ficha
  pública.
- **El lector de afiches funciona y deja huecos.** Juan lo probó el 2026-09-08
  con saldo cargado: lee, y **los campos que el afiche no dice quedan vacíos con
  su explicación en las notas**. Queda sin ejercitar el caso extremo —un afiche
  sin año— pero el comportamiento de fondo está comprobado.
- **`latino_power` falló dos corridas seguidas y a la tercera pasó sin tocar
  nada.** Su API devolvió 200 con un cuerpo que no era JSON —una página de
  desafío de WAF—, y `.json()` murió con un mensaje mudo. **Era transitorio**,
  no un bloqueo de IP. El error ahora dice el estado, el `content-type`, el
  cuerpo y las cabeceras que delatan al WAF, así que si vuelve se diagnostica de
  un vistazo.
- **6 eventos del Movistar cuelgan solo de `visitbogota`, que ya no corre.**
  LosPetitFellas (9 oct), Kris R (23 oct), Aterciopelados (30 oct), Reykon (6
  nov), Todos Somos Ángeles Rock Fest (8 nov) y Juanes (19 nov). Recuperar
  `movistar_arena` **no los reenganchó**: el sitio de la sala publica una
  ventana de un mes y esos seis caen fuera. Se reenganchan solos cuando su
  fecha entre en la ventana; hasta entonces, si el Movistar mueve una de esas
  fechas nadie se entera. El detalle en `context/ingesta/fuentes-y-legalidad.md`.
- **Nunca se ha desplegado a Vercel.** Dejó de ser una espera y pasó a ser el
  siguiente paso — ver § 4. Hacen falta `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `ANTHROPIC_API_KEY` en el proyecto de
  Vercel. ⚠️ Y hay algo que **solo se prueba desplegado**: el route handler del
  afiche declara `maxDuration = 60`, el tope del plan Hobby, y ese límite es del
  entorno y no del código.
- **21 publicados sin revisar** (de 56). Tienen `reviewed_at` en null y eso es
  correcto: nadie los revisó. El número baja solo a medida que Juan toca cada
  evento por otro motivo.
- **12 publicados ya pasaron de fecha** y siguen en `publicado`. No se ven —la
  cartelera filtra por `starts_at >= hoy`— así que no es un bug, y con los 44
  vigentes cierran los 56. ⚠️ **Contarlos con `starts_at < now()` da 13 y está
  mal**: un show de hoy que empezó hace dos horas sigue en pantalla, porque el
  corte es el **inicio del día en Bogotá**, no el instante. El mismo cuidado que
  pide la regla dura de las horas, aplicado a una consulta de conteo.
- **Sin verificar, porque no se ve desde fuera del dashboard:** si el proyecto
  de Supabase todavía expone las **claves legacy JWT** (`anon` /
  `service_role`). Son un juego de credenciales aparte que la rotación de las
  `sb_*` del 2026-08-28 no tocó.
- ⚠️ **`.claude/settings.local.json` tiene el token de Supabase en texto
  plano.** Con escritura habilitada desde el 2026-09-08 y sin branching —esa
  base es la única copia—, vale confirmar que el archivo está en `.gitignore`.
- **Opcional:** añadir el secret `BMI_SUPABASE_PUBLISHABLE_KEY` al repo para
  que el CI prerenderice contra la base real en vez de contra placeholders.

---

## 3. Las cifras

⚠️ **Envejecen con cada corrida del cron y con cada sesión de triage:
recontarlas con una consulta, no citarlas de memoria.** Recontadas el
**2026-09-09** contra la base, con el MCP.

| | |
|---|---|
| Fuentes activas | **7** — movistar_arena, royal_center, lourdes, latino_power, rockal_live, idartes, ticketlive |
| Filas crudas | **125** — visitbogota 56 *(congeladas)*, royal 15, movistar 13, ticketlive 10, lourdes 9, latino 9, rockal 8, idartes 5 |
| Crudas sin clasificar | **0** |
| Canónicos | **110** — 56 publicados, 1 borrador, 53 descartados |
| En pantalla | **33 toques, 5 fiestas, 6 festivales**; 44 eventos vigentes en 15 salas, de las que **10 llevan pin** (las otras 5 no tienen coordenada) |
| Salas | **39 filas** — 22 publicadas, 2 por aprobar, 15 descartadas |
| Coordenadas | **17 de 22** salas publicadas ubicadas |
| Fotos de sala | **11 de 22** |
| Precio | **22 de 56** publicados |
| Género | **10 de 56** publicados, 7 géneros en uso, ninguno compuesto |
| Escena local marcada | **3 de 56** — se marca a mano y nada la calcula |
| **Directorio** | **1 artista publicado**, 6 tracks (4 de YouTube, 2 de SoundCloud), 3 con carátula |
| **Carteles vinculados** | **0** — `event_artists` está vacía |
| Bloqueados | **36** `(fuente, id)` — visitbogota 26, idartes 7, movistar 3 |
| Duplicados sugeridos | **0** |
| Tests | **239 backend + 99 frontend**, verdes en local y en CI |

Cómo leerlas sin equivocarse:

- ⚠️ **El estado de un canónico es `status`, no `published_at`.** Hay
  descartados que conservan la fecha en la que estuvieron publicados, y es
  correcto que la conserven.
- ⚠️ **"Salas 39" es el total de filas, no lo que se ve.** Hasta el 2026-09-09
  esta línea decía "24" y contaba solo publicadas más borradores: las 15
  descartadas existían y no aparecían en ningún lado. Se corrigió acá porque el
  número que engaña es el que se cita.
- ⚠️ **Las 56 filas de visitbogota están congeladas, no vivas.** La fuente salió
  del registry el 2026-09-08; sus filas quedan como registro y no se actualizan.
  Lo mismo vale para `scraped_at`, que es "cuándo se vio por primera vez" y no
  "última corrida": el upsert no lo reescribe.
- **La escena local marcada bajó de 4 a 3** entre el 2026-09-08 y el
  2026-09-09, sin que ninguna sesión la tocara: la marca la pone y la quita
  Juan en `/admin`. No hay nada que revisar; se anota para que el número no
  parezca un error la próxima vez.
- **Las fiestas y los festivales tienen `is_local = null` y eso es correcto.**
  No hay un artista de cartel a quien preguntarle.
- **Los tests frontend subieron de 69 a 99** con el directorio: lectura de
  direcciones de audio, criterio de recomendación, y el caso de fecha que
  delató un bug real (ver `context/frontend/rockola.md`).

---

## 4. El siguiente paso

**El directorio arrancó el 2026-09-09** y con él se cierra el punto 1 del orden
que Juan fijó ese mismo día. Lo que queda, en el orden que él decidió:

1. 🎯 **Desplegar a Vercel.** Era el punto 2 y pasa a ser el primero. Se
   pospuso "mientras el producto cambiara de forma", y esa razón se agotó: el
   MVP tiene sus tres módulos. **Nada de lo construido lo ha visto nadie más
   que Juan**, y hay dos cosas que **solo se prueban ahí**: el tope de 60 s del
   route handler del afiche y el sitio en un teléfono real. Hacen falta
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
   `ANTHROPIC_API_KEY` en Vercel.

   ⚠️ Antes de desplegar conviene resolver lo de arriba que se nota de
   inmediato: **el directorio con un solo artista** y **los carteles sin
   vincular**. Las dos son carga manual, no código.

2. **Más fuentes.** `mitaquilla.com.co` quedó confirmada abierta el 2026-09-08 —
   con el User-Agent correcto, ver `context/ingesta/fuentes-y-legalidad.md`— y
   `feverup.com` sigue sin explorar. Passline queda fuera: está detrás de una
   sala de espera virtual, y meter un cron ahí ocuparía puestos en una cola de
   compra.

3. **La pasada de identidad de la Fase 6.** El nombre definitivo y el look &
   feel final. Juan abrió el 2026-09-09 la vía de trabajar diseño en Figma con
   su MCP (plan gratis, servidor remoto): queda montada para esa pasada, sin
   usar todavía.
