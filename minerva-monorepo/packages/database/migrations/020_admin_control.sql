-- 020: M-ADMIN admin control plane (ADMIN_IMPLEMENTATION.md).
-- 1. config_registry — single source of truth the /admin UI renders; every
--    runtime knob Minerva exposes to operators (code-default-first: overrides
--    live in system_config, never here).
-- 2. admin_audit_log — append-only (no UPDATE/DELETE policy), tamper-obvious.
-- 3. Seed ~40 registry keys with the verified code constants (admin_research.md).
-- Note: change_orders multi-gateway generalisation (payment_provider) is
-- deferred to a follow-on migration — see ADMIN_IMPLEMENTATION.md §3.4 note.

CREATE TABLE IF NOT EXISTS config_registry (
  key          text PRIMARY KEY,
  "group"      text NOT NULL,
  type         text NOT NULL CHECK (type IN ('number', 'string', 'boolean', 'object', 'json')),
  default_value jsonb NOT NULL,
  min          numeric,
  max          numeric,
  enum_values  jsonb,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE config_registry ENABLE ROW LEVEL SECURITY;

-- Clients never see the registry; operators/admins full access.
CREATE POLICY registry_operator ON config_registry
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- Keep registry rows from ever being deleted by app flows (metadata only).
-- Config deletions go through system_config overrides; registry is append-only
-- by contract but we leave DELETE open to operators for key remediation.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id             bigserial PRIMARY KEY,
  actor_id       uuid REFERENCES profiles(id),
  actor_role     text,
  category       text NOT NULL,
  action         text NOT NULL,
  target_type    text,
  target_id      text,
  payload_before jsonb,
  payload_after  jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Read + insert only. No update/delete policy: the log is append-only.
CREATE POLICY audit_read ON admin_audit_log
  FOR SELECT USING (is_operator());
CREATE POLICY audit_insert ON admin_audit_log
  FOR INSERT WITH CHECK (is_operator());

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_category ON admin_audit_log (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON admin_audit_log (actor_id, created_at DESC);

-- =====================================================================
-- Seed config_registry (code-default-first; mirrors admin_research.md).
-- Values verified against packages/ai-core/src as of 2026-08-20.
-- =====================================================================

INSERT INTO config_registry (key, "group", type, default_value, min, max, enum_values, description) VALUES
  -- AI models -------------------------------------------------------
  ('ai.models.scope',     'ai.models', 'string', '"gemini-2.5-flash"',      NULL, NULL,
     '["gemini-2.5-flash","gemini-2.5-flash-lite","gemini-3.1-pro-preview","gemini-2.5-pro"]',
     'Model for scope-detection / PRD structuring (SCOPE_MODEL).'),
  ('ai.models.review',    'ai.models', 'string', '"gemini-3.1-pro-preview"', NULL, NULL,
     '["gemini-2.5-flash","gemini-3.1-pro-preview","gemini-2.5-pro"]',
     'Review model for PRD generation + delta-scope (REVIEW_MODEL).'),
  ('ai.models.classify',  'ai.models', 'string', '"gemini-2.5-flash"',      NULL, NULL,
     '["gemini-2.5-flash","gemini-2.5-flash-lite"]',
     '6-way stream message classification (CLASSIFY_MODEL).'),
  ('ai.models.cdv',       'ai.models', 'string', '"gemini-2.5-flash"',      NULL, NULL,
     '["gemini-2.5-flash","gemini-2.5-flash-lite"]',
     'Context delivery verification (CDV_MODEL).'),
  ('ai.models.embedding', 'ai.models', 'string', '"text-embedding-004"',    NULL, NULL,
     '["text-embedding-004"]',
     'Embedding model — schema dimension is 768; do not change without re-indexing.'),
  ('ai.models.embedding_dim', 'ai.models', 'number', '768', 256, 3072, NULL,
     'Vector dimension used by AlloyDB pgvector (EMBEDDING_DIM). Locked to 768 today.'),

  -- AI thresholds ---------------------------------------------------
  ('ai.thresholds.cdv_pass_rate',        'ai.thresholds', 'number', '0.9', 0.5, 1.0, NULL,
     'Context delivery verification pass-rate floor (MIN_CDV_PASS_RATE).'),
  ('ai.thresholds.classify_confidence',  'ai.thresholds', 'number', '0.8', 0.5, 1.0, NULL,
     'Minimum confidence for the 6-way classifier to trust a label.'),
  ('ai.thresholds.talent_min_trust',     'ai.thresholds', 'number', '0.8', 0.0, 1.0, NULL,
     'Talent match trust floor (MIN_TALENT_TRUST).'),
  ('ai.thresholds.qa_coverage_threshold','ai.thresholds', 'number', '0.85', 0.0, 1.0, NULL,
     'QA coverage pass threshold (DEFAULT_COVERAGE_THRESHOLD).'),
  ('ai.thresholds.qa_coverage_cap',      'ai.thresholds', 'number', '0.95', 0.5, 1.0, NULL,
     'QA coverage ceiling (COVERAGE_CAP).'),
  ('ai.thresholds.scope_sim_threshold',  'ai.thresholds', 'number', '0.75', 0.0, 1.0, NULL,
     'Scope-detect cosine/word similarity floor (SCOPE_SIM_THRESHOLD).'),
  ('ai.thresholds.scope_word_sim_threshold', 'ai.thresholds', 'number', '0.5', 0.0, 1.0, NULL,
     'Already-tracked containment floor (WORD_SIM_THRESHOLD).'),
  ('ai.thresholds.shadow_pm_detect_accuracy', 'ai.thresholds', 'number', '0.9', 0.0, 1.0, NULL,
     'Eval gate: golden/classifier detect accuracy (lib/eval.ts).'),
  ('ai.thresholds.shadow_pm_recall',     'ai.thresholds', 'number', '0.8', 0.0, 1.0, NULL,
     'Eval gate: shadow-PM recall (lib/eval.ts).'),
  ('ai.thresholds.guardrail_detection',  'ai.thresholds', 'number', '0.95', 0.5, 1.0, NULL,
     'Eval gate: guardrail detection (lib/eval.ts).'),
  ('ai.thresholds.qa_gate_coverage',     'ai.thresholds', 'number', '0.85', 0.0, 1.0, NULL,
     'Reporting QA gate coverage (lib/eval.ts).'),
  ('ai.thresholds.min_ips_eval',         'ai.thresholds', 'number', '0.5', 0.0, 1.0, NULL,
     'Eval-gate minimum IPS per case (eval_cases.thresholds.min_ips).'),
  ('ai.thresholds.ips_baseline_ci',      'ai.thresholds', 'number', '0.8', 0.0, 1.0, NULL,
     'Weekly regression mean-IPS floor (MINERVA_IPS_BASELINE).'),

  -- AI pricing ------------------------------------------------------
  ('ai.pricing.gemini-2.5-flash',        'ai.pricing', 'object',
     '{"input":0.3,"output":2.5}', 0, NULL, NULL,
     'USD per 1M tokens for gemini-2.5-flash (also the fallback for unknown models).'),
  ('ai.pricing.gemini-2.5-flash-lite',   'ai.pricing', 'object',
     '{"input":0.1,"output":0.4}', 0, NULL, NULL,
     'USD per 1M tokens for gemini-2.5-flash-lite.'),
  ('ai.pricing.gemini-2.5-pro',          'ai.pricing', 'object',
     '{"input":1.25,"output":10.0}', 0, NULL, NULL,
     'USD per 1M tokens for gemini-2.5-pro (legacy key).'),
  ('ai.pricing.gemini-3.1-pro-preview',  'ai.pricing', 'object',
     '{"input":1.25,"output":10.0}', 0, NULL, NULL,
     'USD per 1M tokens for gemini-3.1-pro-preview.'),
  ('ai.pricing.gemma-4-12b-it',          'ai.pricing', 'object',
     '{"input":0.7,"output":2.8}', 0, NULL, NULL,
     'USD per 1M tokens for gemma-4-12b-it (T3 estimate).'),
  ('ai.pricing.text-embedding-004',      'ai.pricing', 'object',
     '{"input":0.1,"output":0.0}', 0, NULL, NULL,
     'USD per 1M tokens for text-embedding-004.'),

  -- Retention -------------------------------------------------------
  ('retention.research_artifacts', 'retention', 'object', '{"days":90}', NULL, NULL, NULL,
     'Research-artifact retention window (days) — most sensitive data class.'),
  ('retention.ingested_events',    'retention', 'object', '{"days":365}', NULL, NULL, NULL,
     'Ingested-events ledger retention window (days).'),

  -- Autonomy ladder -------------------------------------------------
  ('ladder.l2.calls',               'ladder', 'number', '10',  1,  100000, NULL, 'L2 min calls.'),
  ('ladder.l2.success_rate',        'ladder', 'number', '0.95', 0, 1, NULL, 'L2 min success rate.'),
  ('ladder.l2.needs_attention_rate','ladder', 'number', '0.1',  0, 1, NULL, 'L2 max needs-attention rate.'),
  ('ladder.l2.incidents',           'ladder', 'number', '2',   0,  1000,  NULL, 'L2 max incidents.'),
  ('ladder.l3.calls',               'ladder', 'number', '50',  1,  100000, NULL, 'L3 min calls.'),
  ('ladder.l3.success_rate',        'ladder', 'number', '0.98', 0, 1, NULL, 'L3 min success rate.'),
  ('ladder.l3.needs_attention_rate','ladder', 'number', '0.05', 0, 1, NULL, 'L3 max needs-attention rate.'),
  ('ladder.l3.incidents',           'ladder', 'number', '1',   0,  1000,  NULL, 'L3 max incidents.'),
  ('ladder.l3.classifier_ips',      'ladder', 'number', '0.7',  0, 1, NULL, 'L3 classifier IPS floor when known.'),

  -- Demos -----------------------------------------------------------
  ('demos.budget_sec',            'demos', 'number', '300', 30, 3600, NULL, 'Sprint demo budget seconds (DEMO_BUDGET_SEC).'),
  ('demos.default_throughput_fps','demos', 'number', '12',  1,  60,   NULL, 'Demo render throughput fps.'),

  -- Streams / scope -------------------------------------------------
  ('streams.stripe_max_skew_ms',  'streams', 'number', '300000', 0, 3600000, NULL,
     'Stripe webhook signature replay window (ms).'),

  -- Payments (Africa-first multi-gateway) ---------------------------
  ('payments.gateway',       'payments', 'string', '"paystack"', NULL, NULL,
     '["paystack","stripe","paypal"]',
     'Active payment gateway for change-order billing.'),
  ('payments.currency',      'payments', 'string', '"ZAR"', NULL, NULL,
     '["ZAR","NGN","GHS","KES","USD"]',
     'Billing currency (must be supported by the active gateway).'),
  ('payments.description_chars', 'payments', 'number', '250', 50, 2000, NULL,
     'Checkout line-item description truncation length.'),
  ('payments.signature_skew_ms', 'payments', 'number', '300000', 0, 3600000, NULL,
     'Webhook signature replay window (ms) for timestamped providers.'),
  ('gateways.stripe.enabled',   'payments', 'boolean', 'false', NULL, NULL, NULL,
     'Enable Stripe gateway (live when STRIPE_SECRET_KEY set).'),
  ('gateways.paystack.enabled', 'payments', 'boolean', 'true', NULL, NULL, NULL,
     'Enable Paystack gateway (Africa default; live when PAYSTACK_SECRET_KEY set).'),
  ('gateways.paypal.enabled',   'payments', 'boolean', 'false', NULL, NULL, NULL,
     'Enable PayPal gateway (live when PAYPAL_CLIENT_ID/SECRET set).'),

  -- System ----------------------------------------------------------
  ('system.demo_mode',      'system', 'boolean', 'false', NULL, NULL, NULL,
     'Demo mode (fixture pipeline, no Vertex calls) — derived from MINERVA_DEMO_MODE.'),
  ('system.ips_baseline',   'system', 'number', '0.8', 0, 1, NULL,
     'System-wide mean-IPS regression baseline.')

ON CONFLICT (key) DO NOTHING;

-- =====================================================================
-- Additive supporting indexes (§3.5 of ADMIN_IMPLEMENTATION.md)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created ON pipeline_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status_created ON incidents (resolved_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_channels_client ON client_channels (client_id);
CREATE INDEX IF NOT EXISTS idx_briefs_client_status ON briefs (client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
