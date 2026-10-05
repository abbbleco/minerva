-- 040: portal contact requests — throttle log for the sales contact form.
--
-- The /api/contact-sales endpoint is unauthenticated by design (it is how a
-- stranger first reaches sales), which makes it a spam vector into a human
-- inbox. The throttle is per salted IP-hash per hour; the table holds hashes
-- and timestamps only, never the submitted names, emails or messages.
--
-- Safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS portal_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Salted SHA-256 of the caller IP: abuse accounting without a visitor log.
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_contact_requests_ip_idx ON portal_contact_requests (ip_hash, created_at);

ALTER TABLE portal_contact_requests ENABLE ROW LEVEL SECURITY;
-- No permissive policies: anon/authenticated roles can do nothing directly.
-- All access is via server routes with the service-role key (bypasses RLS).

COMMIT;
