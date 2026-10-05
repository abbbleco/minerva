-- 018: M10 retention + knowledge (IMPLEMENTATION_PLAN.md §20.7/§20.8 — QNT-005/QNT-006).
-- client_scores: Client Satisfaction Score (CSS 0–100) + churn probability with
-- explainable breakdown, windowed over the §19 ingested_events ledger. Privacy
-- rule: scores are aggregate metadata only — never message bodies.
-- project_dna: living "know the project in an hour" synthesis (timeline,
-- decision tree w/ DRI, gotchas, architecture, personas) — every section claim
-- carries a source_ref under the §5.2 provenance lock; versions bump on
-- regeneration (§6.6 changelog events).
-- NOTE: plan §20.11 names this "migration 014", but 014–017 are already taken
-- (M8 change_orders, M8 prd_audits, M9 launch_kits, M9 launch_kit_surveys) —
-- this is 018. Column `window` is a PostgreSQL reserved word — shipped as
-- `window_label` (deviation noted in CHANGELOG).

CREATE TABLE IF NOT EXISTS client_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  css               numeric(5, 2) NOT NULL,      -- 0–100 Client Satisfaction Score
  churn_probability numeric(4, 3) NOT NULL,      -- 0–1
  breakdown         jsonb NOT NULL DEFAULT '{}', -- explainable: {components, drivers, trend}
  window_label      text NOT NULL,               -- e.g. 'rolling_7d' | 'rolling_30d' | 'YYYY-MM|YYYY-MM'
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_scores_client ON client_scores (client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS project_dna (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id         uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  version        int NOT NULL DEFAULT 1,
  sections       jsonb NOT NULL DEFAULT '[]',  -- DnaSection[] (source_ref'd)
  regenerated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_dna_prd ON project_dna (prd_id, version DESC);

ALTER TABLE client_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY client_scores_operator ON client_scores
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY client_scores_client ON client_scores
  FOR SELECT USING (is_client_owner(client_id));

ALTER TABLE project_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_dna_operator ON project_dna
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY project_dna_client ON project_dna
  FOR SELECT USING (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)));