---
name: commitear
description: Commitea y pushea el trabajo de la sesión con el estilo de mensaje de este proyecto, partiéndolo en varios commits si el cambio tiene asuntos distintos, y verifica el CI después. Usar cuando Juan pida commitear, subir, pushear o guardar los cambios.
---

# Commitear y pushear

Deja el trabajo subido con un mensaje que sirva dentro de tres meses. **El
mensaje no describe el diff —`git show` ya lo hace— sino qué cambió de sentido
y por qué.** Es el mismo criterio que la documentación del proyecto: registrar
lo que no se puede deducir leyendo el código.

Ejecutá esto de corrido. No preguntes por dónde empezar: si Juan invocó esto,
ya decidió que se sube.

## 1. Mirar qué hay antes de escribir nada

```
git status --short
git diff --stat HEAD
git log --oneline -5
```

- **Leé el diff de verdad**, no solo los nombres de archivo. El mensaje sale de
  entender el cambio, y un diff que no entendés no lo podés resumir.
- **Revisá que no se cuele nada que no va**: `services/api/.env` (está en
  `.gitignore` y nunca estuvo rastreado — que siga así), claves, archivos de
  scratchpad, `__pycache__`, salidas de pruebas.
- Si hay cambios que **no son tuyos** —de una sesión anterior o de Juan—,
  decilo antes de incluirlos. No los subas en silencio dentro de tu commit.

## 2. Decidir si es uno o varios commits

**Un commit = un asunto.** Si el trabajo de la sesión tiene dos cosas que se
explican por separado, van en dos commits, aunque se hayan hecho seguidas.

La señal es el mensaje: **si al escribirlo necesitás un "y además" que no tiene
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

- **Por qué se hizo**, sobre todo si no es obvio. Si lo notó Juan, decilo:
  "Lo notó Juan: /festivales decía…".
- **Qué cambió de sentido, no solo de valor.** Una cifra que se mueve casi
  nunca vale un párrafo; una cifra que pasa a significar otra cosa, sí.
- **Qué se cierra y qué se abre.** Un commit que resuelve un pendiente y deja
  otro tiene que decir los dos.
- **Lo que se probó y falló**, si condiciona el resultado.
- **Qué queda sin verificar.** Distinguí "los tests pasan" de "lo miré
  funcionando". Si algo solo corrió en local, el mensaje lo dice.
- **Una pregunta para Juan**, si el cambio dejó una decisión abierta que no te
  corresponde tomar.

Agrupá con encabezados en prosa cuando ayude —"Lo que se cierra:", "Lo que se
abre, y es lo más importante de esta pasada:"— y usá viñetas solo dentro de
esos grupos.

**Lo que no va en el cuerpo:** la lista de archivos tocados, el recuento de
líneas, ni "se agregaron tests" si los tests son la parte obvia del cambio.

### Los trailers

Van siempre al final, separados por una línea en blanco:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: <la URL de sesión de este entorno, no la de un commit viejo>
```

⚠️ **La URL de sesión cambia por sesión.** Sacala del entorno actual; copiarla
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

Este proyecto trabaja **directo sobre `main`**, sin ramas ni PRs. No abras una
rama por tu cuenta: no es el flujo acá.

```
git log --oneline origin/main..HEAD    # qué va a subir, incluidos commits viejos
git push origin main
```

⚠️ **Mirá qué va a subir antes de pushear.** Es normal que arrastres commits de
sesiones anteriores que quedaron sin subir — el 2026-09-01 subieron 6 de golpe.
Si aparecen commits que no reconocés, decilo antes de empujarlos.

**Nunca `--force`.**

## 6. Verificar el CI — esto no es opcional

Pushear sin mirar el resultado es la mitad del trabajo. El proyecto ya tuvo el
workflow `Tests` en rojo tres días sin que nadie se enterara.

```
curl -s "https://api.github.com/repos/jdieTorres/bogota-music-intel/actions/runs?per_page=10"
```

(el repo es público, no hace falta token; `gh` no está instalado en esta
máquina)

- **Esperá a que termine** el run del commit que acabás de subir, en vez de
  reportar `in_progress`. Si tarda, decí que quedó corriendo — no lo des por
  verde.
- ⚠️ **Mirá los dos workflows.** `Tests` y `Scraper cron` son distintos y uno
  no dice nada del otro. Agrupá por `name`.
- Si algo queda **rojo**, mirá los pasos del job
  (`/actions/runs/<id>/jobs`) y decí cuál falló, con el paso concreto. No
  cierres la corrida diciendo "se subió" a secas.
- Si el push **ejercitó por primera vez** un paso o una ruta que estaba anotada
  como no probada, **decilo**: eso cierra un pendiente de `ESTADO.md` y suele
  valer su propio commit de documentación.

## 7. Cerrar

En la respuesta a Juan:

- Cuántos commits se subieron y qué asunto tiene cada uno.
- El resultado del CI, con el workflow y el commit concretos.
- **Lo que quedó sin verificar**, si algo quedó.
- Si el push cerró un pendiente de `ESTADO.md`, decilo — y si `ESTADO.md` no lo
  refleja todavía, ofrecé actualizarlo (o corré `/actualizar-estado` si el
  cambio fue grande).
