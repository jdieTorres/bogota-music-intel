# Skills de terceros

Ninguna de estas es del proyecto. Salvo graphify, todas se copiaron a mano: para
actualizarlas, volver a bajar el `SKILL.md` del origen.

| Skill | Origen | Licencia |
|---|---|---|
| `taste-skill/` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT (`LICENSE.txt`) |
| `web-design-guidelines/` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | el repo no trae licencia |
| `ponytail/` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | MIT (`LICENSE.txt`) |
| `graphify/` | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify), rama `v8` | Apache-2.0 |

A `taste-skill` se le cambió el `name` del frontmatter (`design-taste-frontend` →
`taste-skill`) para que coincida con la carpeta. Nada más está editado.

## graphify necesita un paquete de Python

El `SKILL.md` lo escribe el propio CLI, que vive en un venv aparte para no
mezclarse con el de `services/api`. La carpeta versionada no sirve sola: en otra
máquina hay que rehacer estos dos pasos.

```
~/.local/graphify-venv/Scripts/python.exe -m pip install -U "graphifyy[sql]"
graphify install --project
```

El paquete en PyPI es `graphifyy`, con doble `y`. El extra `[sql]` es lo que hace
que las migraciones de `supabase/` entren al grafo. En el PATH queda
`~/.local/bin/graphify.cmd`, que apunta al venv.

⚠️ `graphify install --project` reescribe una sección en el `CLAUDE.md` raíz y
unos hooks en `.claude/settings.json`. No es idempotente: hay que volver a
sacarlos.
