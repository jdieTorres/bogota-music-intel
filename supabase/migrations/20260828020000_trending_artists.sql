-- Fase 5: radar de tendencias.
--
-- Dos fuentes distintas y complementarias, verificadas llamándolas de
-- verdad el 2026-08-28 (context/archivo/apis-de-musica.md
-- sección 2.2):
--   - deezer_editorial: editorial "Música colombiana" (id 498) de Deezer.
--     Contesta qué ES música colombiana, sin key.
--   - lastfm_geo: geo.gettopartists?country=colombia de Last.fm. Contesta
--     qué se ESCUCHA en Colombia, con key.
--
-- Cada corrida inserta una foto nueva (captured_at) en vez de pisar la
-- anterior: sirve para ver la tendencia entre semanas más adelante, y para
-- auditar cuándo se detectó un cambio. El frontend lee solo la más
-- reciente por fuente.
--
-- is_local es nullable a propósito, igual que en events: la editorial de
-- Deezer mezcla nacionalidades (Bad Bunny aparece en "Música colombiana"),
-- así que necesita el mismo criterio "no sé" vs. "confirmado que no" que ya
-- tiene la cartelera. Se resuelve con la misma lista curada + MusicBrainz.

create table if not exists trending_artists (
    id uuid primary key default gen_random_uuid(),
    source text not null
        check (source in ('deezer_editorial', 'lastfm_geo')),
    rank int not null,
    artist_name text not null,
    external_id text,
    image_url text,
    metric bigint,
    is_local boolean,
    classification_source text,
    captured_at timestamptz not null default now()
);

comment on column trending_artists.metric is
    'Oyentes (lastfm_geo, listeners) o null (deezer_editorial no publica una métrica por artista en el editorial chart, solo el orden)';

create index if not exists trending_artists_source_captured_idx
    on trending_artists (source, captured_at desc);

alter table trending_artists enable row level security;

create policy "Public read access on trending_artists" on trending_artists
    for select using (true);

-- Escrituras solo con service_role key, igual que events/venues.
