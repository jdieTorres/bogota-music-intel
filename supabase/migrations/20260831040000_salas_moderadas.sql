-- Las salas también pasan por moderación (pedido de Juan, 2026-08-31).
--
-- Hasta ahora una sala nacía sola: `upsert_venues` la crea en cuanto un
-- evento scrapeado la nombra, con el nombre tal como lo publica la fuente.
-- Eso hizo que "Teatro Libre de Bogotá Sala Centro" entrara con el nombre
-- que le pone Rockal Live y no con el que usa el teatro, y por eso existe
-- `nombres_de_salas.py`. Con un estado, la sala nueva espera a que alguien
-- la mire antes de aparecer en el mapa.
--
-- **El scraper no necesita cambiar.** `upsert_venues` sube solo slug,
-- nombre, ciudad y dirección; `status` no está en ese diccionario, así que
-- una sala nueva toma el default 'borrador' al insertarse y una que ya
-- existe conserva el estado que tenga. Es el mismo mecanismo que hace que
-- la clasificación de los eventos sobreviva al cron desde el 2026-08-27.

alter table venues
    add column if not exists status text not null default 'borrador'
        check (status in ('borrador', 'publicado', 'descartado')),
    add column if not exists reviewed_at timestamptz;

-- Las 9 que ya estaban en producción quedan publicadas: llevan semanas a la
-- vista y hacerlas esperar aprobación vaciaría el mapa.
update venues set status = 'publicado' where status = 'borrador';

-- A partir de acá el default hace su trabajo con las que lleguen nuevas.

drop policy if exists "Public read access on venues" on venues;

-- El público solo ve las aprobadas. Una sala en borrador no sale en el mapa
-- ni en la lista de "sin ubicar".
create policy "Public read access on published venues" on venues
    for select using (status = 'publicado');

create policy "Los admins ven todas las salas" on venues
    for select to authenticated using (es_admin());

create policy "Los admins editan salas" on venues
    for update to authenticated using (es_admin()) with check (es_admin());

create policy "Los admins cargan salas a mano" on venues
    for insert to authenticated with check (es_admin());

create index if not exists venues_status_idx on venues (status);

comment on column venues.status is
    'borrador = la trajo el scraper y nadie la miró; publicado = aprobada, sale en el mapa; descartado = vista y rechazada. Reversible: para borrar de verdad está borrar_evento sobre sus eventos.';

-- Un evento cargado a mano no tiene fila cruda, así que el aviso de
-- procedencia no puede decir "recogido de la cartelera de la sala". La base
-- ya exige `evidence` cuando `origin = 'manual'` (ver 20260831000000).
comment on column canonical_events.origin is
    'scraper = nació de una fila de events; manual = lo cargó el admin, y entonces evidence es obligatoria.';
