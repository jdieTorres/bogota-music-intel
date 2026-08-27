-- Tercera categoría editorial: la fiesta / el ciclo.
--
-- Decidido con Juan el 2026-08-27. Hasta acá había dos casilleros, música y
-- no-música, y las fiestas caían en música con `is_local` en null. Eso
-- mentía por omisión: null significa "no pude identificar al artista", y en
-- una fiesta no hay un artista que identificar. Son cosas distintas y ahora
-- se guardan distinto.
--
-- Entran acá las noches recurrentes y los ciclos de una sala: "Noches Bomm"
-- de Latino Power, "Que Chimba Puñeta Vol. 4", "THE JAZZ ROOM" del Royal
-- Center. Se muestran en la cartelera —son escena local igual que un
-- toque—, pero en su propia pestaña: comparar una noche de club con un
-- concierto en el Movistar y ordenarlos juntos no significa nada.

-- El check original se creó en línea (`add column ... check (...)`), así que
-- Postgres le puso un nombre automático. Se busca en vez de adivinarlo: si
-- el nombre no coincidiera, un `drop constraint if exists` no borraría nada
-- y el check viejo seguiría rechazando 'fiesta' — fallando en silencio.
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
end $$;

alter table events
    add constraint events_event_type_check
        check (event_type in ('music', 'fiesta', 'not_music'));

comment on column events.event_type is
    'music = concierto de un artista; fiesta = noche o ciclo de una sala; '
    'not_music = no es música en vivo (se excluye de la cartelera); '
    'null = todavía sin clasificar, se sigue mostrando';
