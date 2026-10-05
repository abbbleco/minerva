-- 015: M8 shadow PM (IMPLEMENTATION_PLAN.md §20.6 — QNT-004).
-- prd_audits: the 5-dimension gap audit of a finished PRD draft
-- (error handling / edge cases / security / performance / UX) with Critical /
-- High / Medium / Low priorities. One row per audit run; status:
--   open → asked (clarify round ≤2 / 72h) → answered → closed.
-- Unanswered gaps land in prds.assumptions flagged is_question (§16).

CREATE TABLE IF NOT EXISTS prd_audits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id          uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  gaps            jsonb NOT NULL DEFAULT '[]',       -- GapAudit[]
  source_snapshot jsonb NOT NULL DEFAULT '{}',       -- PrdAuditSource at audit time (§5.2 provenance)
  model           text NOT NULL,                     -- "deterministic" or model name
  status          text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'asked', 'answered', 'closed')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prd_audits_prd ON prd_audits (prd_id, created_at DESC);

ALTER TABLE prd_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY prd_audits_owner ON prd_audits
  FOR ALL USING (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)))
  WITH CHECK (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)));
CREATE POLICY prd_audits_operator ON prd_audits
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());