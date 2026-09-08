-- El afiche que carga el admin se guarda acá (2026-09-08).
--
-- Es el primer uso de Storage del proyecto. Hasta ahora las imágenes de
-- evento las escribía solo el scraper, tomando la URL que publica la fuente;
-- y la foto de la sala se pega como URL a mano. El afiche es distinto: lo
-- sube una persona desde su máquina, así que no hay URL de origen que pegar.
--
-- Lectura pública porque la cartelera es pública y el afiche es lo que se ve
-- en cada fila. Escritura solo para quien pase `es_admin()` — la misma
-- puerta que decide quién publica un evento, y por el mismo motivo: no
-- alcanza con "autenticado", porque el registro de Supabase Auth se
-- configura en el panel y no en el repo.

insert into storage.buckets (id, name, public)
values ('afiches', 'afiches', true)
on conflict (id) do nothing;

drop policy if exists "Afiches: lectura pública" on storage.objects;
create policy "Afiches: lectura pública" on storage.objects
    for select using (bucket_id = 'afiches');

drop policy if exists "Afiches: los admins suben" on storage.objects;
create policy "Afiches: los admins suben" on storage.objects
    for insert to authenticated with check (bucket_id = 'afiches' and es_admin());

-- Reemplazar un afiche mal cargado tiene que ser posible; borrarlo también,
-- porque una imagen subida por error no se puede dejar servida en público.
drop policy if exists "Afiches: los admins corrigen" on storage.objects;
create policy "Afiches: los admins corrigen" on storage.objects
    for update to authenticated using (bucket_id = 'afiches' and es_admin())
    with check (bucket_id = 'afiches' and es_admin());

drop policy if exists "Afiches: los admins borran" on storage.objects;
create policy "Afiches: los admins borran" on storage.objects
    for delete to authenticated using (bucket_id = 'afiches' and es_admin());
