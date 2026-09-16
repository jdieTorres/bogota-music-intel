-- La tabla cruda deja de ser legible entera por cualquiera (2026-09-16).
--
-- **Qué estaba pasando.** `events` tenía `for select using (true)` desde la
-- primera migración, la del 2026-08-27, cuando era la tabla que el frontend
-- mostraba. El 2026-08-31 llegó `canonical_events` y la pantalla pasó a leer
-- el canónico: **la tabla cambió de rol y sus permisos no**. Desde entonces
-- era la única de las ocho sin filtro — las otras siete exponen solo lo
-- publicado— y con la publishable key en el bundle del navegador eso deja a
-- la vista 70 de las 106 filas: las de los borradores —lo que Juan todavía no
-- ha decidido— y las de lo descartado, que son **su criterio editorial en
-- bruto**: qué shows miró y resolvió no publicar, con nombre y fecha.
--
-- No es el `raw` lo que preocupa: medido, pesa entre 5 y 136 bytes por fila,
-- así que no guarda el volcado de la fuente. Lo que sobra a la vista son las
-- decisiones.
--
-- **Por qué no se cierra del todo.** La cartelera pública sí la necesita: el
-- select de `lib/events.ts` la trae embebida como `events ( source,
-- source_url )` para decir de dónde salió cada toque y enlazar a la fuente.
-- Cerrarla entera dejaría esa atribución vacía. Lo que sobra no es la
-- lectura, es que no tenga filtro.
--
-- Queda entonces el mismo patrón que ya usan las otras tablas: una política
-- pública para lo que cuelga de un canónico publicado, y otra de admin para
-- todo. Las políticas permisivas se suman, así que el admin sigue viendo la
-- cola completa —que es lo que le deja comparar lo que dice la fuente contra
-- lo que él editó— y el visitante solo ve las crudas de lo que está en
-- pantalla.
--
-- El `exists` va por `events_canonical_id_idx`, que ya existía.
--
-- ⚠️ Una fila cruda sin canónico todavía —recién scrapeada, antes de que
-- `moderacion_cli` le abra el borrador— no la ve el público, y es lo
-- correcto: no hay nada publicado a lo que pertenezca.

drop policy if exists "Public read access on events" on events;

create policy "Public read access on events of published canonical events" on events
    for select using (
        exists (
            select 1 from canonical_events c
            where c.id = events.canonical_id
              and c.status = 'publicado'
        )
    );

create policy "Los admins ven todas las filas crudas" on events
    for select to authenticated using (es_admin());
