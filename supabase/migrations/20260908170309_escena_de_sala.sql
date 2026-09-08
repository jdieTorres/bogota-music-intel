-- La sala dice si es del circuito de escena o un escenario grande
-- (2026-09-08). **Revertida el mismo día** — ver 20260908173150.
--
-- Se conserva porque se aplicó de verdad contra la base y este directorio es
-- el registro de lo que le pasó al esquema, no de lo que quedó.

alter table venues
    add column if not exists escena text
        check (escena in ('local', 'masiva'));

comment on column venues.escena is
    'local = sala del circuito de escena; masiva = escenario grande o consagrado; null = nadie lo ha decidido todavía.';
