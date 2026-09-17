# Infraestructura — base de datos, CI y despliegue

## El cron no corre a la hora que dice

`scraper.yml` declara `0 14 * * *` —las 9:00 de Bogotá— y **GitHub lo dispara
con retraso**: medido sobre doce corridas hasta el 2026-09-15, salieron entre
las 16:32 y las 19:01 UTC, o sea entre las 11:32 a. m. y las 2:01 p. m. de acá.
Es el comportamiento normal de los crons de Actions, que se encolan según la
carga de la plataforma.

Sirve para no diagnosticar de más: **si a las 9:30 no hay corrida del día, no
está roto** — todavía no le ha tocado el turno.

## Stack

- **Base de datos:** Supabase (Postgres + Auth + Storage). Free tier: 500 MB,
  pausa tras una semana de inactividad (se reactiva con el primer request).
- **Backend:** Python + FastAPI, paquete `bogota_music_intel` en
  `services/api/`. Es la capa de ingesta, no el camino de lectura del
  frontend.
- **Ingesta programada:** GitHub Actions (cron), respetando `robots.txt`.
- **Hosting del frontend:** Vercel, plan Hobby. ⚠️ El plan Hobby es
  explícitamente para uso **no comercial/personal**. Si el proyecto monetiza,
  hay que migrar a Pro o a otro hosting.
- **Geocodificación:** Nominatim (1 req/s, User-Agent identificable), paso
  aparte del scraping: `python -m bogota_music_intel.geocode_cli`.

**Descartado y no volver a evaluar:** Railway como host de backend — ya no
tiene tier gratis real (USD 5 de crédito por 30 días, luego USD 1/mes sin
acumular). Google Maps como proveedor de tiles, por costo.

## Migraciones — las aplica Juan a mano

⚠️ **Ninguna sesión puede aplicar una migración por su cuenta.** El proyecto
no tiene CLI de Supabase ni cadena de conexión a Postgres —`services/api/.env`
solo trae la URL REST y la service role key, y PostgREST no ejecuta DDL—. Se
aplican en el **SQL Editor de Supabase**.

Quien escriba una migración tiene que **entregarla y pedirla**, no darla por
corrida. Anotar en `ESTADO.md` que quedó sin aplicar.

⚠️ **Y para saber si una migración ya se aplicó hay que mirar el esquema, no
la lista de migraciones.** `list_migrations` del MCP lee
`supabase_migrations.schema_migrations`, que la llena el CLI de Supabase — y
acá no se usa: pegar el SQL a mano no deja rastro ahí. La tabla está vacía y
seguirá vacía, así que su respuesta **no significa "ninguna aplicada"**. Lo
que contesta de verdad es `list_tables` o un `select` contra el objeto que la
migración crea o borra: así se descubrió el 2026-09-07 que la migración de
baja del radar sí estaba aplicada mientras `ESTADO.md` la daba por pendiente.

## CI — dos workflows, y uno no dice nada del otro

- **`Scraper cron`** — corre la ingesta contra Supabase de verdad. Su verde
  prueba que los secrets sirven: `scrape_cli` devuelve 1 si falla cualquier
  fuente.
- **`Tests`** — los tests de backend y de frontend, `ruff`, `tsc`, `eslint`,
  `npm run lint` y build. Cuántos son, en `ESTADO.md`. Corre en **todo push**
  y en los PR desde el 2026-09-16: hasta ese día escuchaba `push` solo en
  `main`, y como las ramas no llevan PR, **una rama no disparaba nada**. El
  porqué completo está junto a la política de ramas, en el `CLAUDE.md` raíz.

⚠️ **Antes de dar el CI por bueno, mirar los dos.** `Tests` estuvo en rojo tres
días sin que nadie lo notara, precisamente porque `Scraper cron` estaba verde
y era el que se venía mirando. Se agrupan por `name`:
`gh run list --repo jdieTorres/bogota-music-intel --limit 6`.

**`gh` está instalado y autenticado desde el 2026-09-16**, así que el sondeo
dejó de ser un recurso que racionar: 5.000 peticiones por hora contra las 60
de la API anónima, que se agotaron ese mismo día verificando el séptimo commit.
Con él, `gh run view <id> --log-failed` trae el log del paso que falló —lo que
antes había que abrir en el navegador de Juan, porque `/actions/jobs/<id>/logs`
responde 403 sin credenciales aunque el repo sea público— y
`gh run watch <id> --exit-status` espera a que la corrida termine en vez de
sondear a mano. ⚠️ Todavía no está en el `PATH` de toda sesión: si no se
encuentra, va por su ruta completa, `"/c/Program Files/GitHub CLI/gh.exe"`.

⚠️ **El cron declara `0 14 * * *` (9:00 en Bogotá) y GitHub retrasa los
`schedule` bastante** — ha corrido a las 23:35Z. No es un error de
configuración, pero **no cuentes con la hora**.

## Secrets

| Secret | Dónde vive |
|---|---|
| `BMI_SUPABASE_URL` | `services/api/.env` + secret del repo |
| `BMI_SUPABASE_SERVICE_ROLE_KEY` | `services/api/.env` + secret del repo |
| `SUPABASE_ACCESS_TOKEN` | `.claude/settings.local.json`, solo local |

Son claves de **formato nuevo** (`sb_secret_…` / `sb_publishable_…`), no los
JWT viejos: se revocan una por una desde Project Settings → API Keys sin tocar
el JWT secret del proyecto, y creando la nueva antes de borrar la vieja se
rota sin ventana de caída.

`services/api/.env` está en `.gitignore` desde el principio y nunca estuvo
rastreado. **La publishable del frontend no se rota**: va en el bundle del
navegador por diseño y RLS solo le permite SELECT.

`SUPABASE_ACCESS_TOKEN` es distinto: no lo usa ni la ingesta ni el frontend,
sino el servidor MCP que deja a la sesión consultar la base. Es un token
**scoped** (`sbp_fc…`) limitado al proyecto, con cuatro permisos y todos de
lectura: **Database**, **Migrations**, **Advisors** y **Project Settings**.
Database es el que importa —`list_tables` y `execute_sql` cuelgan de él— y es
el que se olvida, porque la sección del diálogo se llama igual que el permiso.

Los tokens scoped **siempre vencen**: el máximo del desplegable es 90 días. Al
vencer, el MCP responde `Unauthorized` sin decir que caducó, así que la fecha
va en `ESTADO.md`. Se regenera en Account → Access Tokens, se pega en
`.claude/settings.local.json` y **hay que reiniciar Claude Code**: el servidor
lee la variable al arrancar.

Que el token sirve se comprueba llamando a la Management API, no reiniciando a
ver qué pasa — un 403 dice exactamente qué permiso falta:

```bash
curl -s -o /dev/null -w "%{http_code}
" -H "Authorization: Bearer $TOKEN"   https://api.supabase.com/v1/projects/<ref>/types/typescript
```

## Deploy

Vercel corre `npm run build`, así que el `prebuild` que copia el worker de
MapLibre se dispara solo. Hacen falta las variables
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el
proyecto de Vercel.

### Si un despliegue terminó, se le pregunta a GitHub — no al sitio

⚠️ **Nunca sondear el sitio público en un bucle para saber si ya salió el
despliegue.** El 2026-09-16 se hicieron 15 peticiones seguidas sin pausa a
`bogota-music-intel.vercel.app` esperando ver el cambio, y **la protección
antibots de Vercel respondió con un «Security Checkpoint»**: a partir de ahí el
sitio contestó 403 a todo lo automático —`curl` y Chromium headless por igual,
este último con «Código 21» al no poder resolver el desafío— y **quedó sin
poder verificarse justo cuando había que verificarlo**. Un navegador de verdad
lo resuelve solo; una sesión como esta, no.

La vía correcta estaba a mano todo el tiempo, porque **Vercel publica cada
despliegue como un Deployment de GitHub**:

```
gh api repos/jdieTorres/bogota-music-intel/deployments \
  --jq '.[] | "\(.id) \(.sha) \(.environment)"'
gh api repos/jdieTorres/bogota-music-intel/deployments/<id>/statuses \
  --jq '.[] | "\(.state) | \(.environment_url)"'
```

Eso da el estado (`success`) y la URL, sin tocar el sitio. ⚠️ **El `ref` de esos
deployments es el SHA y no el nombre de la rama**, así que filtrar por rama no
devuelve nada y parece que el despliegue no existe.

### Las previews piden sesión de Vercel

**La URL de preview de una rama no se puede abrir desde acá**: responde con la
pantalla de Vercel Authentication, no con el sitio. La preview es para que la
mire Juan, que tiene la sesión. Lo que sí se puede verificar de una rama sin
publicar es lo de siempre: `npm run capturas` en local, que corre sobre
Chromium headless (`context/look-and-feel/capturas.md`).

Y ojo con la URL: el alias estable por rama
(`…-git-<rama>-<scope>.vercel.app`) **no siempre resuelve** —con un nombre de
rama largo no existe—, mientras que la `environment_url` del deployment
siempre es la buena.

## Convenciones de nombres

- Repo: `bogota-music-intel`
- Paquete backend: `bogota_music_intel`
- Frontend: `apps/web` dentro del monorepo
- Variables de entorno: prefijo `BOGOTA_MUSIC_INTEL_` o `bmi_`
