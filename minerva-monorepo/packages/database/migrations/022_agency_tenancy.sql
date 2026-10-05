-- 022: M-SAAS-P0 agency tenancy (AGENCY_IMP_PLAN.md §3.1).
--   agencies            — the tenant
--   agency_memberships  — owner / operator / viewer per agency (multi-agency users)
--   agency_api_keys     — per-agency credentials (sha256 at rest, view-once)
--   agency_webhooks     — outbound delivery config (P1 hook; storage now)
--   webhook_deliveries  — retryable delivery log (P1 hook; storage now)
--   agency_usage        — monthly metered counters (briefs/prds/ai_tokens/...)
-- Tenancy FKs: clients.agency_id + briefs.agency_id (NOT NULL after backfill),
--   briefs.metadata jsonb (utm/source context), and a BEFORE trigger that
--   fills briefs.agency_id from client (or the platform 'abbble-co' agency).
-- RLS: platform staff via is_operator(); agency members via is_agency_member().

-- =====================================================================
-- agencies
-- =====================================================================

CREATE TABLE IF NOT EXISTS agencies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  status        text NOT NULL DEFAULT 'trial'
                CHECK (status IN ('trial', 'active', 'suspended')),
  plan          text NOT NULL DEFAULT 'hobby',
  created_by    uuid REFERENCES auth.users(id),
  settings      jsonb NOT NULL DEFAULT '{}',
  trial_ends_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agency_memberships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_email text,
  role         text NOT NULL CHECK (role IN ('owner', 'operator', 'viewer')),
  status       text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'invited', 'suspended')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, user_id)
);
-- Invite dedupe: only one pending invite per agency/email.
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_invite_email
  ON agency_memberships (agency_id, invite_email) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_user
  ON agency_memberships (agency_id, user_id) WHERE user_id IS NOT NULL;
-- Repair path for installs that ran the pre-fix 022 (PK on (agency_id,user_id) with nullable user_id).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'agency_memberships' AND constraint_type = 'PRIMARY KEY'
      AND constraint_name != 'agency_memberships_pkey'
  ) THEN
    -- legacy PK name varies; drop it if it is the composite one
    BEGIN
      ALTER TABLE agency_memberships DROP CONSTRAINT IF EXISTS agency_memberships_pkey;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agency_memberships' AND column_name='id') THEN
    ALTER TABLE agency_memberships ADD COLUMN id uuid DEFAULT gen_random_uuid();
    UPDATE agency_memberships SET id = gen_random_uuid() WHERE id IS NULL;
    ALTER TABLE agency_memberships ADD PRIMARY KEY (id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS agency_api_keys (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id          uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name               text NOT NULL,
  purpose            text NOT NULL CHECK (purpose IN ('server', 'publishable')),
  key_prefix         text NOT NULL,
  key_last4          text NOT NULL,
  key_hash           text UNIQUE NOT NULL,
  status             text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'revoked', 'expired')),
  rate_limit_per_min int,
  rate_window_start  timestamptz,
  rate_window_count  int NOT NULL DEFAULT 0,
  last_used_at       timestamptz,
  expires_at         timestamptz,
  revoked_at         timestamptz,
  revoked_by         uuid REFERENCES auth.users(id),
  revoked_reason     text,
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now()
);
-- Repair: add revoked_* columns for installs that ran pre-fix 022
ALTER TABLE agency_api_keys ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id);
ALTER TABLE agency_api_keys ADD COLUMN IF NOT EXISTS revoked_reason text;

CREATE TABLE IF NOT EXISTS agency_webhooks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  event           text NOT NULL,
  url             text NOT NULL,
  signing_secret  text NOT NULL,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'paused')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, event)
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id        uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  event            text NOT NULL,
  entity_type      text NOT NULL,
  entity_id        uuid NOT NULL,
  payload          jsonb NOT NULL,
  attempt          int NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'delivered', 'failed', 'permanent_failure')),
  last_status_code int,
  next_retry_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  delivered_at     timestamptz
);

CREATE TABLE IF NOT EXISTS agency_usage (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id        uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  period           text NOT NULL,            -- YYYY-MM
  metric           text NOT NULL
                   CHECK (metric IN ('briefs', 'prds', 'ai_tokens', 'pipeline_runs', 'storage_mb')),
  value            numeric NOT NULL DEFAULT 0,
  last_updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, period, metric)
);

-- =====================================================================
-- Tenancy on existing tables + metadata
-- =====================================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES agencies(id);
ALTER TABLE briefs  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES agencies(id);
ALTER TABLE briefs  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- Seed the platform's own agency (single-tenant rows attach here).
INSERT INTO agencies (name, slug, status, plan, settings, trial_ends_at)
SELECT 'Abbble Co', 'abbble-co', 'active', 'enterprise',
       '{"allowed_redirects":[]}'::jsonb, NULL
WHERE NOT EXISTS (SELECT 1 FROM agencies WHERE slug = 'abbble-co');

-- Backfill every orphan row to the platform agency, then lock it in.
UPDATE clients c SET agency_id = (SELECT id FROM agencies WHERE slug = 'abbble-co')
WHERE c.agency_id IS NULL;
UPDATE briefs b SET agency_id = (SELECT id FROM agencies WHERE slug = 'abbble-co')
WHERE b.agency_id IS NULL;

ALTER TABLE clients ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE briefs  ALTER COLUMN agency_id SET NOT NULL;

-- Keep briefs.agency_id in lock-step with its client; default to the platform
-- agency when there is no client yet (streams/direct inserts keep working).
-- When client_id is set/changed the brief inherits that client's agency_id
-- (prevents drift if a brief is re-pointed at a different agency's client).
CREATE OR REPLACE FUNCTION set_brief_agency()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  platform_agency uuid;
  client_agency uuid;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    SELECT agency_id INTO client_agency FROM clients WHERE id = NEW.client_id;
    IF client_agency IS NOT NULL THEN
      NEW.agency_id := client_agency;
    END IF;
  END IF;
  IF NEW.agency_id IS NULL THEN
    SELECT id INTO platform_agency FROM agencies WHERE slug = 'abbble-co';
    NEW.agency_id := platform_agency;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS briefs_agency_default ON briefs;
CREATE TRIGGER briefs_agency_default
  BEFORE INSERT OR UPDATE OF client_id ON briefs
  FOR EACH ROW EXECUTE FUNCTION set_brief_agency();

-- =====================================================================
-- Indexes
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_clients_agency ON clients (agency_id);
CREATE INDEX IF NOT EXISTS idx_briefs_agency_status ON briefs (agency_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON agency_api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_usage_agency_period ON agency_usage (agency_id, period);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries (status, next_retry_at);

-- =====================================================================
-- Roles helpers (SECURITY DEFINER, STABLE like the existing is_operator/)
-- Must be created AFTER agency_memberships table exists.
-- =====================================================================

CREATE OR REPLACE FUNCTION is_agency_member(agency_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM agency_memberships
    WHERE agency_id = agency_uuid AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION is_agency_owner(agency_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM agency_memberships
    WHERE agency_id = agency_uuid AND user_id = auth.uid() AND role = 'owner' AND status = 'active'
  );
$$;

-- owner + operator = the two roles that may manage keys/webhooks/members.
CREATE OR REPLACE FUNCTION is_agency_editor(agency_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM agency_memberships
    WHERE agency_id = agency_uuid AND user_id = auth.uid()
      AND role IN ('owner', 'operator') AND status = 'active'
  );
$$;

-- =====================================================================
-- RLS
-- =====================================================================

ALTER TABLE agencies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_api_keys     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_webhooks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_usage        ENABLE ROW LEVEL SECURITY;

-- agencies: platform staff + any member of the agency.
CREATE POLICY agencies_members ON agencies
  FOR SELECT USING (is_operator() OR is_agency_member(id));
CREATE POLICY agencies_operators ON agencies
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- memberships: members + the invited user read; editors of the agency mutate.
CREATE POLICY memberships_read ON agency_memberships
  FOR SELECT USING (is_operator() OR is_agency_member(agency_id) OR user_id = auth.uid());
CREATE POLICY memberships_edit ON agency_memberships
  FOR ALL USING (is_operator() OR is_agency_editor(agency_id))
  WITH CHECK (is_operator() OR is_agency_editor(agency_id));

-- api keys: platform staff + agency editors; viewers see nothing.
CREATE POLICY api_keys_edit ON agency_api_keys
  FOR ALL USING (is_operator() OR is_agency_editor(agency_id))
  WITH CHECK (is_operator() OR is_agency_editor(agency_id));

-- webhook config: platform staff + agency editors.
CREATE POLICY webhooks_edit ON agency_webhooks
  FOR ALL USING (is_operator() OR is_agency_editor(agency_id))
  WITH CHECK (is_operator() OR is_agency_editor(agency_id));

-- delivery log: read by platform staff + agency editors; append-only (no UPDATE/DELETE).
CREATE POLICY deliveries_read ON webhook_deliveries
  FOR SELECT USING (is_operator() OR is_agency_editor(agency_id));

-- usage meters: read by platform staff + any agency member (viewers need to see quota meters).
CREATE POLICY usage_read ON agency_usage
  FOR SELECT USING (is_operator() OR is_agency_member(agency_id));

-- clients/briefs: agency members read their own agency's rows (mutations stay
-- operator/service-role; the intake route inserts with the service client).
CREATE POLICY clients_agency ON clients
  FOR SELECT USING (is_agency_member(agency_id));
CREATE POLICY briefs_agency ON briefs
  FOR SELECT USING (is_agency_member(agency_id));

-- =====================================================================
-- Config registry additions (AGENCY_IMP_PLAN.md §4)
-- =====================================================================

INSERT INTO config_registry (key, "group", type, default_value, min, max, enum_values, description) VALUES
  ('platform.signup_policy',        'platform', 'string',  '"invite"',                    NULL, NULL, '["open","invite"]',
     'Who may create agencies: open self-serve or platform-invite only.'),
  ('platform.agency_default_plan',  'platform', 'string',  '"hobby"',                     NULL, NULL, '["hobby","pro","enterprise"]',
     'Plan assigned to freshly created agencies.'),
  ('platform.trial_days',           'platform', 'number',  '14',                          1, 90, NULL,
     'Trial length before an agency is auto-flagged for suspension (lazy check at intake).'),
  ('platform.whitelabel_enabled',   'platform', 'boolean', 'false',                       NULL, NULL, NULL,
     'P3: allow per-agency client-portal branding.'),
  ('billing.plans.hobby',           'billing',  'object',  '{"briefs_per_month":100,"prds_per_month":20,"ai_tokens_per_month":500000,"rate_limit_per_min":10,"concurrent_pipelines":2}', NULL, NULL, NULL,
     'Hobby plan quotas.'),
  ('billing.plans.pro',             'billing',  'object',  '{"briefs_per_month":1000,"prds_per_month":100,"ai_tokens_per_month":5000000,"rate_limit_per_min":120,"concurrent_pipelines":10}', NULL, NULL, NULL,
     'Pro plan quotas.'),
  ('billing.plans.enterprise',      'billing',  'object',  '{"briefs_per_month":100000,"prds_per_month":10000,"ai_tokens_per_month":100000000,"rate_limit_per_min":600,"concurrent_pipelines":0}', NULL, NULL, NULL,
     'Enterprise plan quotas (0 concurrent pipelines = unlimited).'),
  ('billing.overage_gate',          'billing',  'boolean', 'true',                        NULL, NULL, NULL,
     'Block intake at quota instead of flag-and-continue.'),
  ('billing.unit_price_per_1k_tokens', 'billing', 'number', '0.0004', 0, NULL, NULL,
     'Overage metering: USD per 1k AI tokens (used for spend estimates).')
ON CONFLICT (key) DO NOTHING;

-- =====================================================================
-- Atomic RPCs (rate limit window + metered counters). SECURITY DEFINER so
-- service-role calls and session calls both work; logic is pure SQL.
-- =====================================================================

CREATE OR REPLACE FUNCTION agency_rate_take(p_key uuid, p_limit int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_start timestamptz;
  v_count int;
  v_limit int := coalesce(p_limit, 0);
BEGIN
  IF v_limit <= 0 THEN
    UPDATE agency_api_keys SET last_used_at = now() WHERE id = p_key;
    RETURN true;
  END IF;
  SELECT rate_window_start, rate_window_count INTO v_start, v_count
  FROM agency_api_keys WHERE id = p_key FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_start IS NULL OR v_start < now() - interval '1 minute' THEN
    v_count := 1;
    v_start := now();
  ELSE
    v_count := v_count + 1;
  END IF;
  IF v_count > v_limit THEN RETURN false; END IF;
  UPDATE agency_api_keys
     SET rate_window_start = v_start, rate_window_count = v_count, last_used_at = now()
   WHERE id = p_key;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION agency_usage_bump(p_agency uuid, p_period text, p_metric text, p_amount numeric DEFAULT 1)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO agency_usage (agency_id, period, metric, value, last_updated_at)
  VALUES (p_agency, p_period, p_metric, p_amount, now())
  ON CONFLICT (agency_id, period, metric)
  DO UPDATE SET value = agency_usage.value + EXCLUDED.value, last_updated_at = now();
  RETURN (SELECT value FROM agency_usage
          WHERE agency_id = p_agency AND period = p_period AND metric = p_metric);
END;
$$;

-- =====================================================================
-- End of migration 022
-- =====================================================================