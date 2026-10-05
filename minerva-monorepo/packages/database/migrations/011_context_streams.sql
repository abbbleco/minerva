-- 011: Phase 4 Context Streams (IMPLEMENTATION_PLAN.md §19). Push channels:
-- WhatsApp / Slack / GitHub webhooks (M5); meeting / docs / figma inbound later.
-- Schema: inbound routing key (clients.whatsapp_phone), registered channels
-- (client_channels), the normalized+classified message ledger (ingested_events,
-- idempotent on external message id), source_channel provenance on
-- brief_revisions + research_artifacts, and stream-created brief sources.

-- --- Inbound routing: ad-hoc WhatsApp messages arrive by phone number ---
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_phone text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_whatsapp_phone
  ON clients (whatsapp_phone) WHERE whatsapp_phone IS NOT NULL;

-- --- Registered partner channels per client (§19.6) ---
CREATE TABLE IF NOT EXISTS client_channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel     text NOT NULL CHECK (channel IN ('whatsapp', 'slack', 'github', 'meeting', 'docs', 'figma')),
  address     text NOT NULL,    -- partner-side identifier: phone / slack user id / github login
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, address)
);

-- --- Message ledger: every ingested event, classified + routed (§19.3-19.5) ---
CREATE TABLE IF NOT EXISTS ingested_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel             text NOT NULL CHECK (channel IN ('whatsapp', 'slack', 'github', 'meeting', 'docs', 'figma')),
  external_message_id text NOT NULL,
  direction           text NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  message_type        text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file', 'card', 'thread', 'event')),
  raw_payload         jsonb NOT NULL DEFAULT '{}',
  normalized_text     text NOT NULL,
  classification      jsonb NOT NULL DEFAULT '{}',  -- {kind, confidence, model}
  route               text NOT NULL CHECK (route IN ('brief_revision', 'research_artifact', 'design_drift', 'shipped_work', 'ledger')),
  status              text NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'needs_attention')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, external_message_id)
);

-- --- Stream provenance on revision + research artifacts ---
ALTER TABLE brief_revisions    ADD COLUMN IF NOT EXISTS source_channel text;
ALTER TABLE research_artifacts ADD COLUMN IF NOT EXISTS source_channel text;

-- --- briefs.source: stream-created briefs join the source enum (§19.6) ---
ALTER TABLE briefs DROP CONSTRAINT IF EXISTS briefs_source_check;
ALTER TABLE briefs ADD CONSTRAINT briefs_source_check
  CHECK (source IN ('web_form', 'pdf', 'audio', 'api', 'whatsapp', 'slack', 'meeting', 'docs', 'figma', 'github'));

-- --- Feed indexes (dashboard /api/v1/streams/events) ---
CREATE INDEX IF NOT EXISTS idx_ingested_events_client  ON ingested_events (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingested_events_channel ON ingested_events (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingested_events_status  ON ingested_events (status, created_at DESC);

-- --- RLS: operator ALL; client SELECT own only (feed read, no tampering) ---
ALTER TABLE client_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY channels_operator ON client_channels
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY channels_client ON client_channels
  FOR SELECT USING (is_client_owner(client_id));

ALTER TABLE ingested_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_operator ON ingested_events
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY events_client ON ingested_events
  FOR SELECT USING (is_client_owner(client_id));