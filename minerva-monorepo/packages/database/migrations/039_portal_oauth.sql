-- 039: portal OAuth — authorization-code + PKCE for first-party clients
-- (the local dashboard signs in through the portal).
--
-- Flow: the client links to /oauth/authorize with its client_id, a redirect_uri,
-- a PKCE code_challenge and a state. A signed-in user sees a consent screen;
-- approving mints a single-use authorization code (10 min). The client posts
-- the code plus its code_verifier to /api/oauth/token and gets an access JWT
-- (1h, ES256) plus a rotating refresh token (24h). Refreshing consumes the old
-- refresh token and issues a new pair (reuse of a consumed token revokes the
-- chain, which is how a stolen refresh token is contained).
--
-- Clients are registered rows, not open registration: a client_id the portal
-- never issued gets no code, no matter what redirect_uri it names. Redirect
-- URIs are matched exactly (no prefix games, no localhost exception outside
-- explicit registration).
--
-- Keys: the JWT signing key lives OUTSIDE the database, in the
-- OAUTH_JWT_PRIVATE_KEY_PEM environment variable. The public half is served
-- at /.well-known/jwks.json with a stable kid; rotation means generating a
-- second key, publishing both kids, then retiring the old one — never editing
-- a signed token's key in place.
--
-- Safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS portal_oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL UNIQUE,
  name text NOT NULL,
  -- Exact redirect URIs, one per line semantics in JSON. Matched exactly.
  redirect_uris jsonb NOT NULL DEFAULT '[]',
  -- First-party clients (the local dashboard) skip no consent step; this flag
  -- exists so a future machine client can be scoped without one. Default off.
  first_party boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_oauth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SHA-256 of the code handed to the client. The plaintext crosses the
  -- browser exactly once (in the redirect); the table never holds it.
  code_hash text NOT NULL UNIQUE,
  client_id text NOT NULL REFERENCES portal_oauth_clients(client_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id uuid NULL REFERENCES agencies(id) ON DELETE SET NULL,
  -- PKCE: the challenge the client committed to up front.
  code_challenge text NOT NULL,
  code_challenge_method text NOT NULL DEFAULT 'S256' CHECK (code_challenge_method IN ('S256', 'plain')),
  redirect_uri text NOT NULL,
  scope text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  consumed_at timestamptz NULL
);
CREATE INDEX IF NOT EXISTS portal_oauth_codes_expires_idx ON portal_oauth_codes (expires_at);

CREATE TABLE IF NOT EXISTS portal_oauth_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SHA-256 of the refresh token. Same shown-once discipline as codes.
  token_hash text NOT NULL UNIQUE,
  client_id text NOT NULL REFERENCES portal_oauth_clients(client_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id uuid NULL REFERENCES agencies(id) ON DELETE SET NULL,
  scope text NOT NULL DEFAULT '',
  -- Rotation chain: each use consumes the presented token and links to its
  -- replacement. A presented token that is already consumed means reuse —
  -- the whole chain is revoked, because only a stolen copy gets presented twice.
  consumed_at timestamptz NULL,
  replaced_by uuid NULL REFERENCES portal_oauth_refresh_tokens(id) ON DELETE SET NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);
CREATE INDEX IF NOT EXISTS portal_oauth_refresh_expires_idx ON portal_oauth_refresh_tokens (expires_at);

ALTER TABLE portal_oauth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_oauth_clients ENABLE ROW LEVEL SECURITY;
-- No permissive policies: anon/authenticated roles can do nothing directly.
-- All access is via server routes with the service-role key (bypasses RLS).

-- Seed: the local dashboard. Its redirect URIs are loopback-only, so
-- pre-registering them grants nothing to anyone else; a hosted dashboard
-- registers its own client_id with its own origin.
INSERT INTO portal_oauth_clients (client_id, name, redirect_uris, first_party)
VALUES (
  'minerva-dashboard',
  'Minerva Dashboard (local)',
  '["http://127.0.0.1:9119/oauth/callback", "http://localhost:9119/oauth/callback"]',
  true
)
ON CONFLICT (client_id) DO NOTHING;

COMMIT;
