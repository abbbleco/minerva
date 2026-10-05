-- 035: portal device codes — desktop/CLI sign-in via the ABBBLE portal.
--
-- Flow: device calls POST /api/portal/device/start (no auth) and shows the
-- user_code; the user approves at portal.abbble.co.za/device while signed in,
-- which mints a per-device server key; the device polls GET
-- /api/portal/device/poll until approved and receives the key exactly once.
--
-- Security posture: only the service role touches this table (all portal
-- access goes through server routes). RLS is enabled with no permissive
-- policies for anon/authenticated, so leaked anon keys and direct PostgREST
-- reads learn nothing. The device_code is a high-entropy capability: poll
-- and approve both require presenting it, and the plaintext key leaves the
-- server exactly once (consumed flag) before expiry (15 min).
--
-- Safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS portal_device_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code text NOT NULL UNIQUE,
  user_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'consumed')),
  agency_id uuid NULL REFERENCES agencies(id) ON DELETE CASCADE,
  key_id uuid NULL REFERENCES agency_api_keys(id) ON DELETE SET NULL,
  -- Single-use bearer for the polling device: the minted router key, held at
  -- most until expiry and wiped on first poll read. Service-role-only, like
  -- every other column here; an OAuth auth code by another name.
  key_token text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '15 minutes',
  approved_at timestamptz NULL,
  consumed_at timestamptz NULL
);
CREATE INDEX IF NOT EXISTS portal_device_codes_expires_idx ON portal_device_codes (expires_at);
CREATE INDEX IF NOT EXISTS portal_device_codes_user_code_idx ON portal_device_codes (user_code);

ALTER TABLE portal_device_codes ENABLE ROW LEVEL SECURITY;
-- No permissive policies: anon/authenticated roles can do nothing directly.
-- All access is via server routes with the service-role key (bypasses RLS).

COMMIT;
