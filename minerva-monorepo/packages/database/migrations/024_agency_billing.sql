-- 024: M-SAAS-P2 billing — subscriptions & invoices (AGENCY_IMP_PLAN.md §3.4).
-- Reuses migration-020 payments.* gateway generalisation (paystack default for Africa).
-- SaaS subscription billing is distinct from change_order billing — both flow through
-- the same gateways registry, different resources. RLS: operator all; agency members read own.

-- =====================================================================
-- agency_subscriptions
-- =====================================================================

CREATE TABLE IF NOT EXISTS agency_subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id               uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  gateway                 text NOT NULL CHECK (gateway IN ('stripe', 'paystack', 'paypal')),
  plan                    text NOT NULL CHECK (plan IN ('hobby', 'pro', 'enterprise')),
  status                  text NOT NULL DEFAULT 'trialing'
                          CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  last_payment_at         timestamptz,
  gateway_subscription_id text,
  gateway_customer_id     text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, gateway)
);

CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_agency ON agency_subscriptions (agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_gateway ON agency_subscriptions (gateway, status);

-- =====================================================================
-- agency_invoices
-- =====================================================================

CREATE TABLE IF NOT EXISTS agency_invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_id   uuid REFERENCES agency_subscriptions(id) ON DELETE SET NULL,
  amount            numeric(12,2) NOT NULL,
  currency          text NOT NULL DEFAULT 'ZAR'
                    CHECK (currency IN ('ZAR', 'NGN', 'GHS', 'KES', 'USD')),
  status            text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  gateway           text NOT NULL CHECK (gateway IN ('stripe', 'paystack', 'paypal')),
  gateway_reference text,
  hosted_url        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  paid_at           timestamptz
);

CREATE INDEX IF NOT EXISTS idx_agency_invoices_agency ON agency_invoices (agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_invoices_subscription ON agency_invoices (subscription_id);

-- =====================================================================
-- RLS
-- =====================================================================

ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_invoices ENABLE ROW LEVEL SECURITY;

-- Operator: full access
CREATE POLICY agency_subscriptions_operator ON agency_subscriptions
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY agency_invoices_operator ON agency_invoices
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- Agency members: read own billing rows (inserts via service role + checkout flow)
CREATE POLICY agency_subscriptions_member ON agency_subscriptions
  FOR SELECT USING (is_agency_member(agency_id));
CREATE POLICY agency_invoices_member ON agency_invoices
  FOR SELECT USING (is_agency_member(agency_id));

-- Agency editors could manage upgrades via checkout; for P2 we allow SELECT only.
-- Mutations remain operator/service-role (no agency_editor ALL policy by design).

-- =====================================================================
-- End of migration 024
-- =====================================================================
