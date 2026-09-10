-- Descartar una sala baja sus eventos de la cartelera (2026-09-09).
--
-- **El bug que cierra.** Hasta hoy `descartarSala` solo tocaba la fila de la
-- sala. Sus eventos publicados se quedaban publicados, y como las políticas
-- RLS solo dejan ver salas en `publicado`, el embed de `venues` les devolvía
-- null al público: los tres eventos de Teatro Republik seguían en la cartelera
-- diciendo **"Sala por confirmar"**. Eso no era un hueco honesto, era una
-- afirmación falsa — la sala se sabía, la habían descartado.
--
-- Lo encontró Juan el 2026-09-09 al bajar Teatro Republik por ser discoteca.
--
-- **Por qué es una función y no dos updates desde el cliente.** Las dos cosas
-- tienen que pasar juntas o ninguna. Cortadas por la mitad dejan justo el
-- estado que este arreglo existe para evitar: o una sala descartada con
-- eventos publicados colgando —el bug otra vez— o eventos en borrador bajo una
-- sala que sigue en el mapa. Es el mismo motivo por el que `borrar_evento` y
-- `unificar_duplicado` son funciones.
--
-- **Los eventos bajan a `borrador`, no a `descartado`.** Un evento cuyo lugar
-- dejó de valer no está mal: le falta un dato. `descartado` diría "lo vi y no
-- va", que es un juicio que nadie hizo. En borrador vuelve a la cola con su
-- sala por reasignar, y la decisión sigue siendo de una persona.

create or replace function descartar_sala(sala_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    bajados integer;
begin
    if not es_admin() then
        raise exception 'Solo un admin puede descartar una sala';
    end if;

    -- 1. Los eventos que estaban en cartelera vuelven a la cola. Solo los
    --    publicados: un borrador ya está en la cola y un descartado ya se
    --    miró, y revivirlo sería deshacer una decisión ajena a esta.
    update canonical_events
       set status = 'borrador',
           reviewed_at = now()
     where venue_id = sala_id
       and status = 'publicado';

    get diagnostics bajados = row_count;

    -- 2. Y la sala sale del mapa. No se borra: la referencian sus eventos por
    --    `venue_id`, y el scraper la volvería a crear en la corrida siguiente
    --    en cuanto un evento la nombre.
    update venues
       set status = 'descartado',
           reviewed_at = now()
     where id = sala_id;

    return bajados;
end;
$$;

comment on function descartar_sala is
    'Saca la sala del mapa y devuelve a la cola los eventos que tenia en cartelera. Devuelve cuantos bajo. Las dos cosas van juntas: una sala descartada con eventos publicados deja al publico viendo "Sala por confirmar" sobre una sala que si se sabe.';
