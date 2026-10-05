-- cms_advisor_fixes — resolves `supabase db advisors` findings:
--   security   WARN function_search_path_mutable  → pin search_path on touch_updated_at
--   performance WARN multiple_permissive_policies → single consolidated SELECT policy

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop policy if exists "site_pages_anon_read_published" on public.site_pages;
drop policy if exists "site_pages_admin_read_all" on public.site_pages;
create policy "site_pages_select"
  on public.site_pages for select
  to anon, authenticated
  using (
    is_published
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );
