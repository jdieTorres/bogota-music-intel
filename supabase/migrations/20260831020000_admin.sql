-- Permisos del formulario de admin (Fase 5, paso 2).
--
-- Hasta ahora la base tenía dos niveles: lectura pública de lo publicado, y
-- escritura solo con la service role key desde GitHub Actions. El formulario
-- es un tercer caso: una persona, desde el navegador, escribiendo con su
-- propia sesión.
--
-- **Por qué una lista de admins y no "cualquiera autenticado".** Supabase
-- Auth permite registro público según cómo esté configurado el proyecto, y
-- eso no se ve desde acá ni queda en el repo. Si las políticas dijeran
-- `to authenticated`, cualquiera que se registrara podría publicar eventos
-- en la cartelera. La lista hace que la autorización dependa de un dato de
-- la base y no de una casilla del panel que nadie recuerda haber marcado.

create table if not exists admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    email text,
    created_at timestamptz not null default now()
);

-- Sin políticas: nadie la lee ni la escribe desde el navegador. Solo la
-- service role key (y la función de abajo, que es security definer).
alter table admins enable row level security;

-- `security definer` para que pueda leer `admins` sin que el usuario tenga
-- permiso de leerla. `stable` para que Postgres la evalúe una vez por
-- consulta y no una vez por fila.
create or replace function es_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Leer TODO, borradores incluidos. Convive con la política pública que ya
-- existe (`status = 'publicado'`): las políticas permisivas se suman, así
-- que el admin ve todo y el visitante sigue viendo solo lo publicado.
create policy "Los admins leen la cola completa" on canonical_events
    for select to authenticated using (es_admin());

-- Editar y publicar. `with check` además de `using` para que un admin no
-- pueda convertir una fila en algo que él mismo no podría haber creado.
create policy "Los admins editan la cola" on canonical_events
    for update to authenticated using (es_admin()) with check (es_admin());

-- Cargar un evento a mano. El constraint de la tabla ya exige que si
-- `origin = 'manual'` venga con evidencia.
create policy "Los admins cargan eventos a mano" on canonical_events
    for insert to authenticated with check (es_admin());

-- Nadie borra desde el navegador, ni siquiera un admin: para eso está
-- `status = 'descartado'`, que es reversible y deja rastro. Borrar de
-- verdad sigue siendo cosa de la service role key.

comment on table admins is
    'Quién puede moderar. Se llena a mano con la service role key; no hay alta desde la aplicación.';
comment on function es_admin() is
    'La usan las políticas RLS de canonical_events. security definer para poder leer admins sin dar permiso de lectura sobre ella.';
