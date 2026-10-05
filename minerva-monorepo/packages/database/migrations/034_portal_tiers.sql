-- 034: portal tiers — plus | super | ultra (Nous pricing.png: $20/$100/$200 USD).
-- MERGE, not replacement: legacy agency rows keep working — packages/billing
-- still grants/gates them and the router/dashboard accept them. The retired `pro`
-- tier maps to `plus` (closest paid tier — paid access is preserved, never downgraded
-- to free). New subscriptions are issued on the portal tiers. Safe to re-run.

BEGIN;

-- Retired `pro` becomes `plus` before the enum tightens (same paid-access principle
-- as 030's `enterprise` -> `agency` mapping).
UPDATE agencies SET plan = 'plus' WHERE plan = 'pro';
UPDATE agency_subscriptions SET plan = 'plus' WHERE plan = 'pro';

-- agencies.plan gains the three portal tiers, loses `pro`.
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_plan_check;
UPDATE agencies SET plan = 'free'
  WHERE plan IS NULL OR plan NOT IN ('free', 'agency', 'plus', 'super', 'ultra');
ALTER TABLE agencies
  ADD CONSTRAINT agencies_plan_check
    CHECK (plan IN ('free', 'agency', 'plus', 'super', 'ultra'));

-- agency_subscriptions.plan gains the three portal tiers, loses `pro`.
ALTER TABLE agency_subscriptions DROP CONSTRAINT IF EXISTS agency_subscriptions_plan_check;
UPDATE agency_subscriptions SET plan = 'free'
  WHERE plan NOT IN ('free', 'agency', 'plus', 'super', 'ultra');
ALTER TABLE agency_subscriptions
  ADD CONSTRAINT agency_subscriptions_plan_check
    CHECK (plan IN ('free', 'agency', 'plus', 'super', 'ultra'));

-- config_registry: portal tier prices (USD), portal bonus multiplier, per-tier rollover caps.
-- Legacy keys (billing.plans.agency, billing.rollover_cap, billing.credit_multiplier)
-- are left untouched — old rows still read them.
INSERT INTO config_registry (key, "group", type, default_value, min, max, enum_values, description) VALUES
  ('billing.plans.plus',             'billing', 'number', '20',  0, 10000, NULL, 'Plus tier price, USD'),
  ('billing.plans.super',            'billing', 'number', '100', 0, 10000, NULL, 'Super tier price, USD'),
  ('billing.plans.ultra',            'billing', 'number', '200', 0, 10000, NULL, 'Ultra tier price, USD'),
  ('billing.portal_bonus_multiplier','billing', 'number', '1.1', 0.1, 2.0, NULL, 'Credits granted per USD of portal-tier subscription ($20 -> $22)'),
  ('billing.rollover_cap.plus_usd',  'billing', 'number', '10',  0, 10000, NULL, 'Plus: max unused credits carried into the next period, USD'),
  ('billing.rollover_cap.super_usd', 'billing', 'number', '50',  0, 10000, NULL, 'Super: max unused credits carried into the next period, USD'),
  ('billing.rollover_cap.ultra_usd', 'billing', 'number', '100', 0, 10000, NULL, 'Ultra: max unused credits carried into the next period, USD')
ON CONFLICT (key) DO UPDATE
  SET default_value = EXCLUDED.default_value,
      enum_values   = EXCLUDED.enum_values,
      description   = EXCLUDED.description,
      updated_at    = now();

COMMIT;
