-- 016: M9 client launch kit (IMPLEMENTATION_PLAN.md §20.10 — QNT-008).
-- launch_kits: the branded Client Launch Kit delivered at contract signature —
-- portal page + "How to Work With Us" guide + 30/60/90 roadmap + tools
-- orientation + welcome-video stub + instrumented early-satisfaction survey.
-- Status: draft → ready (operator-curated) → sent; distribution to a live client
-- is decision-level human-gated (§8): sent_at is written only after the operator
-- confirms, never automatically.
-- NOTE: plan §20.10 names this "migration 013", but 013–015 are already taken
-- (streams hardening, M8 change_orders, M8 prd_audits) — this is 016.

CREATE TABLE IF NOT EXISTS launch_kits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  prd_id       uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  sections     jsonb NOT NULL DEFAULT '[]',       -- LaunchKitSection[]
  roadmap      jsonb NOT NULL DEFAULT '{}',       -- Roadmap (30/60/90 + passport gate)
  survey_url   text,                              -- instrumented early-satisfaction survey
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'ready', 'sent')),
  sent_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, prd_id)
);

CREATE INDEX IF NOT EXISTS idx_launch_kits_client ON launch_kits (client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_launch_kits_prd    ON launch_kits (prd_id, created_at DESC);

ALTER TABLE launch_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY launch_kits_operator ON launch_kits
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY launch_kits_client_read ON launch_kits
  FOR SELECT USING (is_client_owner(client_id));

CREATE TRIGGER launch_kits_updated_at
  BEFORE UPDATE ON launch_kits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();