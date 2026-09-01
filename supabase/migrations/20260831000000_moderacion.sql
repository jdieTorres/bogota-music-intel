-- Moderación: el scraping propone, el admin publica (decidido con Juan el
-- 2026-08-31). Ningún evento se publica solo.
--
-- El motivo no es de calidad sino de SESGO DE COBERTURA: las seis fuentes
-- que scrapeamos tiran a salas grandes, donde tocan los internacionales. El
-- toque local en un bar chico, anunciado solo por Instagram, es invisible
-- para el pipeline — y promover ese toque es el propósito de la plataforma.
-- Diseño completo en context/moderacion/diseno.md.
--
-- Dos capas:
--   `events`            crudo, una fila POR FUENTE. El cron la reescribe
--                       libremente; el admin no la toca nunca.
--   `canonical_events`  una fila por SHOW REAL, con los valores aprobados,
--                       colgando de una o varias filas crudas.
--
-- Por qué una tabla aparte y no columnas sobre `events`: un show llega por
-- dos fuentes (Royal Center y Rockal Live publican el mismo Akriila), así
-- que la identidad del show no puede ser una fila cruda. Y `events` se poda
-- —`_prune_missing_events` borra lo que sale de la cartelera—, así que si el
-- canónico fuera una fila cruda, desaparecería cuando una de sus fuentes lo
-- deje de publicar aunque la otra siga. Además esto le da lugar propio al
-- evento cargado a mano, que es un canónico sin ninguna fuente.

create table if not exists canonical_events (
    id uuid primary key default gen_random_uuid(),

    -- Los valores en español son vocabulario del proyecto, igual que
    -- event_type = 'fiesta'. 'descartado' es "lo vi y no va", que es
    -- distinto de 'borrador' (todavía no lo miré).
    status text not null default 'borrador'
        check (status in ('borrador', 'publicado', 'descartado')),

    -- 'scraper': nació de una fila cruda. 'manual': lo cargó el admin, y
    -- entonces la evidencia es obligatoria (ver constraint abajo) porque no
    -- hay ninguna página de sala a la que remitir al lector.
    origin text not null default 'scraper'
        check (origin in ('scraper', 'manual')),

    -- Valores aprobados. Son copia propia y editable: el scraper reescribe
    -- events.title en cada corrida, así que una corrección hecha allá se
    -- perdería al día siguiente. Lo que se muestra sale de acá.
    venue_id uuid references venues(id),
    title text,
    starts_at timestamptz,
    ends_at timestamptz,
    date_precision text not null default 'day'
        check (date_precision in ('day', 'month', 'unknown')),
    description text,
    price_text text,
    category text,
    ticket_url text,
    image_url text,

    -- La clasificación editorial se hereda del crudo y el admin la puede
    -- corregir. Mismos tres estados de siempre: null = todavía no se sabe,
    -- y no es lo mismo que 'not_music'.
    event_type text
        check (event_type in ('music', 'fiesta', 'not_music')),
    is_local boolean,

    -- De dónde salió el dato cuando no hay fuente scrapeada que lo respalde.
    -- Mismo contrato que el campo `evidencia` de las listas curadas, pero
    -- exigido por la base en vez de por un test, porque acá no hay archivo
    -- en git que revisar.
    evidence text,

    -- Foto de los campos crudos TAL COMO SE APROBARON. Es lo que permite
    -- detectar que la sala movió el precio o la fecha después: se compara el
    -- crudo de hoy contra esto, y no contra los valores del canónico, que el
    -- admin pudo haber editado a propósito (si no, una corrección de título
    -- quedaría marcada como cambio para siempre).
    source_snapshot jsonb,

    -- Divergencia detectada respecto de `source_snapshot`. El evento vuelve
    -- a la cola con el cambio a la vista para que el admin apruebe o
    -- rechace. `change_detail` guarda {campo: {antes, ahora}}.
    change_detected_at timestamptz,
    change_detail jsonb,

    -- Sugerencia de duplicado, NO decisión: la heurística propone y el admin
    -- confirma en la pantalla de revisión. Es lo que hoy hace dedupe.ts sola
    -- y a ciegas en el frontend.
    suggested_duplicate_of uuid references canonical_events(id) on delete set null,

    reviewed_at timestamptz,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Publicar sin título sería publicar un hueco; en borrador sí se permite,
    -- porque "evento nuevo" arranca vacío.
    constraint canonical_publicado_necesita_titulo
        check (status <> 'publicado' or title is not null),
    -- Un evento a mano sin evidencia es exactamente lo que la regla dura del
    -- proyecto prohíbe: afirmar algo que nadie puede verificar.
    constraint canonical_manual_necesita_evidencia
        check (origin <> 'manual' or evidence is not null)
);

-- Qué fila cruda alimenta a qué canónico. N crudas : 1 canónico.
-- `on delete set null` y no cascade: si la sala saca el evento de su
-- cartelera y `_prune_missing_events` borra la fila cruda, el canónico
-- publicado NO debe desaparecer con ella — tiene que quedar para avisarle al
-- admin que su fuente se fue.
alter table events
    add column if not exists canonical_id uuid
        references canonical_events(id) on delete set null;

-- La cola de revisión se pide siempre igual: por estado y por fecha del
-- evento, que es lo urgente.
create index if not exists canonical_events_status_starts_at_idx
    on canonical_events (status, starts_at);
create index if not exists events_canonical_id_idx on events (canonical_id);

alter table canonical_events enable row level security;

-- Solo lo publicado es público. Los borradores NO se exponen a la
-- publishable key del navegador: son justamente lo que todavía no pasó por
-- revisión, y la promesa del modelo es que nada se ve sin que Juan lo mire.
create policy "Public read access on published canonical events"
    on canonical_events
    for select using (status = 'publicado');

comment on table canonical_events is
    'Un show real, con los valores aprobados por el admin. Cuelga de 0..N filas de events (0 = cargado a mano). La cartelera lee de acá, no de events.';
comment on column canonical_events.source_snapshot is
    'Los campos crudos tal como se aprobaron. Comparar contra el crudo actual detecta que la fuente cambió después de la aprobación.';
comment on column canonical_events.suggested_duplicate_of is
    'Sugerencia de la heurística de deduplicación. La confirma el admin; nunca se aplica sola.';
