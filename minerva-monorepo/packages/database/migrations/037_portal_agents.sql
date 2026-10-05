-- 037: portal agents — the hosted gateways the desktop's Cloud picker lists.
--
-- Flow: the desktop calls GET /api/agents with its portal session cookie and
-- gets back the agents belonging to one agency, plus that agency projected
-- into the `org` shape the desktop persists. A multi-agency user gets a 409
-- carrying the agency list so the desktop can show its org picker.
--
-- An agent is a per-agency Hermes gateway the user can point the desktop at:
-- `dashboard_url` is the base URL the desktop connects to and is the only
-- field here that carries a routable address, so it is what an agent row
-- exists to hold.
--
-- `gateway_state` is a CACHED probe result, not a live check: GET /api/agents
-- must stay fast enough for a settings panel to call on every focus, so
-- liveness is written by whatever health loop owns the fleet and read here.
-- 'unknown' means "never probed", which the desktop renders as unknown rather
-- than as down.
--
-- Security posture: RLS on, no permissive policies, so anon/authenticated
-- cannot read this table through PostgREST even with a leaked anon key. All
-- access is via the server route, which resolves the caller's agency
-- membership with the request's own session and never trusts a caller-supplied
-- agency_id.
--
-- Safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS agency_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- Base URL the desktop connects to. NULL while the fleet is still
  -- provisioning: the desktop shows "provisioning…" rather than a dead row.
  dashboard_url text NULL,
  status text NOT NULL DEFAULT 'provisioning'
    CHECK (status IN ('provisioning', 'active', 'suspended')),
  -- Cached liveness of the agent's gateway, written by the health loop.
  gateway_state text NOT NULL DEFAULT 'unknown'
    CHECK (gateway_state IN ('active', 'degraded', 'down', 'unknown')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_agents_agency_idx ON agency_agents (agency_id);

ALTER TABLE agency_agents ENABLE ROW LEVEL SECURITY;
-- No permissive policies: anon/authenticated roles can do nothing directly.
-- All access is via server routes (which use the request session's RLS-scoped
-- client, or the service role where a route has already authorized).

COMMIT;
