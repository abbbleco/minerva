-- 012: per-channel kill switch (Phase 4 §19.6 audit follow-up).
-- client_channels gains `paused` — the plan's per-channel pause lever
-- (global_paused via system_config is the §18.5 global one). Receivers
-- (webhooks + partner ingest API) ack-and-drop while a channel is paused.
ALTER TABLE client_channels ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false;