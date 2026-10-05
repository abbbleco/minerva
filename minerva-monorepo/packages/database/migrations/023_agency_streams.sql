-- 023: M-SAAS-P2 per-agency channel credentials (AGENCY_IMP_PLAN.md §3.3).
--   - client_channels gains agency_id FK + credentials jsonb (encrypted at rest; masked in API).
--   - agency_channel_links maps a global provider webhook (WhatsApp/Slack/Teams…) to (agency_id, channel, address)
--     so the same global webhook endpoint can route to the correct agency via verify_token/signature.
-- RLS: operator all; agency members read own, editors manage own; client owners unchanged.

-- =====================================================================
-- client_channels: add tenancy + credentials
-- =====================================================================

ALTER TABLE client_channels ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE;
ALTER TABLE client_channels ADD COLUMN IF NOT EXISTS credentials jsonb NOT NULL DEFAULT '{}';

-- Backfill agency_id from the linked client (clients already have agency_id after 022 backfill)
UPDATE client_channels cc
   SET agency_id = c.agency_id
  FROM clients c
 WHERE c.id = cc.client_id
   AND cc.agency_id IS NULL;

-- Ensure every remaining row has an agency (platform fallback, like briefs)
UPDATE client_channels
   SET agency_id = (SELECT id FROM agencies WHERE slug = 'abbble-co')
 WHERE agency_id IS NULL;

-- Index + make NOT NULL after backfill (lean filters, RLS)
CREATE INDEX IF NOT EXISTS idx_client_channels_agency ON client_channels (agency_id);
CREATE INDEX IF NOT EXISTS idx_client_channels_agency_channel ON client_channels (agency_id, channel);
-- Only enforce NOT NULL if every row now has a value (existing installs pass)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_channels WHERE agency_id IS NULL) THEN
    ALTER TABLE client_channels ALTER COLUMN agency_id SET NOT NULL;
  END IF;
END $$;

-- =====================================================================
-- agency_channel_links: global webhook → agency routing
-- =====================================================================

CREATE TABLE IF NOT EXISTS agency_channel_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  channel       text NOT NULL
                CHECK (channel IN ('whatsapp', 'slack', 'github', 'meeting', 'docs', 'figma',
                                   'discord', 'teams', 'gitlab', 'jira', 'zeplin', 'loom')),
  address       text NOT NULL,  -- agency-scoped webhook address / phone / workspace / repo
  verify_token  text,           -- per-agency hub.verify_token / signing secret (masked in API)
  credentials   jsonb NOT NULL DEFAULT '{}', -- provider tokens encrypted at rest (never returned raw)
  enabled       boolean NOT NULL DEFAULT true,
  paused        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, channel, address)
);

CREATE INDEX IF NOT EXISTS idx_agency_channel_links_agency ON agency_channel_links (agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_channel_links_channel_address ON agency_channel_links (channel, address);

-- =====================================================================
-- RLS helpers already exist (is_operator, is_agency_member, is_agency_editor)
-- =====================================================================

ALTER TABLE agency_channel_links ENABLE ROW LEVEL SECURITY;

-- Operator: full access
CREATE POLICY agency_channel_links_operator ON agency_channel_links
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- Agency members: read own agency's links
CREATE POLICY agency_channel_links_member ON agency_channel_links
  FOR SELECT USING (is_agency_member(agency_id));

-- Agency editors: manage own agency's links (covers SELECT+INSERT+UPDATE+DELETE for editors)
CREATE POLICY agency_channel_links_editor ON agency_channel_links
  FOR ALL USING (is_agency_editor(agency_id)) WITH CHECK (is_agency_editor(agency_id));

-- client_channels: keep existing policies, add agency-scoped complements
-- Existing: channels_operator (ALL is_operator), channels_client (SELECT is_client_owner)
-- New: agency members SELECT, editors ALL

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_channels' AND policyname='channels_agency_member') THEN
    CREATE POLICY channels_agency_member ON client_channels
      FOR SELECT USING (is_agency_member(agency_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_channels' AND policyname='channels_agency_editor') THEN
    CREATE POLICY channels_agency_editor ON client_channels
      FOR ALL USING (is_agency_editor(agency_id)) WITH CHECK (is_agency_editor(agency_id));
  END IF;
END $$;

-- =====================================================================
-- End of migration 023
-- =====================================================================
