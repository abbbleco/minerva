-- 0001_cms_init.sql — agency-web headless CMS bootstrap
-- Run against Supabase Postgres (dashboard SQL Editor or scripts/migrations runner).
-- Idempotent: safe to re-run.
--
-- Portability notes (vendor lock-in shield):
--   * Plain Postgres types only; content lives in ONE JSONB column.
--   * Only Supabase-specific coupling: auth.users FK + auth.uid() helpers.
--     To migrate away, swap those for your own users table/session helpers.

create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────────────
-- Profiles (mirrors auth.users; is_admin flag per skill Rule 6)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────
-- site_pages — single JSONB content table (skill Rule 3)
-- NOTE: column is `page_group` ("group" is a reserved SQL keyword).
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.site_pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  page_group   text not null default 'custom'
               check (page_group in (
                 'home','about','contact','services','industries',
                 'solutions','works','resources','blog_post',
                 'policy','custom')),
  title        text not null,
  seo          jsonb not null default '{}',
  sections     jsonb not null default '[]' check (jsonb_typeof(sections) = 'array'),
  is_published boolean not null default false,
  published_at timestamptz,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists site_pages_published_idx
  on public.site_pages (page_group, is_published, published_at desc);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists site_pages_touch on public.site_pages;
create trigger site_pages_touch
  before update on public.site_pages
  for each row execute function public.touch_updated_at();

alter table public.site_pages enable row level security;

-- anon/browser (anon key): published rows only — backs ISR public reads if ever used client-side
drop policy if exists "site_pages_anon_read_published" on public.site_pages;
create policy "site_pages_anon_read_published" on public.site_pages
  for select using (is_published);

-- authenticated admins: full read (writes intentionally have NO policies ⇒ service_role only)
drop policy if exists "site_pages_admin_read_all" on public.site_pages;
create policy "site_pages_admin_read_all" on public.site_pages
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );

-- ────────────────────────────────────────────────────────────────────
-- Storage: public 'media' bucket (skill Rule 4 pipeline target)
-- Guarded so a permissions quirk can never fail the core tables above.
-- ────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'media') then
    insert into storage.buckets (id, name, public)
    values ('media', 'media', true);
  end if;
exception when others then
  raise warning '[cms] bucket creation skipped: %', sqlerrm;
end $$;

do $$
begin
  drop policy if exists "media_public_read" on storage.objects;
  create policy "media_public_read" on storage.objects
    for select using (bucket_id = 'media');

  drop policy if exists "media_admin_write" on storage.objects;
  create policy "media_admin_write" on storage.objects
    for insert with check (
      bucket_id = 'media'
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_admin
      )
    );
exception when others then
  raise warning '[cms] storage policies skipped: %', sqlerrm;
end $$;
