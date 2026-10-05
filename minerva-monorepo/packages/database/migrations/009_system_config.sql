-- Minerva M3: runtime guards (§18.5). Global kill switch lives in system_config
-- (per-project pause already exists: project_contexts.paused). Seed the
-- default state so `getKillSwitch` always has a row.

CREATE TABLE IF NOT EXISTS system_config (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_operator ON system_config
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role <> 'client'));

INSERT INTO system_config (key, value)
VALUES ('kill_switch', '{"global_paused": false}')
ON CONFLICT (key) DO NOTHING;