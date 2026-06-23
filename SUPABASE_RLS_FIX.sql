-- StaySecure360 admin RLS and storage policy fix
-- Paste into Supabase SQL Editor and run once.
-- This keeps public pages readable only when content is published/coming soon,
-- while allowing your admin account to create, view, update, and delete admin content.

-- 1) Make sure Mitchel is an admin/editor in public.profiles.
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = lower('mtchlsosa@gmail.com')
on conflict (id) do update
set
  email = excluded.email,
  role = 'admin',
  updated_at = now();

-- 2) Helper function used by policies.
create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
  );
$$;

grant execute on function public.is_admin_or_editor() to anon, authenticated;

-- 3) Enable RLS on main admin tables.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.landing_pages enable row level security;
alter table public.articles enable row level security;
alter table public.lead_magnets enable row level security;
alter table public.subscribers enable row level security;

-- 4) Categories policies.
drop policy if exists "public_select_published_categories" on public.categories;
drop policy if exists "admin_select_categories" on public.categories;
drop policy if exists "admin_insert_categories" on public.categories;
drop policy if exists "admin_update_categories" on public.categories;
drop policy if exists "admin_delete_categories" on public.categories;

create policy "public_select_published_categories"
on public.categories
for select
to anon, authenticated
using (status = 'published');

create policy "admin_select_categories"
on public.categories
for select
to authenticated
using (public.is_admin_or_editor());

create policy "admin_insert_categories"
on public.categories
for insert
to authenticated
with check (public.is_admin_or_editor());

create policy "admin_update_categories"
on public.categories
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

create policy "admin_delete_categories"
on public.categories
for delete
to authenticated
using (public.is_admin_or_editor());

-- 5) Products policies.
drop policy if exists "public_select_available_products" on public.products;
drop policy if exists "admin_select_products" on public.products;
drop policy if exists "admin_insert_products" on public.products;
drop policy if exists "admin_update_products" on public.products;
drop policy if exists "admin_delete_products" on public.products;

create policy "public_select_available_products"
on public.products
for select
to anon, authenticated
using (status in ('published', 'coming_soon'));

create policy "admin_select_products"
on public.products
for select
to authenticated
using (public.is_admin_or_editor());

create policy "admin_insert_products"
on public.products
for insert
to authenticated
with check (public.is_admin_or_editor());

create policy "admin_update_products"
on public.products
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

create policy "admin_delete_products"
on public.products
for delete
to authenticated
using (public.is_admin_or_editor());

-- 6) Landing pages policies.
drop policy if exists "public_select_published_landing_pages" on public.landing_pages;
drop policy if exists "admin_select_landing_pages" on public.landing_pages;
drop policy if exists "admin_insert_landing_pages" on public.landing_pages;
drop policy if exists "admin_update_landing_pages" on public.landing_pages;
drop policy if exists "admin_delete_landing_pages" on public.landing_pages;

create policy "public_select_published_landing_pages"
on public.landing_pages
for select
to anon, authenticated
using (status = 'published');

create policy "admin_select_landing_pages"
on public.landing_pages
for select
to authenticated
using (public.is_admin_or_editor());

create policy "admin_insert_landing_pages"
on public.landing_pages
for insert
to authenticated
with check (public.is_admin_or_editor());

create policy "admin_update_landing_pages"
on public.landing_pages
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

create policy "admin_delete_landing_pages"
on public.landing_pages
for delete
to authenticated
using (public.is_admin_or_editor());

-- 7) Articles policies.
drop policy if exists "public_select_published_articles" on public.articles;
drop policy if exists "admin_select_articles" on public.articles;
drop policy if exists "admin_insert_articles" on public.articles;
drop policy if exists "admin_update_articles" on public.articles;
drop policy if exists "admin_delete_articles" on public.articles;

create policy "public_select_published_articles"
on public.articles
for select
to anon, authenticated
using (status = 'published');

create policy "admin_select_articles"
on public.articles
for select
to authenticated
using (public.is_admin_or_editor());

create policy "admin_insert_articles"
on public.articles
for insert
to authenticated
with check (public.is_admin_or_editor());

create policy "admin_update_articles"
on public.articles
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

create policy "admin_delete_articles"
on public.articles
for delete
to authenticated
using (public.is_admin_or_editor());

-- 8) Lead magnets policies.
drop policy if exists "admin_select_lead_magnets" on public.lead_magnets;
drop policy if exists "admin_insert_lead_magnets" on public.lead_magnets;
drop policy if exists "admin_update_lead_magnets" on public.lead_magnets;
drop policy if exists "admin_delete_lead_magnets" on public.lead_magnets;

create policy "admin_select_lead_magnets"
on public.lead_magnets
for select
to authenticated
using (public.is_admin_or_editor());

create policy "admin_insert_lead_magnets"
on public.lead_magnets
for insert
to authenticated
with check (public.is_admin_or_editor());

create policy "admin_update_lead_magnets"
on public.lead_magnets
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

create policy "admin_delete_lead_magnets"
on public.lead_magnets
for delete
to authenticated
using (public.is_admin_or_editor());

-- 9) Subscriber policies.
drop policy if exists "public_insert_subscribers" on public.subscribers;
drop policy if exists "admin_select_subscribers" on public.subscribers;
drop policy if exists "admin_update_subscribers" on public.subscribers;
drop policy if exists "admin_delete_subscribers" on public.subscribers;

create policy "public_insert_subscribers"
on public.subscribers
for insert
to anon, authenticated
with check (consent = true);

create policy "admin_select_subscribers"
on public.subscribers
for select
to authenticated
using (public.is_admin_or_editor());

create policy "admin_update_subscribers"
on public.subscribers
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

create policy "admin_delete_subscribers"
on public.subscribers
for delete
to authenticated
using (public.is_admin_or_editor());

-- 10) Storage policies for the buckets currently shown in your Supabase project.
-- Public buckets can be read publicly, but uploads/updates/deletes remain admin-only.
drop policy if exists "public_read_public_storage_files" on storage.objects;
drop policy if exists "admin_read_admin_storage_files" on storage.objects;
drop policy if exists "admin_insert_admin_storage_files" on storage.objects;
drop policy if exists "admin_update_admin_storage_files" on storage.objects;
drop policy if exists "admin_delete_admin_storage_files" on storage.objects;

create policy "public_read_public_storage_files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id in ('content-images', 'product-covers', 'product-previews')
);

create policy "admin_read_admin_storage_files"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('content-images', 'product-covers', 'product-previews', 'product-files', 'lead-magnet-files')
  and public.is_admin_or_editor()
);

create policy "admin_insert_admin_storage_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('content-images', 'product-covers', 'product-previews', 'product-files', 'lead-magnet-files')
  and public.is_admin_or_editor()
);

create policy "admin_update_admin_storage_files"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('content-images', 'product-covers', 'product-previews', 'product-files', 'lead-magnet-files')
  and public.is_admin_or_editor()
)
with check (
  bucket_id in ('content-images', 'product-covers', 'product-previews', 'product-files', 'lead-magnet-files')
  and public.is_admin_or_editor()
);

create policy "admin_delete_admin_storage_files"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('content-images', 'product-covers', 'product-previews', 'product-files', 'lead-magnet-files')
  and public.is_admin_or_editor()
);
