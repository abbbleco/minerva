# Minerva for Business — Product Summary

> Minerva (`github.com/abbbleco/minerva`) by **ABBBLE CO** — the background
> **Computer Use agent** for business: an employee that operates your software
> while you keep working, billed per agency through the ABBBLE Portal.

## What it is

Minerva **drives your computers** — clicking, typing, scrolling, and dragging
in the background on macOS, Windows, and Linux. Your cursor never moves, focus
never changes, desktops never switch: you and the agent co-work on the same
machine. Unlike foreground demos, it works with **any tool-capable model**
(Claude, GPT, Gemini, or a local open model), ships its driver bundled, and can
run sandboxed so it only ever touches what it's allowed to.

Around that core, Minerva is a full agent: it holds conversations, uses tools
(local terminal, browser, files, messaging), remembers context across sessions,
delegates to subagents, and runs scheduled jobs. You supervise it through four
surfaces:

| Surface | What it is |
|---|---|
| **Desktop app** (Electron) | Native chat app for Windows/macOS/Linux with its own backend per profile |
| **Messaging gateway** | ~20 platforms (Telegram, Discord, Slack, WhatsApp, Teams, …) from one deployment |
| **Terminal (TUI/CLI)** | `minerva --tui` / `minerva chat` for operators and developers |
| **Dashboard** | Browser control plane for sessions, models, billing, and providers |

Capability grows at the edges — **skills and plugins** — not by bloating the
core, so businesses can add proprietary integrations without forking.

## How businesses pay: ABBBLE Portal

One subscription covers **models and tools** — no per-provider API keys to
procure and rotate. Sign in once at `portal.abbble.co.za` and every surface
lights up.

| Tier | Price (ZAR, Paystack) | Monthly credits (USD) |
|---|---|---|
| Free | R0 | Free models only |
| Plus | R350 | ~$23.49 |
| Super | R1,650 | ~$110.74 |
| Ultra | R3,500 | ~$234.90 |
| Agency | Custom (sales-led) | Volume + invoicing |

- Credits include a 10% bonus over list price; unused credits roll over within
  caps (10/50/100).
- The **Agency** tier adds custom volume, invoicing, and onboarding via
  `sales@abbble.co.za`.
- Billing, plans, and key management live in the portal; the desktop billing
  page mirrors balance, plan, and usage, with purchases linking out to the portal.

## The Minerva Router (metered inference)

All model traffic flows through the Minerva Router — the **only** component
holding upstream credentials. Businesses authenticate with a per-agency key;
the router authenticates the tenant, enforces plan/credit/quota gates, relays,
meters, and debits a credit ledger:

- **Live model catalog** from OpenRouter (hourly cache, stale-served on
  failure) — hundreds of models, tier-filtered per key. Free keys see only
  zero-price models; paid keys see everything.
- **Sane default**: new sign-ins land on the free meta-router, which works on
  every tier and picks a live free model per request.
- **Fail-open billing gates**: an unreadable balance never locks tenants out;
  only a proven violation denies. Every denial names the reason and the fix.
- Nightly ledger-vs-invoice reconciliation keeps finance exact.

## Built for teams and operations

- **Agencies & profiles**: isolated homes per team/project (`minerva -p <name>`);
  one multiplexed gateway can serve many profiles, each with its own secrets,
  sessions, and billing scope. No cross-profile leakage by design.
- **Runs as a service**: systemd / launchd / Windows service installs with
  fleet-wide updates, pre-update snapshots, and version verification.
- **Scheduled work**: cron jobs, background polls, and goal tracking run
  unattended with full audit trails.
- **Memory & skills**: the agent learns across sessions; teams package
  repeatable know-how as skills (bundled, custom, or catalog-installed).
- **Bot Mode**: persistent AI teammates with their own identity and
  never-lost conversation history.
- **Security posture**: scoped secrets per profile, approval gates for
  sensitive tool actions, redacted diagnostics sharing, sandboxed previews,
  and private vulnerability reporting (`security@nousresearch.com` /
  GitHub Security Advisories).

## Deployment shapes

1. **Desktop-led** — install the app, sign in to the Portal, chat. Zero ops.
2. **Self-hosted gateway** — one box serves a team's messaging channels 24/7
   on a single subscription.
3. **Multi-profile fleet** — agencies isolate clients/projects per profile
   under one managed install, each metered through the router ledger.

## Extending it

- **Skills** for repeatable business workflows (support triage, reporting,
  research briefs) — markdown + scripts, versioned, shareable.
- **Plugins** for systems integration (CRMs, internal APIs, data sources)
  through stable ABCs and hooks — core files are never touched.
- **Provider-agnostic**: OpenAI-compatible routing plus direct provider
  integrations; bring your own endpoint (vLLM, Ollama, private gateways)
  alongside the subscription.

## Contact

- Portal & plans: `https://portal.abbble.co.za`
- Sales (Agency tier): `sales@abbble.co.za`
- Issues & feedback: `https://github.com/abbbleco/minerva`
