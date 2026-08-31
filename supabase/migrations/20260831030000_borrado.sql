-- Borrar de verdad un evento, desde el navegador y sin que vuelva.
--
-- **El problema que resuelve.** Borrar la fila del canónico no alcanza: las
-- filas crudas de `events` siguen ahí, y la corrida siguiente del cron les
-- abre un borrador nuevo. Se comprobó el 2026-08-31 soltando el canónico de
-- WWE — el CLI lo volvió a abrir en la misma corrida. Es la misma lección
-- que ya había dejado `eventos_excluidos.py`: en una fuente activa, un
-- DELETE dura hasta que el scraper vuelva a mirar.
--
-- Por eso borrar son tres cosas que tienen que pasar juntas o ninguna:
-- registrar el bloqueo, borrar las filas crudas y borrar el canónico. Van
-- dentro de una función y no en tres llamadas desde el navegador, porque
-- tres llamadas se pueden cortar por la mitad y dejar filas crudas sin
-- bloquear, que es el peor de los estados posibles: el evento vuelve mañana
-- y nadie se acuerda de por qué.
--
-- **No hay política de DELETE sobre `events` ni sobre `canonical_events`.**
-- La única forma de borrar es esta función, que además deja constancia. Un
-- borrado que no registra por qué no se puede auditar.

create table if not exists blocked_source_events (
    source text not null,
    source_event_id text not null,
    title text,
    reason text not null,
    blocked_by uuid references auth.users(id),
    blocked_at timestamptz not null default now(),
    primary key (source, source_event_id)
);

alter table blocked_source_events enable row level security;

create policy "Los admins ven qué está bloqueado" on blocked_source_events
    for select to authenticated using (es_admin());

comment on table blocked_source_events is
    'Eventos que no vuelven a entrar, por (source, source_event_id). Reemplaza a eventos_excluidos.py: la lista tiene que ser escribible desde el formulario, así que vive en la base y no en git.';

-- Se trae la única entrada que tenía `eventos_excluidos.py`, para no perder
-- la decisión ni su motivo al retirar el archivo.
insert into blocked_source_events (source, source_event_id, title, reason)
values (
    'movistar_arena',
    'laura-brenda',
    'Laura & Brenda',
    'Juan lo sacó el 2026-08-28: «no me parece un concierto a tener en cuenta». '
    'No se pudo saber qué es —movistararena.co no dice quiénes son, ni género ni '
    'país, y MusicBrainz no lo resuelve—, así que tampoco había regla que lo '
    'excluyera. Es una decisión, no una clasificación. Migrado de eventos_excluidos.py.'
)
on conflict (source, source_event_id) do nothing;

-- `security definer` para poder borrar sin abrir políticas de DELETE a
-- nadie. La primera línea es la que hace que eso sea seguro: sin ser admin,
-- la función no hace nada.
create or replace function borrar_evento(canonico_id uuid, motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    borrado_por uuid := auth.uid();
begin
    if not es_admin() then
        raise exception 'Solo un admin puede borrar eventos';
    end if;
    if motivo is null or length(trim(motivo)) = 0 then
        raise exception 'Un borrado sin motivo no se puede auditar';
    end if;

    -- 1. Que no vuelva. Va primero: si algo falla después, es preferible un
    --    bloqueo de más (el evento no reaparece) que uno de menos.
    insert into blocked_source_events (source, source_event_id, title, reason, blocked_by)
    select e.source, e.source_event_id, e.title, motivo, borrado_por
    from events e
    where e.canonical_id = canonico_id
    on conflict (source, source_event_id) do update
        set reason = excluded.reason,
            blocked_by = excluded.blocked_by,
            blocked_at = now();

    -- 2. Las filas crudas.
    delete from events where canonical_id = canonico_id;

    -- 3. El canónico.
    delete from canonical_events where id = canonico_id;
end;
$$;

comment on function borrar_evento(uuid, text) is
    'Borra un evento y lo bloquea para que el cron no lo vuelva a traer. Las tres cosas en una transacción. Exige ser admin y dejar un motivo.';
