-- 014: M8 scope intelligence (IMPLEMENTATION_PLAN.md §20.3 — QNT-001).
-- change_orders: an out-of-scope client request captured from any stream
-- channel, detected against the PRD/SOW, estimated, and turned into a branded
-- quote + Stripe payment link. Status lifecycle:
--   pending → approved → sent → paid → applied   (rejected anywhere before paid)
-- The paid webhook becomes the scope event: it writes a brief_revisions row and
-- runs delta-scope (revenue event = scope event, provenance intact, §5.2).

CREATE TABLE IF NOT EXISTS change_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id           uuid NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  client_id          uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  request_text       text NOT NULL,                    -- normalized inbound text
  request_snapshot   jsonb NOT NULL DEFAULT '{}',      -- raw channel payload (§5.2 provenance)
  source_channel     text,                             -- stream channel that carried the request
  classification     jsonb NOT NULL DEFAULT '{}',      -- {kind, confidence, model} from §19.3
  detection          jsonb NOT NULL DEFAULT '{}',      -- {in_scope, max_similarity, reason, matched_story}
  complexity         integer,                          -- 1..10 per touched story (§20.3)
  estimated_hours    numeric(8,2),
  estimated_cost_usd numeric(10,2),
  status             text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'sent', 'paid', 'applied', 'rejected')),
  doc_url            text,
  stripe_session_id  text,
  stripe_session_url text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stripe_session_id)
);

CREATE INDEX IF NOT EXISTS idx_change_orders_client   ON change_orders (client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_orders_brief    ON change_orders (brief_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_orders_status   ON change_orders (status, created_at DESC);

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY change_orders_operator ON change_orders
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY change_orders_client ON change_orders
  FOR ALL USING (is_client_owner(client_id)) WITH CHECK (is_client_owner(client_id));