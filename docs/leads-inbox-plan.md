# LEADS Inbox — Implementation Plan

A separate LEADS pane: one inbox for the humans reaching you across every
connected intake channel (WhatsApp, Slack, Discord, Telegram, web form, …),
with contact rows identified by whatever the channel gives us (phone, email,
username) and the ability to reply in place.

Status: all phases done (verified: derivation + merge backend, read REST +
reply endpoint, `minerva-leads` pane with merge picker/unmerge/intake
viewer + cross-channel hints). This plan is closed.

## 1. Why this exists (and what it is not)

Today every surface tracks something else: Bots tracks agents, Feeds tracks
content, Goals tracks outcomes, PRDs tracks pipeline output. Nobody tracks
the *humans*. A form submission from a buyer, a WhatsApp DM asking about
pricing, a Slack thread reporting a bug — each lives in its own session,
invisible unless you already know where to look. Sales and support follow-up
currently requires remembering which channel a person used.

LEADS is the missing surface: a per-profile directory of human contacts
derived from conversations that already happened, plus a reply box. It is a
directory + inbox, not a CRM: no pipelines, no deal stages, no sequences, no
auto-replies (explicit non-goal — unattended outbound is denied by default
for good reason).

## 2. Ground truths (verified in-tree, not assumed)

- **Identity per channel** (`gateway/session.py:65-100` SessionSource,
  populated per adapter): WhatsApp gives JIDs (phone = numeric part;
  `gateway/whatsapp_identity.py`, `session.py:673-679` canonicalization),
  WhatsApp Cloud gives bare `wa_id` digits + profile name, Slack gives `U/W`
  user ids + display/real names (+ `scope_id` team), Discord gives snowflake
  ids + display names (+ guild), Telegram gives numeric ids + full names. No
  channel exposes email; only the web form yields email (+ optional phone).
- **Conversations are already keyed**: `build_session_key`
  (`session.py:682-723`) → `<ns>:<platform>:<chat_type>[:scope][:chat_id]
  [:thread][:user]`, persisted per session row with `user_id, chat_id,
  chat_type, thread_id, display_name, origin_json` (full SessionSource),
  `profile_name, transport_profile, last_activity_at, last_read_at`
  (`hermes_state_common.py:381-446`). Lookup by origin exists
  (`find_session_by_origin`). Transcripts live in `messages(session_id,
  timestamp, …)` with an index on `(session_id, timestamp)`.
- **No contacts store exists** (searched: contacts/roster/crm/addressbook =
  nothing). Closest: `PairingStore` (approved humans per platform,
  `gateway/pairing.py`) and `channel_directory.json` (derived from sessions,
  `gateway/channel_directory.py:320-367`). Bot Mode roster is agent profiles
  on disk — wrong shape, not reusable.
- **Reply has no REST/RPC today.** In-process `adapter.send(chat_id,
  content, reply_to?, metadata?)` (`platforms/base.py:2736`) is the contract;
  `tools/send_message_tool.py` + `minerva send` CLI (`platform:chat[:thread]`
  targets, `hermes_cli/send_cmd.py`) and the kanban/cron notifiers (owning-
  profile scope, attested targets) are the precedents. A pane reply needs one
  small new endpoint resolving `session_key → origin → adapter`.
- **Approval**: a user-typed pane reply sent via direct `adapter.send`
  triggers no tool-approval gate (those cover terminal/file/computer-use),
  same as dashboard console sends and cron/kanban notifications. The gate is
  the UI's explicit confirm + profile scope + premium entitlement — never a
  background auto-send.
- **Privacy law of this feature**: the LEADS store must NOT persist message
  text, full threads, secrets, or unredacted phone/handles — routing keys
  (`platform, chat_id, thread_id, user_id`) + bounded metadata only
  (`agent/redact.py`, `hermes_logging.py`, per-adapter log truncation).
  `state.db` keeps transcripts by design; LEADS reads snippets at render,
  never copies them.
- **Pane pattern** is settled (goals/feeds): premium-gated react-query,
  `POST` actions with busy lock + inline `role=alert` errors, invalidate on
  success (`api/goals.ts`, `web_routers/goals.py`, `goals-pane.tsx:165`).

## 3. Contact model

A contact is a deduplicated human behind one or more conversations:

```json
{
  "id": "c_<12hex>",
  "display_name": "Ada Lovelace",
  "channels": [
    {"platform": "whatsapp", "chat_id": "15551234567@s.whatsapp.net",
     "chat_type": "dm", "user_id": "15551234567@s.whatsapp.net",
     "session_key": "agent:main:whatsapp:dm:1555...", "scope_id": null}
  ],
  "emails": ["ada@example.com"],
  "phones": ["+27 82 555 0147"],
  "first_seen_at": 0.0, "last_seen_at": 0.0,
  "muted": false, "pinned": false, "note": ""
}
```

Identity resolution rules (per channel, v1):

| Channel | Contact key | Display | Notes |
|---|---|---|---|
| WhatsApp (bridge) | canonical JID user part | sender name → JID | phone = numeric part; `@lid` vs `@s.whatsapp.net` aliases merge via `canonical_whatsapp_identifier` |
| WhatsApp Cloud | `wa_id` digits | profile name → digits | DM-only today (groups refused upstream) |
| Slack | `scope_id + user_id` | display → real name → id | team-scoped: same human, two workspaces = two contacts v1 |
| Discord | `user_id` snowflake | display name | guild noted, not keyed (matches session-key design) |
| Telegram | `user_id` | full name → chat title | groups keyed per-chat (respect `group_sessions_per_user`) |
| Web form | email (lowercased) | organization → email | phone attached when given; submission id links the intake conversation |
| Desktop paste / CLI | — | — | no human identity; never becomes a contact |

Cross-channel merge is explicitly v2: v1 keeps one contact per channel key.
Where a phone (WhatsApp/form) or email (form-only) matches another contact,
the pane shows a "also on …" hint; merging stays manual (a later `merge`
action), never heuristic-auto.

## 4. Derivation, not capture (store design)

No new capture path. Contacts are **derived** from rows that already exist:

1. `sessions` rows with a human origin (`user_id` present, `is_bot` false),
   newest-first by `last_activity_at` — the contact list.
2. `portal_intake_submissions` (form funnel) + local intake events — email/
   phone contacts, linked to their intake conversation.
3. `PairingStore` approved entries — accelerates naming for paired DMs.

Derived state is recomputed on read (bounded: last N active sessions), plus
one small overrides record in `state_meta` (`leads:overrides:v1`:
`{contact_id: {muted, pinned, note}}`) for the only user data that has no
other home. No migration, no new table — profile isolation falls out of the
per-home `state.db` automatically. Rationale: a contacts table would rot the
moment sessions move; derivation cannot disagree with the source of truth.

Per-contact live fields (computed, never stored): last message snippet
(bounded prefix, same shape as the existing session-preview SQL),
unread count (`messages.timestamp > sessions.last_read_at`), channel
liveness (adapter configured/connected — reuse the channel status surfaces).

## 5. Reply flow

New endpoint `POST /api/leads/reply` (in a new `web_routers/leads.py`):

```
{ contact_id, text }  (text 1..4000 chars; the UI confirms, the API enforces)
→ resolve contact → pick newest DM session (groups refuse v1: reply needs an
  unambiguous target; group rows surface read-only with a "groups are
  read-only in v1" note)
→ resolve origin + live delivery adapter under ?profile= scope
  (fail-closed: unknown adapter → 409 with the remedy, never a wrong-bot send)
→ adapter.send(chat_id, text)  (thread_id carried where the session has one)
→ touch last_read_at (a sent reply marks the conversation read)
→ { ok, message_id? }
```

Rules: premium-gated like every surface; text-only v1 (no attachments —
`send_document` exists per adapter for later); replies send **as the
connected bot account** (stated in the UI, never ambiguous); delivery
failures return typed errors (flood/rate-limit surfaced, not swallowed);
every send writes one audit line with routing keys only (no text). No
agent turn is started — v1 sends literal user-typed text (the `minerva
send` precedent). Agent-assisted drafting ("suggest a reply") is a
follow-up, reusing the summarizer pattern, never auto-send.

## 6. Pane UX (`minerva-leads`, beside Bots/Feeds/Goals/PRDs)

- List: search + channel filter chips; rows show name, channel badge,
  snippet, time, unread dot; muted collapse to a muted section; form leads
  show email/phone + organization.
- Conversation view: selecting a row shows recent messages (read-only,
  bounded) + reply box with explicit Send (busy lock, inline errors).
- Contact detail: channels, emails/phones, first/last seen, note edit,
  mute/unmute, "also on …" hints, link to the intake conversation for
  form leads.
- Empty states per channel (nothing connected → setup hint, never blank),
  premium lock identical to sibling panes, all strings in the plugin catalog
  (en + ja/zh/zh-hant).

## 7. Build order

1. **Directory backend** — `hermes_cli/leads.py` (derive contacts from
   sessions + pairing + forms; snippet + unread computation), unit tests
   with seeded session rows (no gateway). Proves identity rules per channel.
2. **Read REST** — `GET /api/leads` (+ `?channel=`), `GET
   /api/leads/{id}` (detail + recent messages), premium-gated, TestClient
   E2E against temp homes. Mount in `web_server.py`.
3. **Reply endpoint** — `POST /api/leads/reply` with the resolution chain
   (contact → session → origin → live adapter), fail-closed cases tested
   (unknown adapter, group target, empty/oversize text, lapsed premium).
4. **Pane** — `minerva-leads` plugin mirroring `minerva-goals` (inbox
   section ≈ confirmation inbox), `src/api/leads.ts`, i18n × 4, core
   `common.leads` × 7, vitest (render, reply flow, lock, lookups), tsc.
5. **Polish** — cross-channel "also on" hints, mute/pin/notes overrides,
   form-lead→intake deep links, group read-only notes.

## 8. Tests (per phase, invariant-style)

- Identity: JID canonicalization pairs, Slack team scoping, Discord
  guild-noted, Telegram group-per-chat, form email-lowercased dedupe,
  bot sessions never become contacts, CLI/desktop turns never become
  contacts.
- Derivation: newest-wins naming, snippet bounded, unread from
  `last_read_at`, muted excluded by default, empty store → empty list.
- Reply: unknown adapter 409, group 400, empty/oversize 400, free tier
  402, send failure surfaces (no silent drop), reply marks read.
- Pane: render matrix, reply confirm flow, lock + upsell, i18n
  completeness, registration contract.

## 9. Risks and open questions

- **WhatsApp identity aliases** (`@lid` vs `@s.whatsapp.net` vs phone):
  merge via `canonical_whatsapp_identifier`, but three-way splits exist in
  the wild — verify against real JID samples during build.
- **Same human, many sessions**: v1 dedupes by channel key only; a human
  with two DMs (e.g., reinstalled app → new session) appears twice until
  the manual merge lands. Acceptable, documented.
- **Reply attribution**: the reply arrives from the bot account, not the
  operator personally — fine for business accounts, stated in UI.
- **No auto-reply, ever in v1**: any future automation is a new plan with
  its own abuse review (unattended outbound defaults deny).
- **Volume**: derivation scans recent sessions per read — bounded query
  with the existing session indexes; measure before optimizing.
- **Threads**: Slack/Discord thread replies carry `thread_id`; verify
  against live threads (adapter `send` accepts `reply_to`/metadata —
  confirm per platform during build).
