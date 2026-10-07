-- Paystack subscription billing: idempotency + server-side disable support.
--
-- Paystack is the only payment gateway (platform default `payments.gateway`
-- is already "paystack"; stripe/paypal stay disabled). Checkout creates an
-- `agency_invoices` row keyed by Paystack transaction reference; the webhook
-- fulfills against it, so replays and double-deliveries grant exactly once.
-- Server-side cancel needs the subscription email token alongside the code.

-- Webhook idempotency: one fulfillment per Paystack reference.
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_invoices_gateway_ref
  ON agency_invoices (gateway_reference) WHERE gateway_reference IS NOT NULL;

-- Email token for POST /subscription/disable (needs code + token).
ALTER TABLE agency_subscriptions
  ADD COLUMN IF NOT EXISTS gateway_subscription_token text NULL;

COMMIT;
