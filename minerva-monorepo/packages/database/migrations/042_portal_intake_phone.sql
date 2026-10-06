-- 042: optional caller phone on portal intake submissions.
--
-- The website contact form gained an optional phone field; the upstream
-- validates and stores it here, and the Minerva drain forwards it into the
-- intake event's contact line (no IntakeEvent schema change — the number
-- rides the existing thread_context, like the email).
--
-- Safe to re-run.

BEGIN;

ALTER TABLE portal_intake_submissions
  ADD COLUMN IF NOT EXISTS client_phone text;

COMMIT;
