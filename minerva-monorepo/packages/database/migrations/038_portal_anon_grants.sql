-- 038: portal anonymous grants — free-tier guest access without sign-up.
--
-- Flow: an unsigned device calls POST /api/anonymous/create (no auth) and gets
-- a single-use `anon_*` grant. It exchanges the grant once at POST
-- /api/anonymous/token for a free-tier router key. To become a real account
-- the device starts a normal device flow elsewhere, then POSTs
-- /api/anonymous/promotion-intent linking its grant to that device code; the
-- desktop polls POST /api/anonymous/promotion-status until the device is
-- approved, then settles onto the real account itself.
--
-- Security posture: only the service role touches this table (all access goes
-- through server routes). RLS is enabled with no permissive policies. The
-- grant plaintext is shown exactly once at create time; only its SHA-256 is
-- stored, so a table read never yields a usable credential. Grants expire in
-- 7 days and a consumed grant can never be exchanged again — replaying a
-- captured exchange response yields nothing.
--
-- Rate limiting is per IP-hash per day, same shape as the guest-mint throttle:
-- the free tier must survive casual abuse without a captcha.
--
-- Safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS portal_anon_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SHA-256 hex of the `anon_*` grant token. The plaintext leaves the server
  -- once, at create; everything after that presents it for hashing.
  grant_hash text NOT NULL UNIQUE,
  -- Stable anonymous identity for this grant (a random id, not a user row:
  -- there is no account yet, and there may never be one).
  anon_user_id text NOT NULL,
  -- Salted SHA-256 of the caller IP, for the per-day grant throttle. A salted
  -- hash, never the address: the throttle table must not become a visitor log.
  ip_hash text NOT NULL,
  -- Agency the exchanged key belongs to. The guest agency at mint; untouched
  -- by promotion (the client settles onto the real account itself).
  org_id uuid NULL REFERENCES agencies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'consumed', 'expired', 'revoked')),
  -- Guest router key minted on first exchange. Held so a replayed exchange can
  -- be recognised as already-consumed without minting a second key.
  key_id uuid NULL REFERENCES agency_api_keys(id) ON DELETE SET NULL,
  -- Promotion link: set by promotion-intent, resolved by promotion-status.
  claim_code text NULL UNIQUE,
  claim_device_code text NULL,
  claim_status text NULL CHECK (claim_status IS NULL OR claim_status IN ('pending', 'completed', 'expired', 'denied')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'
);
CREATE INDEX IF NOT EXISTS portal_anon_grants_expires_idx ON portal_anon_grants (expires_at);
CREATE INDEX IF NOT EXISTS portal_anon_grants_ip_idx ON portal_anon_grants (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS portal_anon_grants_claim_idx ON portal_anon_grants (claim_code) WHERE claim_code IS NOT NULL;

ALTER TABLE portal_anon_grants ENABLE ROW LEVEL SECURITY;
-- No permissive policies: anon/authenticated roles can do nothing directly.
-- All access is via server routes with the service-role key (bypasses RLS).

COMMIT;
