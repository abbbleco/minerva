-- 041: portal intake submissions — website-form funnel into the PRD pipeline.
--
-- The agency-web contact form posts to /api/v1/intake (proxied), and the
-- portal upstream stores each submission here and returns its id immediately
-- (under a second, no model calls). A Minerva backend drains `queued` rows
-- into the Phase-4 intake pipeline (triage → drafting → review), where the
-- submission becomes a cited source on the drafted PRD.
--
-- Abuse accounting mirrors 040 (hashes + timestamps, never content for
-- throttle purposes): per-key throttling reads key_hash + created_at.
-- Submissions themselves hold PII (email, brief) and are service-role only.
--
-- Safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS portal_intake_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SHA-256 of the site API key (agency_api_keys.key_hash): throttle scope
  -- and drain ownership — a key only ever sees/acks its own rows.
  key_hash text NOT NULL,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  brief text NOT NULL,
  client_email text NOT NULL,
  organization_name text NOT NULL,
  source text NOT NULL DEFAULT 'web_form',
  media_url text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'done', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS portal_intake_submissions_drain_idx
  ON portal_intake_submissions (status, created_at);
CREATE INDEX IF NOT EXISTS portal_intake_submissions_throttle_idx
  ON portal_intake_submissions (key_hash, created_at);

ALTER TABLE portal_intake_submissions ENABLE ROW LEVEL SECURITY;
-- No permissive policies: anon/authenticated roles can do nothing directly.
-- All access is via server routes with the service-role key (bypasses RLS).

COMMIT;
