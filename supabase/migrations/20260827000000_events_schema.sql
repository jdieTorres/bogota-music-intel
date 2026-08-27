-- Fase 2: esquema base para el calendario/mapa de escena en vivo.
-- Los venues se crean bajo demanda (get_or_create_venue) cuando un scraper
-- encuentra uno nuevo por nombre; no requiere seed manual previo.

create extension if not exists pgcrypto;

create table if not exists venues (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    city text not null default 'Bogotá',
    address text,
    source_type text not null default 'scraping_direct'
        check (source_type in ('scraping_direct', 'manual')),
    website_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists events (
    id uuid primary key default gen_random_uuid(),
    source text not null,
    source_event_id text not null,
    venue_id uuid references venues(id),
    venue_name_raw text not null,
    title text not null,
    starts_at timestamptz,
    ends_at timestamptz,
    date_precision text not null default 'day'
        check (date_precision in ('day', 'month', 'unknown')),
    description text,
    price_text text,
    category text,
    ticket_url text,
    source_url text not null,
    image_url text,
    raw jsonb,
    scraped_at timestamptz not null default now(),
    unique (source, source_event_id)
);

create index if not exists events_starts_at_idx on events (starts_at);
create index if not exists events_venue_id_idx on events (venue_id);

alter table venues enable row level security;
alter table events enable row level security;

create policy "Public read access on venues" on venues
    for select using (true);

create policy "Public read access on events" on events
    for select using (true);

-- Escrituras solo con service_role key (el pipeline de scraping usa esa key
-- desde GitHub Actions; no se expone al frontend).
