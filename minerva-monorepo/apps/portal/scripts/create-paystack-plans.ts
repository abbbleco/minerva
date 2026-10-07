/**
 * Provision the three ZAR monthly subscription plans on Paystack.
 *
 * Amounts come from `@minerva/billing` (single source of truth) — this script
 * never hardcodes a price. Re-runnable: existing plans (same name + amount +
 * currency + monthly interval) are reused, never duplicated. Prints the
 * `PAYSTACK_PLAN_*` env block at the end.
 *
 * Usage:
 *   pnpm --filter @minerva/portal paystack:plans            # test key
 *   pnpm --filter @minerva/portal paystack:plans -- --live   # live key only
 *   pnpm --filter @minerva/portal paystack:plans -- --dry-run
 *
 * Needs `PAYSTACK_SECRET_KEY` in env. Test keys run freely; live keys refuse
 * without `--live` so a live plan is never created by accident. Run once per
 * environment (test, then live) — plan codes differ per environment.
 */

import { paidPlan } from "@minerva/billing";

const TIERS = ["plus", "super", "ultra"] as const;
type Tier = (typeof TIERS)[number];

const PLAN_NAMES: Record<Tier, string> = {
  plus: "Minerva Plus",
  super: "Minerva Super",
  ultra: "Minerva Ultra",
};

const ENV_VARS: Record<Tier, string> = {
  plus: "PAYSTACK_PLAN_PLUS",
  super: "PAYSTACK_PLAN_SUPER",
  ultra: "PAYSTACK_PLAN_ULTRA",
};

interface DashboardPlan {
  plan_code: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
}

export interface PlanSpec {
  name: string;
  amount: number;
  currency: string;
  interval: string;
}

/** A dashboard plan satisfies a spec when name, amount, currency and interval agree. */
export function findMatchingPlan(plans: DashboardPlan[], spec: PlanSpec): DashboardPlan | null {
  return (
    plans.find(
      (p) =>
        p.name === spec.name &&
        p.amount === spec.amount &&
        String(p.currency ?? "").toUpperCase() === spec.currency &&
        p.interval === spec.interval
    ) ?? null
  );
}

export function planSpecForTier(tier: Tier): PlanSpec {
  const plan = paidPlan(tier);
  return {
    name: PLAN_NAMES[tier],
    amount: plan.amountCents,
    currency: plan.currency.toUpperCase(),
    interval: "monthly",
  };
}

function apiKey(): { key: string; live: boolean } {
  const key = (process.env.PAYSTACK_SECRET_KEY ?? "").trim();
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not set — export it first (test or live key).");
  }
  return { key, live: key.startsWith("sk_live_") };
}

async function paystack(path: string, key: string, init?: { method?: string; body?: unknown }) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: init?.method ?? "GET",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: never;
    meta?: { pageCount?: number };
  } | null;
  if (!res.ok || !json || json.status !== true) {
    throw new Error(`Paystack ${path} failed (${res.status}): ${json?.message ?? "no message"}`);
  }
  return json;
}

async function listPlans(key: string): Promise<DashboardPlan[]> {
  const out: DashboardPlan[] = [];
  let page = 1;
  for (;;) {
    const json = await paystack(`/plan?perPage=100&page=${page}`, key);
    const data = (json as { data?: DashboardPlan[] }).data ?? [];
    out.push(...data);
    const pageCount = (json as { meta?: { pageCount?: number } }).meta?.pageCount ?? 1;
    if (page >= pageCount) break;
    page += 1;
  }
  return out;
}

async function main(args: string[]): Promise<void> {
  const dryRun = args.includes("--dry-run");
  const allowLive = args.includes("--live");
  const { key, live } = apiKey();
  if (live && !allowLive) {
    throw new Error("live key detected — re-run with --live to create live plans.");
  }
  console.log(`Paystack mode: ${live ? "LIVE" : "test"}${dryRun ? " (dry run)" : ""}`);

  const existing = await listPlans(key);
  const codes: Record<Tier, string> = { plus: "", super: "", ultra: "" };
  for (const tier of TIERS) {
    const spec = planSpecForTier(tier);
    const match = findMatchingPlan(existing, spec);
    if (match) {
      console.log(`reuse   ${tier}: ${match.plan_code} (${spec.name}, ${spec.amount} ${spec.currency}/mo)`);
      codes[tier] = match.plan_code;
      continue;
    }
    if (dryRun) {
      console.log(`would create ${tier}: ${spec.name}, ${spec.amount} ${spec.currency}/mo`);
      codes[tier] = "<dry-run>";
      continue;
    }
    const created = await paystack("/plan", key, {
      method: "POST",
      body: { name: spec.name, amount: spec.amount, interval: spec.interval, currency: spec.currency },
    });
    const data = (created as { data?: DashboardPlan }).data;
    if (!data?.plan_code) throw new Error(`plan create for ${tier} returned no plan_code`);
    console.log(`created ${tier}: ${data.plan_code} (${spec.name}, ${spec.amount} ${spec.currency}/mo)`);
    codes[tier] = data.plan_code;
  }

  console.log("\nSet these where the portal runs:");
  for (const tier of TIERS) console.log(`${ENV_VARS[tier]}=${codes[tier]}`);
}

if ((process.argv[1] ?? "").endsWith("create-paystack-plans.ts")) {
  main(process.argv.slice(2)).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
