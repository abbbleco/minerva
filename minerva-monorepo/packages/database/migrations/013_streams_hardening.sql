-- 013: Phase 4 M7 hardening (IMPLEMENTATION_PLAN.md §19.9, §15 #12).
-- 1) Extend the channel/source CHECKs to the remaining M7 providers
--    (Discord, Teams, GitLab, Jira, Zeplin, Loom) so they can route through
--    the same client_channels registry, ingested_events ledger and brief
--    source provenance as the M5/M6 channels.
-- 2) stream_cost_days — persisted per-stream AgentOps cost rows (§19.9):
--    daily rollup of the ingest_* pipeline_runs so cost chargeback per
--    channel is queryable even after pipeline_runs is purged.
-- 3) retention_runs — audit trail for the §15 #12 retention job (research
--    data default 90-day window, ledger window, delete-on-request runs).

-- --- 1) Extended provider enums ---
ALTER TABLE client_channels DROP CONSTRAINT IF EXISTS client_channels_channel_check;
ALTER TABLE client_channels ADD CONSTRAINT client_channels_channel_check
  CHECK (channel IN ('whatsapp', 'slack', 'github', 'meeting', 'docs', 'figma',
                     'discord', 'teams', 'gitlab', 'jira', 'zeplin', 'loom'));

ALTER TABLE ingested_events DROP CONSTRAINT IF EXISTS ingested_events_channel_check;
ALTER TABLE ingested_events ADD CONSTRAINT ingested_events_channel_check
  CHECK (channel IN ('whatsapp', 'slack', 'github', 'meeting', 'docs', 'figma',
                     'discord', 'teams', 'gitlab', 'jira', 'zeplin', 'loom'));

ALTER TABLE briefs DROP CONSTRAINT IF EXISTS briefs_source_check;
ALTER TABLE briefs ADD CONSTRAINT briefs_source_check
  CHECK (source IN ('web_form', 'pdf', 'audio', 'api', 'whatsapp', 'slack',
                    'meeting', 'docs', 'figma', 'github',
                    'discord', 'teams', 'gitlab', 'jira', 'zeplin', 'loom'));

-- --- 2) Per-stream AgentOps cost rows (§19.9) ---
CREATE TABLE IF NOT EXISTS stream_cost_days (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel           text NOT NULL
    CHECK (channel IN ('whatsapp', 'slack', 'github', 'meeting', 'docs', 'figma',
                       'discord', 'teams', 'gitlab', 'jira', 'zeplin', 'loom')),
  day               date NOT NULL,
  calls             integer NOT NULL DEFAULT 0,
  success_rate      numeric(5,2) NOT NULL DEFAULT 0,
  total_cost_usd    numeric(14,6) NOT NULL DEFAULT 0,
  total_input_tokens  integer NOT NULL DEFAULT 0,
  total_output_tokens integer NOT NULL DEFAULT 0,
  avg_latency_ms    integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, day)
);
ALTER TABLE stream_cost_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY stream_cost_days_operator ON stream_cost_days
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
-- Deliberately NO client policy: these are operator/AgentOps aggregates of the
-- full client book; cross-client totals must not be readable by any one client
-- (aggregate metadata leak, §15 #12 privacy).

-- --- 3) Retention job audit trail (§15 #12) ---
CREATE TABLE IF NOT EXISTS retention_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope         text NOT NULL,
  cutoff        timestamptz NOT NULL,
  deleted_rows  integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE retention_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY retention_runs_operator ON retention_runs
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
-- No client policy: run history exposes scopes/counts across the client book.

-- Retention window defaults (§15 #12: research 90 days, ledger 365 days).
-- Overridable via system_config keys retention.research_artifacts /
-- retention.ingested_events.
INSERT INTO system_config (key, value) VALUES
  ('retention.research_artifacts', '{"days": 90}'),
  ('retention.ingested_events', '{"days": 365}')
ON CONFLICT (key) DO NOTHING;