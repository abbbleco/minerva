-- cms_rls_hardening — applied per supabase/agent-skills security checklist:
--   * explicit TO clauses on every policy (auth.role() never used)
--   * (select auth.uid()) initplan wrapping for RLS performance
--   * SECURITY DEFINER trigger fn in public: EXECUTE revoked from PUBLIC,
--     granted only to supabase_auth_admin
--   * bootstrap: profile created for the allowlisted owner email is born is_admin

-- ── profiles ────────────────────────────────────────────────────────
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- ── site_pages ──────────────────────────────────────────────────────
drop policy if exists "site_pages_anon_read_published" on public.site_pages;
create policy "site_pages_anon_read_published"
  on public.site_pages for select
  to anon, authenticated
  using (is_published);

drop policy if exists "site_pages_admin_read_all" on public.site_pages;
create policy "site_pages_admin_read_all"
  on public.site_pages for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );

-- Writes intentionally have NO policies on site_pages/profiles:
-- mutations flow exclusively through service_role Server Actions.

-- ── storage.media ───────────────────────────────────────────────────
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media_admin_write" on storage.objects;
create policy "media_admin_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );

-- NOTE: INSERT-only admin write is deliberate — the sharp pipeline writes
-- immutable uuid-keyed objects and never upserts, so UPDATE/DELETE stay denied.

-- ── handle_new_user lockdown + owner bootstrap ──────────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  owner_email constant text := 'abbbleco@gmail.com';
begin
  insert into public.profiles (id, email, is_admin)
  values (new.id, new.email, lower(new.email) = owner_email)
  on conflict (id) do nothing;
  return new;
end $$;

revoke execute on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to supabase_auth_admin;
