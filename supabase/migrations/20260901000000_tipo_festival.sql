-- Cuarta categoría editorial: `festival` (decidido con Juan el 2026-09-01).
--
-- El cron empezó a traer festivales cuando entró `visitbogota` el 2026-08-31:
-- Rock al Parque, Salsa al Parque, Jazz al Parque, Hip Hop al Parque y
-- Festival Cordillera. Sin una categoría propia caían en `music` y quedaban
-- con `is_local` en null para siempre, porque un festival no tiene UN artista
-- de cartel al que preguntarle de dónde es — el mismo problema que ya tenía
-- resuelto la fiesta.
--
-- Por qué no reusar `fiesta`, que comparte esa forma: una fiesta es la sala
-- programándose a sí misma una noche; un festival son tres días en un parque
-- con cincuenta bandas. Mezclarlos en la misma pestaña vuelve a hacer lo que
-- separar conciertos de fiestas vino a evitar — ordenar en una misma lista
-- cosas que no se comparen entre sí.
--
-- Como las dos anteriores, `festival` NO se excluye de la cartelera: va en su
-- propia pestaña (`/festivales`). El que se excluye sigue siendo `not_music`.

-- El nombre del constraint lo eligió Postgres cuando la columna se creó sin
-- nombrarlo, así que se busca por su definición en vez de adivinarlo. Mismo
-- procedimiento que la migración 20260828010000, por el mismo motivo.
do $$
declare
    nombre text;
begin
    for nombre in
        select con.conname
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        where rel.relname = 'events'
          and con.contype = 'c'
          and pg_get_constraintdef(con.oid) like '%event_type%'
    loop
        execute format('alter table events drop constraint %I', nombre);
    end loop;

    for nombre in
        select con.conname
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        where rel.relname = 'canonical_events'
          and con.contype = 'c'
          and pg_get_constraintdef(con.oid) like '%event_type%'
    loop
        execute format('alter table canonical_events drop constraint %I', nombre);
    end loop;
end $$;

alter table events
    add constraint events_event_type_check
        check (event_type in ('music', 'fiesta', 'festival', 'not_music'));

alter table canonical_events
    add constraint canonical_events_event_type_check
        check (event_type in ('music', 'fiesta', 'festival', 'not_music'));

comment on column events.event_type is
    'music = concierto de un artista; fiesta = noche o ciclo de una sala; '
    'festival = varios días y varios artistas, sin uno de cartel; '
    'not_music = comedia, teatro, lucha libre. null = todavía sin clasificar, '
    'que NO es lo mismo que not_music y se sigue mostrando.';

comment on column canonical_events.event_type is
    'Mismo vocabulario que events.event_type, pero acá lo puede corregir el '
    'admin desde /admin y su decisión gana sobre lo que diga el clasificador.';
