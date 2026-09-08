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

**Al 2026-09-07 `gh` todavía no está instalado en la máquina de Juan.** Si
`/commitear` hace falta que verifique el CI sin abrir el navegador, el paso es
instalarlo, no volver a montar este MCP.
