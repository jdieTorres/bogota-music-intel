# Infraestructura — base de datos, CI y despliegue

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

## CI — dos workflows, y uno no dice nada del otro

- **`Scraper cron`** — corre la ingesta contra Supabase de verdad. Su verde
  prueba que los secrets sirven: `scrape_cli` devuelve 1 si falla cualquier
  fuente.
- **`Tests`** — 249 tests de backend y 42 de frontend, `ruff`, `tsc`,
  `eslint`, `npm run lint` y build.

⚠️ **Antes de dar el CI por bueno, mirar los dos.** `Tests` estuvo en rojo tres
días sin que nadie lo notara, precisamente porque `Scraper cron` estaba verde
y era el que se venía mirando. Sin token:
`curl -s "https://api.github.com/repos/jdieTorres/bogota-music-intel/actions/runs?per_page=20"`
y agrupar por `name`. (`gh` no está instalado en esta máquina.)

⚠️ **El cron declara `0 14 * * *` (9:00 en Bogotá) y GitHub retrasa los
`schedule` bastante** — ha corrido a las 23:35Z. No es un error de
configuración, pero **no cuentes con la hora**.

## Secrets

| Secret | Dónde vive |
|---|---|
| `BMI_SUPABASE_URL` | `services/api/.env` + secret del repo |
| `BMI_SUPABASE_SERVICE_ROLE_KEY` | `services/api/.env` + secret del repo |

Son claves de **formato nuevo** (`sb_secret_…` / `sb_publishable_…`), no los
JWT viejos: se revocan una por una desde Project Settings → API Keys sin tocar
el JWT secret del proyecto, y creando la nueva antes de borrar la vieja se
rota sin ventana de caída.

`services/api/.env` está en `.gitignore` desde el principio y nunca estuvo
rastreado. **La publishable del frontend no se rota**: va en el bundle del
navegador por diseño y RLS solo le permite SELECT.

## Deploy

Vercel corre `npm run build`, así que el `prebuild` que copia el worker de
MapLibre se dispara solo. Hacen falta las variables
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el
proyecto de Vercel.

## Convenciones de nombres

- Repo: `bogota-music-intel`
- Paquete backend: `bogota_music_intel`
- Frontend: `apps/web` dentro del monorepo
- Variables de entorno: prefijo `BOGOTA_MUSIC_INTEL_` o `bmi_`
