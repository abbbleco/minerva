-- 036: portal guest mints -- try-before-sign-in via ABBBLE portal keys.
--
-- Flow: an unsigned device calls POST /api/portal/guest/mint (no auth) and
-- receives a free-tier-only router key, so "try Minerva" works before anyone
-- has an account. Signing in later mints a real per-device key (035).
--
-- Abuse containment, in order:
--   1. per-IP throttle (MINERVA_GUEST_MINTS_PER_DAY, default 3/24h) enforced
--      against this table with a salted IP hash;
--   2. guest keys belong to a dedicated `guest` agency whose plan is 'free',
--      so the router's existing allowedModelsForPlan() gate confines them to
--      MINERVA_FREE_MODELS -- a minted key can never touch agency credits.
--      This is why guests get their own agency rather than the platform
--      'abbble-co' agency, which is on the enterprise plan;
--   3. free models are rate-limited upstream by the shared providers.
--
-- The guest agency carries no memberships, so nobody can sign into it, and its
-- keys are listed under a `guest:` name prefix for support triage.
--
-- Only the service role touches these tables (server routes). RLS is enabled
-- with no permissive policies for anon/authenticated.
--
-- Safe to re-run.

BEGIN;

-- Dedicated free-plan agency for guest keys. NOT the platform agency: this one
-- must stay on plan 'free' so the router's free-model gate applies.
INSERT INTO agencies (name, slug, status, plan, settings, trial_ends_at)
SELECT 'Minerva Guests', 'guest', 'active', 'free', '{"purpose":"guest-keys"}', NULL
WHERE NOT EXISTS (SELECT 1 FROM agencies WHERE slug = 'guest');

CREATE TABLE IF NOT EXISTS portal_guest_mints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SHA-256 of the client IP with a server-side salt; the raw IP is never stored.
  ip_hash text NOT NULL,
  -- Set when the router key insert succeeded; lets support correlate a mint with
  -- a key row, and is NULL only if the key insert failed after we recorded intent.
  key_id uuid NULL REFERENCES agency_api_keys(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_guest_mints_ip_created_idx
  ON portal_guest_mints (ip_hash, created_at DESC);

ALTER TABLE portal_guest_mints ENABLE ROW LEVEL SECURITY;
-- No permissive policies: anon/authenticated roles can do nothing directly.
-- All access is via server routes with the service-role key (bypasses RLS).

COMMIT;