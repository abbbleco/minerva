-- 029: plan catalog is hobby | pro | agency (each sold with a 14-day trial).
-- 'enterprise' never shipped; swap the 024 CHECK and migrate any stray rows.

ALTER TABLE agency_subscriptions DROP CONSTRAINT IF EXISTS agency_subscriptions_plan_check;
UPDATE agency_subscriptions SET plan = 'agency' WHERE plan NOT IN ('hobby', 'pro', 'agency');
ALTER TABLE agency_subscriptions
  ADD CONSTRAINT agency_subscriptions_plan_check
    CHECK (plan IN ('hobby', 'pro', 'agency'));
