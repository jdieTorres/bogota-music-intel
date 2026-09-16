---
name: commitear
description: Commitea y pushea el trabajo de la sesión con el estilo de mensaje de este proyecto, partiéndolo en varios commits si el cambio tiene asuntos distintos, y verifica el CI después. Usar cuando Juan pida commitear, subir, pushear o guardar los cambios.
---

# Commitear y pushear

Deja el trabajo subido con un mensaje que sirva dentro de tres meses. **El
mensaje no describe el diff —`git show` ya lo hace— sino qué cambió de sentido
y por qué.** Es el mismo criterio que la documentación del proyecto: registrar
lo que no se puede deducir leyendo el código.

Ejecuta esto de corrido. No preguntes por dónde empezar: si Juan invocó esto,
ya decidió que se sube.

## 1. Mirar qué hay antes de escribir nada

```
git status --short
git diff --stat HEAD
git log --oneline -5
```

- **Lee el diff de verdad**, no solo los nombres de archivo. El mensaje sale de
  entender el cambio, y un diff que no entiendes no lo puedes resumir.
- **Revisa que no se cuele nada que no va**: `services/api/.env` (está en
  `.gitignore` y nunca estuvo rastreado — que siga así), claves, archivos de
  scratchpad, `__pycache__`, salidas de pruebas.
- Si hay cambios que **no son tuyos** —de una sesión anterior o de Juan—,
  dilo antes de incluirlos. No los subas en silencio dentro de tu commit.

## 2. Decidir si es uno o varios commits

**Un commit = un asunto.** Si el trabajo de la sesión tiene dos cosas que se
explican por separado, van en dos commits, aunque se hayan hecho seguidas.

La señal es el mensaje: **si al escribirlo necesitas un "y además" que no tiene
nada que ver con lo anterior, son dos.** Ejemplo real del 2026-09-01: la
reestructuración del contexto y el cierre del pendiente del CI se subieron
aparte, para que el cierre del pendiente no quedara enterrado.

Lo que **no** justifica partir: tocar muchos archivos, o tocar frontend y
backend a la vez. Un cambio que atraviesa capas sigue siendo un cambio.

Para partir, `git add` por archivo o por ruta. **Nunca `git add -A` cuando vas
a hacer más de un commit.**

## 3. Escribir el mensaje

### El asunto

En **español**, una línea, sin punto final, sin prefijos ni etiquetas de
alcance (nada de `feat:` ni `[frontend]`). Dos formas, las dos en uso:

- **Verbo en presente, tercera persona**: "Cierra el pendiente del CI…",
  "Filtra mejor visitbogota…", "Permite las imágenes de visitbogota…".
- **Una frase declarativa sobre lo que ahora pasa**: "Los estados vacíos dejan
  de nombrar archivos del repo", "El género se puede escribir, y sale al lado
  del nombre en la cartelera".

Que diga **qué cambió para quien usa el sistema**, no qué archivo tocaste.
"Actualiza documentación" y "arregla bug" no dicen nada.

### El cuerpo

Párrafos en español, con el mismo tono que `CLAUDE.md`. Lo que tiene que
contestar, en el orden que le sirva a cada cambio:

- **Por qué se hizo**, sobre todo si no es obvio. Si lo notó Juan, dilo:
  "Lo notó Juan: /festivales decía…".
- **Qué cambió de sentido, no solo de valor.** Una cifra que se mueve casi
  nunca vale un párrafo; una cifra que pasa a significar otra cosa, sí.
- **Qué se cierra y qué se abre.** Un commit que resuelve un pendiente y deja
  otro tiene que decir los dos.
- **Lo que se probó y falló**, si condiciona el resultado.
- **Qué queda sin verificar.** Distingue "los tests pasan" de "lo miré
  funcionando". Si algo solo corrió en local, el mensaje lo dice.
- **Una pregunta para Juan**, si el cambio dejó una decisión abierta que no te
  corresponde tomar.

Agrupa con encabezados en prosa cuando ayude —"Lo que se cierra:", "Lo que se
abre, y es lo más importante de esta pasada:"— y usa viñetas solo dentro de
esos grupos.

**Lo que no va en el cuerpo:** la lista de archivos tocados, el recuento de
líneas, ni "se agregaron tests" si los tests son la parte obvia del cambio.

### Los trailers

Van siempre al final, separados por una línea en blanco:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: <la URL de sesión de este entorno, no la de un commit viejo>
```

⚠️ **La URL de sesión cambia por sesión.** Sácala del entorno actual; copiarla
de `git log` la deja apuntando a una conversación que no es esta.

## 4. Commitear

```
git -c core.safecrlf=false commit -F - <<'MSG'
…
MSG
```

- **`-F -` con heredoc**, no `-m` repetido: el cuerpo tiene párrafos y saltos
  de línea que `-m` maltrata.
- **`-c core.safecrlf=false`** porque el repo está en Windows con conversión de
  finales de línea y `git` aborta con `LF will be replaced by CRLF` en archivos
  nuevos. Es ruido del entorno, no un problema del cambio.
- **No `--amend`** sobre un commit ya pusheado. Si hace falta corregir, va un
  commit nuevo.
- **No `--no-verify`.** Si un hook falla, se arregla la causa.

## 5. Pushear

⚠️ **`main` es el sitio público desde el 2026-09-16**: un push ahí despliega a
producción en menos de un minuto. Antes de empujar, mira si este trabajo debía
ir en rama — el criterio completo está en el `CLAUDE.md` raíz, y en corto es
**si hace falta verlo para saber si quedó bien**: UI, scrapers, clasificación y
migraciones van por rama, y su Preview Deployment es dónde comprobarlo;
documentación, comentarios, tests y arreglos de algo ya roto en producción van
directo.

**No abras una rama por tu cuenta ni muevas a una rama un trabajo que ya está
hecho sobre `main`**: si crees que correspondía rama y no se abrió, dilo antes
de empujar y que decida Juan. Las ramas no llevan PR — son de una persona, y el
preview y el CI ya dicen lo que un PR diría.

```
git log --oneline origin/main..HEAD    # qué va a subir, incluidos commits viejos
git push origin main                   # o `git push -u origin <rama>` si es rama
```

⚠️ **Mira qué va a subir antes de pushear.** Es normal que arrastres commits de
sesiones anteriores que quedaron sin subir — el 2026-09-01 subieron 6 de golpe.
Si aparecen commits que no reconoces, dilo antes de empujarlos.

**Nunca `--force`.**

## 6. Verificar el CI — esto no es opcional

Pushear sin mirar el resultado es la mitad del trabajo. El proyecto ya tuvo el
workflow `Tests` en rojo tres días sin que nadie se enterara.

**Con `gh`, instalado y autenticado el 2026-09-16:**

```
gh run list --repo jdieTorres/bogota-music-intel --limit 6
gh run view <id> --log-failed        # cuando algo salga rojo
```

Da en una línea lo que el `curl` daba en veinte: estado, workflow, rama,
duración y sha. ⚠️ **Todavía no está en el `PATH` de toda sesión**; si `gh` no
se encuentra, va por su ruta completa —`"/c/Program Files/GitHub CLI/gh.exe"`—
o en una terminal abierta después de instalarlo.

⚠️ **Usa `gh` y no `curl` a la API pública, y el motivo no es la comodidad.**
Sin token son **60 peticiones por hora** y se acaban: pasó el 2026-09-16 con
siete commits en una sesión, y el límite saltó justo al verificar el último.
Autenticado son 5.000, así que el sondeo deja de ser un recurso que racionar.
El `curl` sigue sirviendo si `gh` no está a mano, pero con su límite puesto.

- **Espera a que el run termine antes de cantar el resultado.** El build de
  `Tests` tarda alrededor de 50 segundos; preguntar más seguido no lo acelera.
- **Nunca des el CI por bueno porque la consulta falló.** Un 403 o un error de
  red no son un verde: son no haber mirado. Si no se puede consultar, la salida
  es `https://github.com/jdieTorres/bogota-music-intel/actions` en el navegador
  y decirlo.
- **Espera a que termine** el run del commit que acabas de subir, en vez de
  reportar `in_progress`. Si tarda, di que quedó corriendo — no lo des por
  verde.
- ⚠️ **Mira los dos workflows.** `Tests` y `Scraper cron` son distintos y uno
  no dice nada del otro. Agrupa por `name`.
- Si algo queda **rojo**, mira los pasos del job
  (`/actions/runs/<id>/jobs`) y di cuál falló, con el paso concreto. No
  cierres la corrida diciendo "se subió" a secas.
- Si el push **ejercitó por primera vez** un paso o una ruta que estaba anotada
  como no probada, **dilo**: eso cierra un pendiente de `ESTADO.md` y suele
  valer su propio commit de documentación.

## 7. Cerrar

En la respuesta a Juan:

- Cuántos commits se subieron y qué asunto tiene cada uno.
- El resultado del CI, con el workflow y el commit concretos.
- **Lo que quedó sin verificar**, si algo quedó.
- Si el push cerró un pendiente de `ESTADO.md`, dilo — y si `ESTADO.md` no lo
  refleja todavía, ofrece actualizarlo (o corre `/actualizar-estado` si el
  cambio fue grande).
