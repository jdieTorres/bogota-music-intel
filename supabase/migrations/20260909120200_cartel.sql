-- El cartel del evento deja de tirarse (2026-09-09).
--
-- El lector de afiches ya extrae los artistas del cartel desde el 2026-09-08
-- (`artistas: string[]` en el esquema que se le pide al modelo), y hoy ese
-- dato **se usa para sugerir un título y se descarta**. Acá aterriza.
--
-- Habilita dos cosas del directorio: la recomendación "compartieron cartel",
-- que es la señal más periodística que tenemos porque describe una escena de
-- verdad, y los enlaces cruzados entre la cartelera y la ficha del artista.
--
-- ⚠️ **Nada crea artistas solo.** La tabla se llena desde /admin, comparando
-- el nombre normalizado contra los artistas publicados; si no hay match el
-- campo queda vacío para que Juan elija o cree. Es la misma regla que ya rige
-- para las salas, y existe por lo mismo: "Teatro Libre de Bogotá Sala Centro"
-- entró una vez con el nombre que le puso la fuente.

create table if not exists event_artists (
    canonical_event_id uuid not null
        references canonical_events(id) on delete cascade,
    artist_id uuid not null references artists(id) on delete cascade,

    -- El orden del cartel: quién encabeza y quién abre. En un afiche eso es
    -- información, no decoración.
    orden integer not null default 0,

    created_at timestamptz not null default now(),

    primary key (canonical_event_id, artist_id)
);

create index if not exists event_artists_artist_idx on event_artists (artist_id);

alter table event_artists enable row level security;

-- El vínculo se ve solo si las dos puntas se ven. Un artista en borrador no
-- se asoma por la cartelera, ni un evento en borrador por la ficha.
create policy "Public read access on links between published rows" on event_artists
    for select using (
        exists (
            select 1 from artists
            where artists.id = event_artists.artist_id
              and artists.status = 'publicado'
        )
        and exists (
            select 1 from canonical_events
            where canonical_events.id = event_artists.canonical_event_id
              and canonical_events.status = 'publicado'
        )
    );

create policy "Los admins ven todos los vinculos de cartel" on event_artists
    for select to authenticated using (es_admin());

create policy "Los admins arman el cartel" on event_artists
    for insert to authenticated with check (es_admin());

create policy "Los admins editan el cartel" on event_artists
    for update to authenticated using (es_admin()) with check (es_admin());

create policy "Los admins deshacen el cartel" on event_artists
    for delete to authenticated using (es_admin());

comment on table event_artists is
    'Quien toca en que. Lo llena una persona en /admin: nunca se crea un artista desde un nombre scrapeado.';

comment on column event_artists.orden is
    'El orden del cartel tal como lo publica el afiche. 0 es quien encabeza.';
