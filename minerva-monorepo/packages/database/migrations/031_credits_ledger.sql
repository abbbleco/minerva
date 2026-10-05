-- 031: inference credits ledger (plan decision 8 + §3.4.3).
--
-- One credit = 1 USD of inference at catalog price. The ledger is append-only and is the
-- authoritative record of inference spend; `agencies.credits_balance_usd` is a cached counter
-- kept in the same transaction so the router can gate on a fast read.
--
-- Concurrency: the router gates on the cached counter and debits with an INSERT + counter
-- update in one transaction. `agency_credits_ledger_idem` makes a retried or duplicated call
-- a no-op instead of a double debit (plan rev.4 C5).

BEGIN;

-- =====================================================================
-- agencies.credits_balance_usd (cached counter)
-- =====================================================================

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS credits_balance_usd numeric(14,6) NOT NULL DEFAULT 0;

-- =====================================================================
-- agency_credits_ledger
-- =====================================================================

CREATE TABLE IF NOT EXISTS agency_credits_ledger (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id        uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  -- Positive = grant/refund, negative = inference debit.
  amount_usd       numeric(14,6) NOT NULL,
  -- Balance after this line was applied; useful for audits even if the cache drifts.
  balance_after    numeric(14,6) NOT NULL,
  kind             text NOT NULL CHECK (kind IN ('grant', 'inference', 'adjustment', 'refund')),
  model            text,
  tokens           jsonb,
  -- Engine-generated `hash(session_id, turn_index, model)`; NULL for grants.
  request_id       text,
  stripe_reference text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agency_credits_ledger_agency_created_idx
  ON agency_credits_ledger (agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agency_credits_ledger_agency_kind_idx
  ON agency_credits_ledger (agency_id, kind);

-- Idempotency: one debit per logical request. A retry that reaches us twice hits this index
-- and is ignored rather than charged twice. Grants carry no request_id, so the partial index
-- keeps them unconstrained.
CREATE UNIQUE INDEX IF NOT EXISTS agency_credits_ledger_idem
  ON agency_credits_ledger (agency_id, request_id)
  WHERE request_id IS NOT NULL;

-- =====================================================================
-- agency_credits_apply — atomic, idempotent ledger write
-- =====================================================================
-- Why an RPC rather than read-then-write in the client: the router debits on EVERY inference
-- call, so two concurrent calls for one agency would both read the same starting balance and
-- the second write would clobber the first — silently losing a debit. `FOR UPDATE` on the
-- agency row serialises them.
--
-- Idempotency is enforced by the partial unique index above: a retried request (or an SSE
-- stream that was billed twice) hits `unique_violation`, which we translate into
-- `duplicate = true` rather than an error, because the money moved exactly once either way.

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
      (agency_id, amount_usd, balance_after, kind, model, tokens, request_id)
    VALUES
      (p_agency_id, p_amount, v_after, p_kind, p_model, p_tokens, p_request_id);
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

-- Service-role only: the router and the web backend call this. Client roles must never be able
-- to mint credits.
REVOKE ALL ON FUNCTION agency_credits_apply(uuid, numeric, text, text, jsonb, text) FROM PUBLIC;

-- =====================================================================
-- RLS: agency members read own agency; service_role (router/engine tool) writes
-- =====================================================================

ALTER TABLE agency_credits_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agency_credits_ledger_member_read ON agency_credits_ledger;
CREATE POLICY agency_credits_ledger_member_read ON agency_credits_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agency_memberships m
       WHERE m.agency_id = agency_credits_ledger.agency_id
         AND m.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policy for client roles: debits and grants are written only by the
-- router and the web backend using the service-role key, which bypasses RLS by design.

COMMIT;
