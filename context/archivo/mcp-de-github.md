# El MCP de GitHub — evaluado y sacado el 2026-09-07

Estuvo en `.mcp.json` como servidor HTTP apuntando a
`https://api.githubcopilot.com/mcp/`. Nunca llegó a autenticar.

## Por qué no autenticó

Al intentar el login desde `/mcp`:

```
SDK auth failed: Incompatible auth server: does not support dynamic client registration
```

No es un error de configuración. El servidor de GitHub publica OAuth pero no
implementa **dynamic client registration** (RFC 7591), que es como el cliente
se registra solo la primera vez. Sin eso el flujo de `/mcp` no tiene forma de
obtener un `client_id`, y no hay reintento que lo arregle.

Se puede saltear el OAuth pasándole un PAT a mano en un header
`Authorization: Bearer …`. Funciona, pero significa un token clásico con
permisos amplios (`repo`, `workflow`) guardado en la máquina.

## Por qué no se hizo eso

Porque el MCP no aportaba sobre `gh`. Su valor real está en los PRs y los
issues, y **este proyecto trabaja directo sobre `main`**, sin ramas ni PRs
(regla del `CLAUDE.md` raíz). Lo único que se le iba a pedir era mirar los dos
workflows del CI, que es la mitad que `/commitear` verifica — y para eso
alcanza:

```
gh run list --workflow=tests.yml --limit=5
gh run view <id> --log-failed
```

`gh` autentica con `gh auth login` y guarda el token en el credential manager
del sistema, no en un archivo del repo.

## Al 2026-09-16: la premisa cambió a medias, la conclusión no

Dos cosas de arriba dejaron de ser exactas, y conviene que quien lea esto no las
dé por ciertas:

- **Ya hay ramas.** Desde que el sitio está desplegado, lo que toca la UI o los
  datos va por rama con su Preview Deployment (`CLAUDE.md` raíz). **Pero sigue
  sin haber PRs**, que es donde estaba el valor del MCP, así que la conclusión
  se mantiene entera.
- **`gh` ya está instalado**: v2.101.0, por `winget install GitHub.cli`, y
  autenticado por navegador con el token en el keyring de Windows. Esta nota
  decía el 2026-09-07 que ese era el paso si verificar el CI llegaba a estorbar,
  y es exactamente lo que pasó.

**Lo que lo forzó no fueron los PRs sino la cuota.** La API pública da 60
peticiones por hora sin token y el 2026-09-16 se agotaron verificando el CI de
siete commits en una sesión. Autenticado son 5.000 — medido ese día: 5000
contra 0 de 60 al mismo tiempo—. `/commitear` pasó a usar `gh run list`.

Así que la decisión de no montar este MCP no solo sigue en pie: **se reforzó**.
El problema era la cuota, no la falta de una herramienta, y la herramienta que
lo resuelve ya estaba nombrada acá.
