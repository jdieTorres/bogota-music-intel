# Skills de terceros

Ninguna de estas es del proyecto: todas se copiaron a mano, y para actualizarlas
hay que volver a bajar el `SKILL.md` del origen.

| Skill | Origen | Licencia |
|---|---|---|
| `taste-skill/` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT (`LICENSE.txt`) |
| `web-design-guidelines/` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | el repo no trae licencia |
| `ponytail/` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | MIT (`LICENSE.txt`) |
| `emil-design-eng/` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | MIT (`LICENSE.txt`) |
| `impeccable/` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) v4.3.1 | Apache 2.0 |

A `taste-skill` se le cambió el `name` del frontmatter (`design-taste-frontend` →
`taste-skill`) para que coincida con la carpeta. Nada más está editado.

## `impeccable` es la excepción: no se copió a mano

Se instaló con `npx impeccable install --project --no-hooks` el 2026-09-15, y
se actualiza con `npx impeccable update`. Tres cosas que conviene saber antes
de tocarla:

- **Sus 61 detectores dependen de un binario de 15 MB por plataforma**, que el
  instalador deja en `scripts/bin/`. Está en `.gitignore`: lo que se versiona
  es el texto, que dice qué reglas se están aplicando. Si falta, el propio
  lanzador lo vuelve a bajar.
- **Va sin hooks a propósito.** Con `--no-hooks` no corre solo después de cada
  edición: se invoca cuando se quiere consejo. Es la condición con la que
  entró.
- ⚠️ **Su `DESIGN.md` de casa prohíbe el magenta como acento de marca**, que
  acá tiene un trabajo asignado —la marca de escena local— con una sola
  excepción documentada. Sus reglas se leen como opinión, no como corrector:
  lo primero que marcaría es justo eso.

La instalación también escribe una copia para GitHub Copilot en `.github/`.
Se borró: son otros 17 MB y este proyecto no usa Copilot. Si se vuelve a
correr el instalador, vuelve a aparecer.
