-- Confirmar un duplicado sugerido (Fase 5, cierre del paso 2).
--
-- El cron ya anota `suggested_duplicate_of` cuando un borrador se parece a
-- un canónico que ya existe, pero la sugerencia no decidía nada: faltaba
-- quién la confirmara. Esto es esa confirmación.
--
-- **Qué significa unir.** El borrador y el canónico son el mismo show visto
-- por dos fuentes distintas, así que las filas crudas del borrador pasan a
-- colgar del canónico y el borrador desaparece. No se pierde nada: el
-- canónico queda con más fuentes, que es justamente lo que le permite tomar
-- el título de una y el precio de otra.
--
-- Las tres cosas van juntas o ninguna, por el mismo motivo que en
-- `borrar_evento`: cortarse por la mitad dejaría filas crudas apuntando a un
-- canónico borrado, o dos canónicos para el mismo show.

create or replace function unificar_duplicado(borrador_id uuid, canonico_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not es_admin() then
        raise exception 'Solo un admin puede unificar eventos';
    end if;
    if borrador_id = canonico_id then
        raise exception 'Un evento no puede ser duplicado de sí mismo';
    end if;

    -- 1. Las fuentes del borrador pasan al canónico.
    update events set canonical_id = canonico_id where canonical_id = borrador_id;

    -- 2. Cualquier otro borrador que apuntaba al que se va queda sin
    --    sugerencia, en vez de apuntar a una fila borrada.
    update canonical_events
       set suggested_duplicate_of = null
     where suggested_duplicate_of = borrador_id;

    -- 3. El canónico se queda sin foto de origen, a propósito.
    --
    --    `source_snapshot` es "lo que ya vi de la fuente" y se compara contra
    --    lo que arma `borrador_desde()` con TODAS las fuentes del canónico.
    --    Al sumarle una, la foto vieja deja de corresponder y la corrida
    --    siguiente marcaría el evento como "la fuente cambió" sin que ninguna
    --    sala hubiera tocado nada. Poniéndola en null, `cambios()` devuelve
    --    vacío —su camino de "no sé"— y `moderacion_cli` la vuelve a tomar
    --    en la corrida siguiente, ya con las fuentes nuevas.
    update canonical_events
       set source_snapshot = null,
           change_detail = null,
           change_detected_at = null,
           reviewed_at = now()
     where id = canonico_id;

    -- 4. El borrador ya no representa nada.
    delete from canonical_events where id = borrador_id;
end;
$$;

comment on function unificar_duplicado(uuid, uuid) is
    'Confirma que un borrador es el mismo show que un canónico: le pasa las fuentes y lo borra. Deja source_snapshot en null para que la ingesta la rearme con las fuentes nuevas y no marque un cambio falso.';
