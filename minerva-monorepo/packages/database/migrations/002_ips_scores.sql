-- 002: IPS (Integrity of Promise Score) persistence. Plan §5.2 / §5.4.
-- entity_id: prd id (scope/stories/insight pipelines) or brief id (parse pipeline).

CREATE TABLE ips_scores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline       text NOT NULL CHECK (pipeline IN ('parse_brief', 'scope_prd', 'match_talent', 'extract_tokens', 'push_context', 'insight_synthesis', 'clarify_round', 'verify_context')),
  entity_id      uuid NOT NULL,
  ips            numeric(4, 3) NOT NULL,
  section_scores jsonb NOT NULL DEFAULT '{}',
  weights        jsonb NOT NULL DEFAULT '{}',
  run_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ips_scores_entity ON ips_scores (entity_id, run_at DESC);

ALTER TABLE ips_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY ips_operator ON ips_scores
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- Clients may read IPS reports for their own PRDs only.
CREATE POLICY ips_client ON ips_scores
  FOR SELECT
  USING (
    is_client_owner(
      (SELECT briefs.client_id
         FROM prds JOIN briefs ON briefs.id = prds.brief_id
        WHERE prds.id = entity_id)
    )
  );