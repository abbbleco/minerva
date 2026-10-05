-- 017: M9 early-satisfaction survey responses (IMPLEMENTATION_PLAN.md §20.10).
-- launch_kit_surveys: the instrumented survey from the launch kit route
-- (/api/v8/onboarding/survey/[clientId]). Responses are collected in the app
-- rather than the message ledger so the CLIENT can write their own row (RLS
-- INSERT policy) while `ingested_events` stays operator-append-only.
-- NOTE: plan §20.10 names this "migration 014", but 014-016 are already taken
-- (M8 change_orders, M8 prd_audits, M9 launch_kits) — this is 017.

CREATE TABLE IF NOT EXISTS launch_kit_surveys (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_kit_id  uuid NOT NULL REFERENCES launch_kits (id) ON DELETE CASCADE,
  client_id      uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  satisfaction   integer NOT NULL CHECK (satisfaction BETWEEN 1 AND 5),
  clarity        integer NOT NULL CHECK (clarity BETWEEN 1 AND 5),
  comments       text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_launch_kit_surveys_kit   ON launch_kit_surveys (launch_kit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_launch_kit_surveys_client ON launch_kit_surveys (client_id, created_at DESC);

ALTER TABLE launch_kit_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY launch_kit_surveys_operator ON launch_kit_surveys
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY launch_kit_surveys_client ON launch_kit_surveys
  FOR INSERT WITH CHECK (is_client_owner(client_id));
CREATE POLICY launch_kit_surveys_client_read ON launch_kit_surveys
  FOR SELECT USING (is_client_owner(client_id));