-- Filtrado editorial: la plataforma promueve los toques de artistas locales.
--
-- Dos decisiones distintas, tomadas con Juan el 2026-08-27:
--   1. Lo que no es música en vivo (comedia, lucha libre, teatro) se excluye
--      de la cartelera visible.
--   2. Los artistas internacionales NO se excluyen: se muestran, pero en
--      segundo plano respecto a los locales.
--
-- Se clasifica, no se borra. La ingesta sigue guardando todo crudo y el
-- criterio editorial se aplica al leer, así un cambio de criterio no obliga
-- a volver a scrapear el pasado.

alter table events
    add column if not exists event_type text
        check (event_type in ('music', 'not_music')),
    add column if not exists is_local boolean,
    add column if not exists classification_source text,
    add column if not exists classified_at timestamptz;

-- Los tres estados de cada columna son distintos y significan cosas
-- distintas; ninguno debe colapsarse al otro:
--
--   event_type null       -> todavía sin clasificar. Se SIGUE mostrando.
--   event_type 'not_music'-> se excluye de la cartelera.
--   is_local null         -> no se pudo resolver el origen del artista.
--                            No se penaliza: se muestra en su lugar normal.
--   is_local false        -> internacional confirmado. Va en segundo plano.
--
-- Que "no sé" y "confirmado que no" sean valores separados es justamente lo
-- que evita degradar un evento por no haber podido resolverlo.

-- Igual que geocode_source en venues: sin rastro de cómo se decidió, no hay
-- forma de auditar por qué un evento quedó fuera de la cartelera.
comment on column events.classification_source is
    'Cómo se clasificó: manual, source_category, exclusion_pattern, musicbrainz, assumed_music';

-- La cartelera filtra por event_type en cada consulta.
create index if not exists events_event_type_idx on events (event_type);
