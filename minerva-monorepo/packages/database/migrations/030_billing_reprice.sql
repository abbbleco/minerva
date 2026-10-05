-- 030: reprice — remove the 14-day trial, `hobby` -> `free`, agency $149 -> $200.
-- Plan decisions 6 + 8 (single subscription + credits). Rev.4 addition: currency handling.
--
-- CURRENCY (plan rev.4 C6)
--   v1 billable currencies are ZAR|NGN|GHS|KES|USD (`agency_invoices.currency`, migration 024)
--   and the new tiers are priced in USD. Historical invoices are NOT converted — an invoice is a
--   historical record of what was actually charged, and rewriting it would falsify the ledger.
--   Instead: new billing happens in USD, and existing agencies are grandfathered onto their
--   current currency until they renew. `agencies.billing_currency` carries that decision.
--
-- Safe to re-run. Apply on staging and dry-run `resolveAgencyBilling` before production.

BEGIN;

-- =====================================================================
-- agencies: plan enum + trial removal + billing currency
-- =====================================================================

ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_plan_check;

-- `enterprise` maps to `agency`, NOT to the free tier.
-- Migration 029 established this ("'enterprise' never shipped; migrate any stray rows" ->
-- `agency`) but only rewrote `agency_subscriptions`; `agencies.plan` kept the legacy value.
-- The generic fallback below sends anything unrecognised to `free`, which would silently
-- DOWNGRADE a legacy agency-tier customer to the free tier — a billing bug, not a cleanup.
-- Order matters: this must run before the fallback.
UPDATE agencies SET plan = 'agency' WHERE plan = 'enterprise';
UPDATE agencies SET plan = 'free' WHERE plan IS NULL OR plan NOT IN ('free', 'pro', 'agency');
ALTER TABLE agencies
  ADD CONSTRAINT agencies_plan_check CHECK (plan IN ('free', 'pro', 'agency'));
ALTER TABLE agencies ALTER COLUMN plan SET DEFAULT 'free';

-- No trial clock survives v2: `trialing` is gone and trial_ends_at is always NULL.
UPDATE agencies SET trial_ends_at = NULL WHERE trial_ends_at IS NOT NULL;

-- `agencies.status` still defaulted to 'trial' and its CHECK still permitted it (migration 022).
-- With trials removed, a new agency must be created `active` — otherwise every signup lands in
-- a state nothing reads, and the admin console's status counters show a bucket that can't be
-- exited. Normalise existing rows first, then tighten the enum.
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_status_check;
UPDATE agencies SET status = 'active' WHERE status = 'trial' OR status IS NULL;
ALTER TABLE agencies ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE agencies
  ADD CONSTRAINT agencies_status_check CHECK (status IN ('active', 'suspended'));

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS billing_currency text NOT NULL DEFAULT 'USD'
  CHECK (billing_currency IN ('ZAR', 'NGN', 'GHS', 'KES', 'USD'));

-- Grandfather: existing agencies keep the currency of their most recent invoice.
UPDATE agencies a
   SET billing_currency = COALESCE((
     SELECT i.currency
       FROM agency_invoices i
      WHERE i.agency_id = a.id
      ORDER BY i.created_at DESC
      LIMIT 1
   ), 'USD')
 WHERE EXISTS (SELECT 1 FROM agency_invoices i WHERE i.agency_id = a.id);

-- =====================================================================
-- agency_subscriptions: plan enum + status enum
-- =====================================================================

ALTER TABLE agency_subscriptions DROP CONSTRAINT IF EXISTS agency_subscriptions_plan_check;
UPDATE agency_subscriptions SET plan = 'free' WHERE plan NOT IN ('free', 'pro', 'agency');
ALTER TABLE agency_subscriptions
  ADD CONSTRAINT agency_subscriptions_plan_check
    CHECK (plan IN ('free', 'pro', 'agency'));

ALTER TABLE agency_subscriptions DROP CONSTRAINT IF EXISTS agency_subscriptions_status_check;
UPDATE agency_subscriptions SET status = 'active' WHERE status = 'trialing';
ALTER TABLE agency_subscriptions
  ADD CONSTRAINT agency_subscriptions_status_check
    CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'unpaid'));

-- =====================================================================
-- config_registry: tiers, quotas, credits
-- =====================================================================

INSERT INTO config_registry (key, "group", type, default_value, min, max, enum_values, description) VALUES
  ('billing.plans.free',      'billing', 'number', '0',     0, 0,     NULL, 'Free tier price, USD'),
  ('billing.plans.pro',       'billing', 'number', '49',    0, 10000, NULL, 'Pro tier price, USD'),
  ('billing.plans.agency',    'billing', 'number', '200',   0, 10000, NULL, 'Agency tier price, USD'),
  ('billing.credit_multiplier','billing','number', '1.0',   0.1, 1.0, NULL, 'Credits granted per USD of subscription (rev.4 C2)'),
  ('billing.free_credits_usd','billing', 'number', '5',     0, 1000,  NULL, 'Free tier monthly credit grant, USD'),
  ('billing.rollover_cap',    'billing', 'number', '50',    0, 10000, NULL, 'Max unused credits carried into the next period, USD'),
  ('billing.overage_gate',    'billing', 'boolean','true',  NULL, NULL, NULL, 'Hard-stop 402 on credit exhaustion (no surprise bills)'),
  ('billing.free_quotas.briefs_per_mo',        'billing', 'number', '10',    0, 100000, NULL, 'Free tier: briefs per month'),
  ('billing.free_quotas.prds_per_mo',          'billing', 'number', '5',     0, 100000, NULL, 'Free tier: PRDs per month'),
  ('billing.free_quotas.ai_tokens_per_mo',     'billing', 'number', '500000',0, 1e9,    NULL, 'Free tier: AI tokens per month'),
  ('billing.free_quotas.pipeline_runs_per_mo', 'billing', 'number', '50',    0, 100000, NULL, 'Free tier: pipeline runs per month'),
  ('billing.free_quotas.storage_mb',           'billing', 'number', '500',   0, 1e9,    NULL, 'Free tier: storage MB'),
  ('billing.currency',        'billing', 'string', '"USD"', NULL, NULL,
     '["USD","ZAR","NGN","GHS","KES"]'::jsonb, 'Currency for NEW subscriptions')
ON CONFLICT (key) DO UPDATE
  SET default_value = EXCLUDED.default_value,
      enum_values   = EXCLUDED.enum_values,
      description   = EXCLUDED.description,
      updated_at    = now();

COMMIT;
