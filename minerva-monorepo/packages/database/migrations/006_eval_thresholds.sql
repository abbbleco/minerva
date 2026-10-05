-- M2 eval: add per-case quality thresholds for the golden-case harness
-- (min_ips / min_stories / min_goals). Defaults {} = unset (report-only).

ALTER TABLE eval_cases ADD COLUMN IF NOT EXISTS thresholds jsonb NOT NULL DEFAULT '{}';

UPDATE eval_cases SET thresholds = thresholds || '{"min_ips": 0.5, "min_stories": 6, "min_goals": 3}'::jsonb
WHERE fixture_only = false AND thresholds = '{}'::jsonb;