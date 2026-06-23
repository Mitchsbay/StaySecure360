-- Fix admin lead magnet access and make the bootstrap admin profile idempotent.
-- Safe to run more than once in Supabase SQL Editor.

insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = lower('mtchlsosa@gmail.com')
on conflict (id) do update
set
  email = excluded.email,
  role = 'admin',
  updated_at = now();

drop policy if exists "admin_select_lead_magnets" on public.lead_magnets;
drop policy if exists "admin_insert_lead_magnets" on public.lead_magnets;
drop policy if exists "admin_update_lead_magnets" on public.lead_magnets;
drop policy if exists "admin_delete_lead_magnets" on public.lead_magnets;

create policy "admin_select_lead_magnets"
on public.lead_magnets
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
  )
);

create policy "admin_insert_lead_magnets"
on public.lead_magnets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
  )
);

create policy "admin_update_lead_magnets"
on public.lead_magnets
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
  )
);

create policy "admin_delete_lead_magnets"
on public.lead_magnets
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
  )
);
