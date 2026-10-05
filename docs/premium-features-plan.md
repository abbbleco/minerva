# Premium Features — Implementation Plan

Five premium features, one shared foundation. Ordered by dependency, not by
feature number — each phase unlocks the next, and every phase ships something
usable on its own.

Status: Phase 0 done (verified), Phase 1 done (verified), Phase 2 done (verified:
poller + ingest summarizer + pane + providers rss/facebook/instagram + cron
background polling), Phase 3 done (verified: goal registry + migration +
turn-end detection hook on gateway/TUI/CLI + `/goal` subcommand parity + REST
router + `minerva-goals` pane + explicit kanban bridge); Phase 4 next. Update
the status line per phase as work lands.

## Ground truths (what we're building on, not around)

| Exists | Lives at | Reuse for |
|---|---|---|
| Bots roster pane | `apps/desktop/src/plugins/minerva-bots/roster-pane*.tsx` | Feeds pane sits beside it, same shell pattern |
| Goal state machine | `hermes_cli/goals.py` (`GoalManager`, `GoalState`, `GoalContract`) + `goal_command.py` | Goals extends this; does **not** reinvent tracking |
| Kanban boards | `hermes_cli/kanban*.py`, `tools/kanban_tools.py` | Goals and PRDs both resolve into trackable work items here |
| Scheduler | `cron/jobs.py`, `cron/scheduler.py` | Feed polling, goal check-ins, PRD digest jobs |
| Normalized message intake | `gateway/platforms/*.py` + `event.py` (Telegram, Discord, Slack, WhatsApp, …) | PRD intake reads the normalized event, never per-platform code |
| Billing/entitlement | desktop `billing/api.ts` RPCs → portal plans (free/plus/super/ultra/agency) | Premium gating for all five |
| Qontxt intake proxy | sibling `Qontxt/apps/agency-web/app/api/v1/intake/route.ts` | Exact pattern for feature 5 (thin Next.js proxy → upstream intake API) |
| STT / file tools / vision models | agent config + tool registry | PRD multimodal inputs |

Two repo laws constrain the design: new capability arrives as **plugin + skill
+ pane, never as core tools or core schema** (footprint ladder), and anything
user-visible in the desktop goes through the **i18n catalog**, never hardcoded
English.

## Phase 0 — Shared foundations (all five depend on this)

Build once, before any feature:

1. **Premium entitlement helper** — one resolver, used by every feature:
   `billing/api.ts` → `subscription.state` → tier. Contract:
   `isPremiumTier()` = plus/super/ultra/agency. Every feature checks it in
   **two places**: the pane hides/disables when not entitled (renderer),
   *and* the RPC/backend method re-checks (never trust the client). Free tier
   degrades to a named upsell state, never a blank panel or a crash.
2. **Intake event schema** — one canonical shape for "something arrived that
   might become work": `{id, source, author, timestamp, text,
   attachments[] (image/audio/file with MIME + bytes-ref), conversation_id,
   thread_context[]}`. Gateway platform adapters already normalize to near
   this; the schema freezes it so Feeds items, PRD candidates and form
   submissions are interchangeable downstream.
3. **PRD document schema** — one shape for the artifact: `{id, title, problem,
   users, requirements[], acceptance_criteria[], open_questions[], sources[]
   (which intake events), status: draft|in_review|approved|rejected,
   history[]}`. Stored beside kanban state, rendered by one viewer component
   reused in the PRD panel, the review queue and the form-intake confirmation.
4. **Attachment pipeline** — one path for non-text: images → vision-capable
   model caption/summary; voice → STT → transcript; documents → file-read
   tools → extracted text. Output is always `{transcript, summary}` attached
   to the intake event. Every downstream consumer (PRD triage, drafting) reads
   the transcript, never raw bytes.

Acceptance: entitlement helper unit-tested with mocked billing states (free
shows upsell, paid shows feature); intake schema round-trips through gateway
event → JSON → back; PRD schema validates and renders empty.

## Phase 1 — Ideas (simplest; ships first, proves the pane pattern)

A gallery panel of what users can do with Minerva. This is **content +
launcher**, almost no backend.

- **Content**: a curated catalog (use-case cards: title, one-line pitch,
  difficulty, which providers/models it needs). Ships as i18n catalog entries
  + a small data file, so it localizes like everything else. Curated by hand
  — this is editorial, not generated.
- **Launcher**: each card has a "Try it" action that dispatches the existing
  mechanism for that use-case (slash command, starter prompt into a new
  session, deep link to the relevant settings surface). No new execution
  paths — it composes existing ones.
- **Placement**: new pane in the desktop shell, listed alongside Bots. Gated:
  free tier sees a subset + upsell on premium-only cards.
- **Backend**: none, beyond the entitlement check. If a card needs a
  capability probe (e.g. "needs a vision model"), reuse the existing
  model-capability queries.

Acceptance: panel renders in all locales; every "Try it" lands the user in a
working session of that type; free tier sees the degraded set with correct
upsell copy. Tests: content completeness (every card has
title/pitch/action/target), launcher dispatch for each action type.

## Phase 2 — Feeds (curated feed panel next to Bots)

A **curated** panel — editorial selection with agent summarization, not an
algorithmic firehose. "Curated" is load-bearing: it bounds scope (a fixed
source list, not the whole internet) and justifies premium.

- **Sources**: a per-user source list (RSS/Atom, a few API-backed sources),
  managed in settings. Defaults ship with a small curated set. Sources are data
  (URL + poll interval + per-source enable), not code.
- **Polling**: cron jobs per source (`cron/jobs.py` + scheduler), respecting
  each source's interval, with dedupe by URL/guid. Failures back off; a dead
  source surfaces as degraded, never blocks the panel.
- **Summarization**: new items go through a summarizer (short brief +
  why-it-matters, 2–3 lines) at ingest time, not render time — the panel reads
  cached briefs. Summarization is a skill-guided agent call on the user's
  configured provider (see model policy), batchable.
- **Pane**: sits next to Bots in `apps/desktop/src/plugins/` (new
  `minerva-feeds/` plugin mirroring the `minerva-bots/` roster-pane pattern:
  pane component, toolbar, sections). Items support open-original, mark-read,
  save-to-session (injects the brief into a chat as context).
- **Placement/interaction rules** (from the desktop guide): background polls
  never steal focus or navigate; unread counts update quietly; terminal
  transitions (a poll failure affecting all sources) surface once, not per item.

Acceptance: add-source → poll → summarized item appears without focus theft;
dead source degrades visibly; save-to-session injects correct context. Tests:
poller with fixture feeds (new item, duplicate, malformed, dead source),
dedupe, scheduler registration, pane rendering from cached state.

## Phase 3 — Goals (tracked goals with agent-detected completion)

Extends the existing machine — `GoalManager`/`GoalState`/`GoalContract` and
the `/goal` command family stay the source of truth for *state*; this phase
adds *plural tracking, a panel, and detection*.

- **Data model**: the current manager is per-session. Add a goal registry
  (multiple named goals per profile: `{id, title, contract,
  status: active|paused|complete|abandoned, history[]}`), with the existing
  `GoalState` as the per-goal record. Migration path for the single active
  goal already in state.
- **CLI parity**: `/goal` subcommands (`create/list/show/pause/complete/abandon`)
  via the existing `dispatch_goal_command` — adapters only, no new parser (per
  the slash-command rules).
- **Detection hook** (the auto-update): on turn end — **only** when tools ran
  and at least one goal is active — a cheap judge call on the user's
  configured provider (see model policy) asks "did this turn accomplish any
  tracked goal, and which, with what evidence?" Design
  constraints that make this safe:
  - **Debounced**: judge at most once per turn, never mid-turn; sessions with
    no active goals pay zero.
  - **Evidence-required**: the judge must quote the transcript span supporting
    completion; no quote, no transition.
  - **Confirm-by-default**: a detected completion proposes (`status →
    pending-confirmation` + user notification), it does not self-complete —
    except above a high confidence threshold with an undo window, and that
    exception is a setting, default off.
  - **Audit trail**: every transition (proposed, confirmed, auto, abandoned)
    appends to `history[]` with timestamp, trigger and evidence. A goal's
    status is never a bare flag.
- **Pane**: goals list with status, progress rendering from the contract,
  create/manage dialogs, and the confirmation inbox for proposed completions.
  Same shell pattern as Bots/Feeds.
- **Kanban bridge**: completing (or explicitly dispatching) a goal can mint a
  kanban work item — goals track *outcomes*, kanban tracks *work*; the link is
  explicit, never automatic.

Acceptance: create → work turns → proposal with quoted evidence → confirm →
status + history; false-positive drill (a turn that looks close but isn't)
proposes nothing; paused goals are never judged. Tests: registry CRUD +
migration of legacy single goal; judge prompt fixtures (clear-complete,
close-but-not, unrelated turn); confirmation flow; CLI subcommand parity.

## Phase 4 — PRDs (smart intake → PRD, multimodal)

The largest feature, and the one with an explicit anti-requirement: **it must
not create a PRD per conversation.** So the pipeline is staged with the
intelligence concentrated in the triage gate, not the renderer:

1. **Intake** — subscribes to the normalized gateway events (all platforms free
   via `event.py`) plus manual injections (paste-a-transcript, upload-a-file,
   forward-a-voice-note). Everything becomes the Phase-0 intake event,
   attachments via the Phase-0 pipeline. Intake itself creates nothing.
2. **Triage gate** (the smart part) — a classifier over each *conversation*
   (not message), running on the user's configured provider (see model
   policy): positive signals (request to build/change something,
   sustained multi-turn problem discussion, explicit "we should…" language,
   repeated topic across sessions); negative signals (chit-chat, Q&A that
   resolved, already covered — embedding-similarity dedupe against existing
   PRDs above threshold). Three outcomes, never two: **draft** (above high
   threshold), **watch** (ambiguous — accumulate more context, re-evaluate),
   **dismiss** (with reason logged). Thresholds are settings, defaults
   conservative. The review queue shows drafts *and* watches, so recall
   failures are visible and tunable.
3. **Drafting** — a structured writer, running on the user's configured
   provider (see model policy), producing the Phase-0 PRD schema
   (problem, users, requirements, acceptance criteria, open questions), with
   every section citing its source intake events. Sources are clickable back
   to the original conversation.
4. **Review queue** — human approves/edits/rejects. Approval is what promotes
   draft → approved; rejection records why (feeds back into triage tuning).
   Nothing reaches kanban without passing review.
5. **Kanban bridge** — approved PRDs decompose into work items via the
   existing kanban machinery (`kanban_decompose.py` et al.), linked back to
   the PRD.

Multimodal is inherited from Phase 0 (images captioned, voice transcribed,
documents extracted) — triage and drafting only ever read
transcripts/summaries, so a voice-note feature request and a typed one take
the identical path.

Acceptance (the ones that matter): a 50-message support thread produces
**zero** PRDs; a real feature discussion produces one draft with cited
sources; a duplicate discussion of an existing PRD is deduped, not duplicated;
a voice note and a document follow the same path as text. Tests: triage
fixtures per outcome (draft/watch/dismiss/duplicate), dedupe similarity
boundary, drafting output validates against the PRD schema with citations
present, review transitions + history.

## Phase 5 — Website form intake API (Minerva version of Qontxt's)

Mirrors the proven Qontxt shape
(sibling `Qontxt/apps/agency-web/app/api/v1/intake/route.ts`: thin Next.js
proxy → upstream intake API with a site key), but the upstream is new: a
Minerva intake endpoint that validates, authenticates per-site, stores, and
enqueues into the Phase-4 pipeline.

- **Frontend** (`agency-web`, new form component): the actual `<form>` —
  fields per use-case (brief, email, organization, attachments optional),
  honeypot + rate limit (same pattern as the existing contact-sales
  throttle), success/error states. Pure presentational; posts JSON to the
  local proxy route.
- **Proxy** (`agency-web/app/api/v1/intake/route.ts`): forwards to the
  upstream with the site's API key from env, passes status/body through
  untouched (Qontxt's exact behavior — the proxy adds auth, never logic).
- **Upstream** (new, portal app): `POST /api/intake` — validates shape,
  authenticates the site key (per-site keys minted in the portal console,
  revocable, rate-limited per key), stores the submission, returns an id
  immediately, and enqueues PRD triage asynchronously (never blocks the form
  response on drafting). Reuses the Phase-4 intake event + triage + review
  queue verbatim — a form submission is just another intake source, which is
  why Phase 4 comes first.
- **Confirmation loop**: the submitter gets a tracking id; approved PRDs can
  notify the source channel where the intake supports replies.

Acceptance: valid submission → stored + queued + id returned in under a second
(drafting async); bad key → 401; malformed body → 400 with field errors; spam
burst → throttled; an approved form-sourced PRD renders with the submission
as a cited source. Tests: proxy passthrough (status/body intact), auth
(missing/bad key, revoked key), validation matrix, throttle, end-to-end form
→ stored → triaged.

## Cross-cutting requirements (every phase)

- **Model policy: the user's configured provider does all the work.** Every
  LLM call in these features — feed summarizer, goal judge, PRD triage
  classifier, PRD drafting writer — runs on the user's configured
  provider/model (`model.provider` / `model.default`, the same resolution the
  agent itself uses), invoked through the standard model-call path with its
  fallback chains and retries. Never pin a model id or provider in
  premium-feature code: a pinned model would bill a different account, break
  offline/local setups, and bypass fallback. If the configured provider lacks a
  needed capability (e.g. no vision model for an image attachment), degrade
  with a visible marker ("image not analyzed") — never silently substitute
  another provider.
- **Premium gating**: entitlement helper (§Phase 0) in renderer *and* backend
  for every surface. Free tier gets named upsell states, never blank panels.
  New RPCs reject with the existing refusal-code pattern when unentitled.
- **i18n**: all user-visible strings through the catalog in every phase (en +
  the six translations). No hardcoded English, including triage/review status
  labels.
- **Tests per repo law**: invariant tests (behavior contracts, proven red on
  base), never change-detectors or source-reading tests; E2E the real path for
  resolution chains (entitlement → RPC → panel) against a temp home.
- **No core growth**: each feature is a plugin (`~/.hermes` or in-tree per the
  in-tree policy), a skill guiding the agent calls, CLI surface via existing
  dispatch, and panes in the desktop shell. If a feature needs something the
  plugin surface lacks, widen the generic surface — never special-case.
- **Privacy**: intake content (conversations, voice, documents, form
  submissions) is the most sensitive data in the system. Triage/drafting
  calls must respect the existing redaction and data-retention rules; stored
  PRDs inherit the profile's scope; nothing about intake content lands in logs.

## Build order and why

| Phase | Ships | Unlocks | Depends on |
|---|---|---|---|
| 0 | Entitlement, intake + PRD schemas, attachment pipeline | everything | — |
| 1 Ideas | gallery + launchers | pane pattern proven | 0 |
| 2 Feeds | poller + summarizer + pane | cron-driven content | 0 |
| 3 Goals | registry + panel + judge hook | auto-tracking | 0 (+ kanban exists) |
| 4 PRDs | triage + drafting + review + kanban bridge | the flagship | 0, 3's panel idioms |
| 5 Form intake | form + proxy + upstream endpoint | external funnel | 4's pipeline verbatim |

Start with 0 + 1 (small, visible, de-risks the pane and entitlement patterns),
then 2 and 3 in either order, then 4, then 5. Roughly 40% of the work is Phase
4, 25% Phase 3, and the rest split across 0/1/2/5.
