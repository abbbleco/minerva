import { NextResponse } from "next/server";
import { creditsForPlan, paidPlan, PAID_PLAN_IDS, rolloverCapForPlan } from "@minerva/billing";

export const dynamic = "force-dynamic";

const CTAS: Record<string, { cta: string; bonus?: string; highlight?: boolean }> = {
  plus: { cta: "Get Minerva", bonus: "10%", highlight: true },
  super: { cta: "Liberate Minerva", bonus: "10%" },
  ultra: { cta: "Unleash Minerva", bonus: "10%" },
};

/**
 * Public plan catalog for external clients (desktop pricing view).
 * Pure price/credit figures — no auth, no secrets. CORS-open for GET so the
 * Electron renderer can fetch it directly; same shape the portal pages render.
 */
export async function GET() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.abbble.co.za").trim().replace(/\/+$/, "");
  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      currency: "usd",
      credits: 0,
      rollover_cap: rolloverCapForPlan("free"),
      features: ["Free models only", "Standard rate limits", "$0 monthly credits"],
      cta: "Try Minerva",
      subscribe_url: `${site}/signup`,
    },
    ...PAID_PLAN_IDS.map((id) => {
      const plan = paidPlan(id);
      const meta = CTAS[id] ?? { cta: `Get ${plan.name}` };
      return {
        id,
        name: plan.name,
        price: plan.amountCents / 100,
        currency: plan.currency,
        credits: creditsForPlan(id),
        rollover_cap: rolloverCapForPlan(id),
        bonus: meta.bonus,
        highlight: meta.highlight ?? false,
        features: [
          `$${creditsForPlan(id)} monthly credits`,
          `$${rolloverCapForPlan(id)} rollover cap`,
          "400+ Models",
          "Hosted tool usage",
          "High rate limits",
        ],
        cta: meta.cta,
        subscribe_url: `${site}/plans`,
      };
    }),
  ];
  return NextResponse.json(
    { plans, currency_note: "Portal tiers bill in USD." },
    { headers: { "access-control-allow-origin": "*" } }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
    },
  });
}
