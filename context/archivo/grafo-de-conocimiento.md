# El grafo de conocimiento (graphify)

Instalado el 2026-09-07 y sacado el mismo día, después de medirlo. Se evaluó
como herramienta para reducir el consumo de tokens: en vez de barrer el repo
con `grep`, consultarlo como grafo.

## Qué era

La skill `/graphify` ([Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify),
rama `v8`, Apache-2.0) más el paquete de PyPI `graphifyy` en un venv aparte
(`~/.local/graphify-venv`). Indexaba el repo y escribía `graphify-out/`:
`graph.json` (1,5 MB), `graph.html`, `GRAPH_REPORT.md`, un `manifest.json` y
una caché.

## Por qué se sacó

**Costó 292.666 tokens de entrada en su única corrida —146 archivos— y no
devolvió ninguno.** Tres razones, en orden de peso:

- **El problema que venía a resolver no existe.** El `/context` del 2026-09-07
  midió 55k de 1m de ventana: **6 % usado, 90,7 % libre**. Más de la mitad de
  esos 55k son esquemas de herramientas del harness, que no dependen de
  nosotros. Todas las skills juntas pesaban 3,6k (0,4 %), y `graphify` ~120
  tokens. No había presión de contexto que aliviar.
- **No se estaba usando.** `graphify install --project` deja unos hooks en
  `.claude/settings.json` que son los que lo disparan solos. Ese archivo se
  revirtió porque el instalador no es idempotente y también reescribía el
  `CLAUDE.md` raíz. Sin los hooks, el grafo era un archivo que nadie abría.
- **Nada avisaba cuando quedaba viejo.** El grafo se desactualiza con cada
  commit y hay que correr `--update` a mano. Es el patrón que las reglas duras
  marcan como caro: una lista que se mantiene a mano necesita algo que avise
  cuando le falta una entrada, y acá no había nada.

Para un repo de 146 archivos, `grep` y `find` alcanzan.

## Qué se borró

`.claude/skills/graphify/` (el `SKILL.md` de 44 KB y sus 8 `references/`),
`graphify-out/` —que estaba en `.gitignore`, así que nunca entró a git— y las
menciones en el `CLAUDE.md` raíz y en `.claude/skills/ORIGEN.md`.

Fuera del repo queda el venv `~/.local/graphify-venv` y el `graphify.cmd` del
PATH: si no se van a usar, se borran a mano.

## La lección que sí sirve

Antes de instalar algo que promete ahorrar tokens, **medir con `/context`**.
Acá la sospecha era que las capturas del navegador eran el rubro grande, y la
medición dijo que el gasto es fijo y del harness. Es la regla dura de las APIs
aplicada al propio entorno: preguntarle al sistema en vez de suponer.
