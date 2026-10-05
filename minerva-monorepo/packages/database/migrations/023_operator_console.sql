-- 023: Operator console + agency capability system (ROLES_ARCHITECTURE_PLAN.md).
--   /admin becomes admin-only; operators get /console scoped to their own agency.
--   Operators split into capability tiers so only some can change agency settings.
--
--   1) agency_memberships.role widens to include 'manager'
--   2) agency_memberships.permissions text[] = explicit capability grants
--      (authoritative when non-empty; tier preset used as backfill/default)
--   3) has_agency_cap() helper mirrors the TS gate used by /console
--
-- Capabilities (dot-namespaced):
--   settings.write  branding/channels/SSO/webhooks endpoints
--   keys.manage     API key create/revoke
--   members.manage  invites + in-agency role assignment
--   billing.manage  subscription/invoices/usage adjust
--   clients.manage  create/archive client workspaces
--   pipeline.write  briefs/PRDs intake + pipeline runs
--   usage.view      usage/quota dashboards
--   audit.view      agency audit trail

-- =====================================================================
-- 1) role enum: add 'manager'
-- =====================================================================
DO $$
BEGIN
  -- Drop the unnamed inline CHECK on role (auto-named *_role_check) if present.
  ALTER TABLE agency_memberships DROP CONSTRAINT IF EXISTS agency_memberships_role_check;
END $$;

ALTER TABLE agency_memberships
  ADD CONSTRAINT agency_memberships_role_check
    CHECK (role IN ('owner', 'manager', 'operator', 'viewer'));

-- =====================================================================
-- 2) permissions column + preset backfill
-- =====================================================================
ALTER TABLE agency_memberships
  ADD COLUMN IF NOT EXISTS permissions text[] NOT NULL DEFAULT '{}';

UPDATE agency_memberships SET permissions = CASE role
  WHEN 'owner' THEN ARRAY[
    'settings.write','keys.manage','members.manage','billing.manage',
    'clients.manage','pipeline.write','usage.view','audit.view']
  WHEN 'manager' THEN ARRAY[
    'settings.write','keys.manage','members.manage',
    'clients.manage','pipeline.write','usage.view','audit.view']
  WHEN 'operator' THEN ARRAY[
    'clients.manage','pipeline.write','usage.view','audit.view']
  ELSE ARRAY[]::text[]
END;

-- Legacy pre-022 installs may have used 'editor' informally in lib code only;
-- no DB rows carry it (CHECK excluded it), nothing to migrate there.

-- =====================================================================
-- 3) capability helper (SECURITY DEFINER STABLE, like is_agency_owner)
--    Owner is implicit '*' so owner rows survive even with empty perms.
-- =====================================================================
CREATE OR REPLACE FUNCTION has_agency_cap(cap text, agency_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM agency_memberships
    WHERE agency_id = agency_uuid AND user_id = auth.uid()
      AND status = 'active'
      AND (
        role = 'owner'
        OR cap = ANY (permissions)
      )
  );
$$;

-- Keep legacy editor helper working for existing RLS policies, now aware of
-- 'manager'. New console paths should prefer has_agency_cap().
-- (CREATE OR REPLACE only — a hard DROP would break dependent RLS policies.)
CREATE OR REPLACE FUNCTION is_agency_editor(agency_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM agency_memberships
    WHERE agency_id = agency_uuid AND user_id = auth.uid()
      AND role IN ('owner', 'manager', 'operator') AND status = 'active'
  );
$$;

-- Convenience: agencies the current user can open in /console.
CREATE OR REPLACE FUNCTION console_agencies()
RETURNS TABLE (agency_id uuid, slug text, name text, role text)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT a.id, a.slug, a.name, m.role
  FROM agency_memberships m
  JOIN agencies a ON a.id = m.agency_id
  WHERE m.user_id = auth.uid() AND m.status = 'active'
  ORDER BY a.name;
$$;
