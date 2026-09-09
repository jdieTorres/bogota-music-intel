-- Los tracks de la rockola (2026-09-09).
--
-- El track es una entidad y no una columna del artista, porque es lo único que
-- hace real "la persona elige el track" y lo único que llena un tracklist de
-- contraportada.
--
-- **No hay fuente legal del audio de esta escena** —está verificado y
-- archivado dos veces; fue lo que mató el Motor de similitud sonora—, así que
-- la rockola embebe reproductores de terceros y no aloja nada.
--
-- ⚠️ **Y por eso la plataforma es un dato, no una suposición.** La columna no
-- se llama `youtube_id`: se midió cuál sirve y ninguna gana sola.
--
--   - **YouTube** tiene la mayor cobertura y control completo por JavaScript,
--     pero sus políticas exigen que el reproductor mida al menos 200x200 y
--     prohíben taparlo. No se puede esconder detrás de un disco de CSS.
--   - **SoundCloud** da el mismo control con su Widget API —que no pide clave,
--     a diferencia del Data API, que sí tiene el registro cerrado— y sin
--     restricción de tamaño.
--   - **Spotify** queda fuera: sin sesión reproduce 30 segundos.
--   - **Bandcamp** tiene la mejor cobertura del underground bogotano pero no
--     expone control por JavaScript, así que no puede encadenarse. Vive en
--     `artists.bandcamp_url`, en la ficha, no acá.
--
-- La cola es de lo que se puede encadenar. Si mañana entra otra plataforma con
-- control real, es una entrada más en el check y un adaptador más en la
-- bandeja; no una migración de datos.

create table if not exists tracks (
    id uuid primary key default gen_random_uuid(),
    artista_id uuid not null references artists(id) on delete cascade,

    -- El orden del tracklist, como en una contratapa. Lo pone Juan.
    orden integer not null default 0,

    titulo text not null,
    anio integer,

    plataforma text not null
        check (plataforma in ('youtube', 'soundcloud')),
    id_externo text not null,

    -- Nullable a propósito: sin carátula el disco lleva una etiqueta compuesta
    -- con el nombre y el título. Es la regla del hueco visible llevada al
    -- diseño — no se recorta una miniatura de video para fingir una carátula
    -- que nadie publicó.
    caratula_url text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint track_no_se_repite unique (plataforma, id_externo, artista_id)
);

create index if not exists tracks_artista_idx on tracks (artista_id, orden);

alter table tracks enable row level security;

-- El track se ve si su artista está publicado. No tiene estado propio: un
-- track a medias no existe, se borra.
create policy "Public read access on tracks of published artists" on tracks
    for select using (
        exists (
            select 1 from artists
            where artists.id = tracks.artista_id
              and artists.status = 'publicado'
        )
    );

create policy "Los admins ven todos los tracks" on tracks
    for select to authenticated using (es_admin());

create policy "Los admins editan tracks" on tracks
    for update to authenticated using (es_admin()) with check (es_admin());

create policy "Los admins cargan tracks" on tracks
    for insert to authenticated with check (es_admin());

create policy "Los admins borran tracks" on tracks
    for delete to authenticated using (es_admin());

comment on table tracks is
    'Lo que suena en la rockola. Nunca audio propio: son referencias a un reproductor de terceros que se embebe.';

comment on column tracks.plataforma is
    'Donde vive el track. Solo entran las que exponen control por JavaScript, porque la cola tiene que encadenar sola. Bandcamp no cumple y va en artists.bandcamp_url.';

comment on column tracks.caratula_url is
    'La caratula, si el artista publico una. En null el disco lleva una etiqueta tipografica: no se finge una caratula con un fotograma del video.';
