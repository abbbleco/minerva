-- 032: default billing currency -> ZAR (owner decision 2026-09-30).
--
-- Rationale: Paystack is the primary subscription gateway and is Africa-first, and v1's
-- `payments.currency` already defaulted to ZAR. 030 introduced `agencies.billing_currency`
-- defaulting to USD purely because the tier prices were authored as USD figures.
--
-- SCOPE — read before editing:
--   * The COLUMN default changes to ZAR, so every new agency bills in ZAR.
--   * Existing rows are moved to ZAR **only when their currency is not backed by invoice
--     history**. 030 deliberately grandfathered agencies onto the currency of their most recent
--     invoice; silently overwriting a genuine ZAR/NGN/GHS/KES history with USD, or vice versa,
--     would falsify the record that column exists to preserve. Historical invoices are never
--     rewritten.
--
-- Safe to re-run.

BEGIN;

-- New agencies bill in ZAR.
ALTER TABLE agencies ALTER COLUMN billing_currency SET DEFAULT 'ZAR';

-- Move rows whose value came from the 030 column default rather than from an invoice.
UPDATE agencies a
   SET billing_currency = 'ZAR'
 WHERE a.billing_currency = 'USD'
   AND NOT EXISTS (
     SELECT 1 FROM agency_invoices i
      WHERE i.agency_id = a.id
        AND i.currency = 'USD'
   );

-- Registry defaults, so the dashboard and admin surfaces agree with the column.
UPDATE config_registry SET default_value = '"ZAR"'      WHERE key = 'payments.currency';
UPDATE config_registry SET default_value = '"paystack"' WHERE key = 'payments.gateway';

COMMIT;
