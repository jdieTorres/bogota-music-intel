-- El artista pasa a existir como entidad (2026-09-09).
--
-- Hasta hoy no existía en ninguna capa: lo único que había era el booleano
-- `is_local` sobre el evento, y antes de eso una lista en git. El directorio
-- de la escena —módulo 3 del MVP, el único sin arrancar— necesita la tabla.
--
-- **La forma de moderación se copia de `venues`**, no se inventa otra: mismos
-- tres estados, mismo `reviewed_at`, mismas cuatro políticas. La diferencia es
-- que acá no hay scraper que inserte: **ninguna API conoce al artista local
-- emergente** (cinco probadas, búsqueda cerrada en
-- `context/archivo/apis-de-musica.md`), así que todas las filas nacen del
-- formulario de /admin. Por eso la evidencia es obligatoria para publicar y no
-- solo para el `origin = 'manual'` como en los eventos: acá todo es manual.
--
-- ⚠️ **No lleva columna `es_local`, y es a propósito.** Estar publicado en el
-- directorio *es* el juicio editorial de que el artista es de la escena. Una
-- columna aparte repetiría el error que costó la baja de MusicBrainz: un hecho
-- registrable disfrazado de criterio editorial. `origen_ciudad` y
-- `origen_pais` sí son hechos —por eso exigen evidencia— y no deciden nada:
-- la banda de Lima que toca en Latino Power es escena, y la sigue decidiendo
-- una persona en la cola.

create table if not exists artists (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    nombre text not null,

    -- Hechos, no criterio. Van con evidencia o no van.
    origen_ciudad text,
    origen_pais text,

    -- Las notas de contratapa: es el material propio del proyecto, lo que lo
    -- separa de agregar lo que otros publican.
    bio text,
    foto_url text,

    -- Bandcamp va aparte de `links` porque no es un enlace más: es donde el
    -- underground bogotano publica de verdad, y es donde el artista cobra. La
    -- ficha lo embebe como el disco completo. No entra a la cola de la
    -- rockola porque su reproductor no tiene control por JavaScript.
    bandcamp_url text,

    -- El resto de enlaces (Instagram, sitio propio, prensa) sin esquema fijo:
    -- cada artista tiene los suyos y no vale la pena una columna por cada uno.
    links jsonb not null default '{}'::jsonb,

    evidencia text,

    status text not null default 'borrador'
        check (status in ('borrador', 'publicado', 'descartado')),
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Lo curado exige evidencia, y acá todo es curado.
    constraint artista_publicado_necesita_evidencia
        check (status <> 'publicado' or (evidencia is not null and btrim(evidencia) <> ''))
);

create index if not exists artists_status_idx on artists (status);

alter table artists enable row level security;

-- Las mismas cuatro de `venues` (20260831040000).
create policy "Public read access on published artists" on artists
    for select using (status = 'publicado');

create policy "Los admins ven todos los artistas" on artists
    for select to authenticated using (es_admin());

create policy "Los admins editan artistas" on artists
    for update to authenticated using (es_admin()) with check (es_admin());

create policy "Los admins cargan artistas a mano" on artists
    for insert to authenticated with check (es_admin());

comment on table artists is
    'El directorio de la escena. Se llena a mano y eso no es un parche: ninguna base global conoce al artista local emergente, así que la curación es el activo.';

comment on column artists.status is
    'borrador = cargado y sin revisar; publicado = está en el directorio, y eso mismo es el juicio de que es escena; descartado = visto y rechazado.';

comment on column artists.origen_ciudad is
    'De dónde es, como hecho consultable. NO decide si es de la escena: eso lo decide estar publicado acá. Confundir las dos cosas fue lo que costó la baja de MusicBrainz.';

comment on column artists.bandcamp_url is
    'La página del artista en Bandcamp. Va en la ficha como el disco completo, nunca en la cola de la rockola: su reproductor no expone control por JavaScript.';
