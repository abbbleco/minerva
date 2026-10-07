-- Per-member spend allowances + ledger attribution.
--
-- Model: seats are free; owners/managers set a monthly USD allowance per seat
-- that draws against the agency balance. NULL allowance = no individual cap
-- (agency pool only). The router enforces `used >= allowance` per member per
-- calendar month and debits with attribution so spend is accountable.
--
-- Deploy order: this migration is fully additive. The old 6-arg
-- `agency_credits_apply` overload is kept as a wrapper so a not-yet-redeployed
-- router keeps debiting (unattributed) instead of 500ing on a missing function.

-- 1) Allowance on the membership (settable on invited rows too; applies on claim).
ALTER TABLE agency_memberships
  ADD COLUMN IF NOT EXISTS monthly_spend_cap_usd numeric(14,2) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'agency_memberships'
      AND constraint_name = 'agency_memberships_spend_cap_check'
  ) THEN
    ALTER TABLE agency_memberships
      ADD CONSTRAINT agency_memberships_spend_cap_check
      CHECK (monthly_spend_cap_usd IS NULL OR monthly_spend_cap_usd >= 0);
  END IF;
END $$;

-- 2) Attribution on the ledger. Historical rows stay NULL (unattributed and
-- excluded from member sums — never backfilled, never guessed).
ALTER TABLE agency_credits_ledger
  ADD COLUMN IF NOT EXISTS user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS agency_credits_ledger_member_month_idx
  ON agency_credits_ledger (agency_id, user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- 3) Attributed debit overload. Same atomicity + idempotency contract as the
-- original; the 6-arg form delegates with NULL attribution.
DROP FUNCTION IF EXISTS agency_credits_apply(uuid, numeric, text, text, jsonb, text);

CREATE OR REPLACE FUNCTION agency_credits_apply(
  p_agency_id  uuid,
  p_amount     numeric,
  p_kind       text,
  p_model      text  DEFAULT NULL,
  p_tokens     jsonb DEFAULT NULL,
  p_request_id text  DEFAULT NULL,
  p_user_id    uuid  DEFAULT NULL
) RETURNS TABLE (balance_after numeric, duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_after   numeric;
BEGIN
  IF p_kind NOT IN ('grant', 'inference', 'adjustment', 'refund') THEN
    RAISE EXCEPTION 'invalid ledger kind: %', p_kind;
  END IF;

  SELECT a.credits_balance_usd INTO v_balance
    FROM agencies a WHERE a.id = p_agency_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'agency not found: %', p_agency_id;
  END IF;

  v_after := v_balance + p_amount;

  BEGIN
    INSERT INTO agency_credits_ledger
      (agency_id, amount_usd, balance_after, kind, model, tokens, request_id, user_id)
    VALUES
      (p_agency_id, p_amount, v_after, p_kind, p_model, p_tokens, p_request_id, p_user_id);
  EXCEPTION WHEN unique_violation THEN
    -- Already charged. Report the unchanged balance; the caller treats this as success.
    RETURN QUERY SELECT v_balance, true;
    RETURN;
  END;

  UPDATE agencies
     SET credits_balance_usd = v_after,
         updated_at = now()
   WHERE id = p_agency_id;

  RETURN QUERY SELECT v_after, false;
END;
$$;

-- Back-compat overload for not-yet-redeployed callers (unattributed debit).
CREATE OR REPLACE FUNCTION agency_credits_apply(
  p_agency_id  uuid,
  p_amount     numeric,
  p_kind       text,
  p_model      text  DEFAULT NULL,
  p_tokens     jsonb DEFAULT NULL,
  p_request_id text  DEFAULT NULL
) RETURNS TABLE (balance_after numeric, duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM agency_credits_apply(
    p_agency_id, p_amount, p_kind, p_model, p_tokens, p_request_id, NULL);
END;
$$;

REVOKE ALL ON FUNCTION agency_credits_apply(uuid, numeric, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION agency_credits_apply(uuid, numeric, text, text, jsonb, text, uuid) FROM PUBLIC;

-- No RLS change: the existing agency_credits_ledger_member_read policy already
-- lets members read their agency's rows (new user_id column included), and
-- writes stay service-role-only. Portal member-spend reads go through the
-- service-role members routes with code-enforced authz.

COMMIT;
