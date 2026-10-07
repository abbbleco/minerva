-- Portal tier seeds follow the billing package into ZAR (owner decision:
-- Paystack is the only gateway). PLUS R350 / SUPER R1,650 / ULTRA R3,500 —
-- converted from the USD list at 16.39 ZAR/USD and rounded up, the same
-- precedent as the legacy R3,500 agency tier. Rollover caps stay USD (credit
-- caps, not prices). No live reader depends on these rows (the billing
-- package carries its own fallbacks); this keeps the registry truthful.
-- Safe to re-run.

BEGIN;

UPDATE config_registry SET default_value = '350', description = 'Plus tier price, ZAR'
  WHERE key = 'billing.plans.plus';
UPDATE config_registry SET default_value = '1650', description = 'Super tier price, ZAR'
  WHERE key = 'billing.plans.super';
UPDATE config_registry SET default_value = '3500', description = 'Ultra tier price, ZAR'
  WHERE key = 'billing.plans.ultra';
UPDATE config_registry
  SET description = 'Credits granted per ZAR of portal-tier subscription (R350 -> ~$23.49)'
  WHERE key = 'billing.portal_bonus_multiplier';

COMMIT;
