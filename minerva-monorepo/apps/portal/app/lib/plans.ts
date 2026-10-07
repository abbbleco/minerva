// Portal display tiers (ABBBLE pricing.png). Prices, credits and rollover caps are
// DERIVED from `@minerva/billing` — the merged source of truth — so display can never
// drift from what checkout grants and the router gates. Only presentation (images,
// CTAs, bonus badge) lives here. NOTE: FREE shows $0 credits per the design; free keys
// are restricted to cost-$0 models, so the package's flat free grant never debits.

import { creditsForPlan, paidPlan, planCurrency, rolloverCapForPlan } from "@minerva/billing";

export interface PortalPlan {
  id: "FREE" | "PLUS" | "SUPER" | "ULTRA";
  price: number;
  /** Rendered tier price (`R350` / `$20`) — tiers bill in the billing currency. */
  priceDisplay: string;
  bonus?: string;
  image: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

/** Major-units tier price with the billing currency's symbol. */
export function tierPriceDisplay(price: number, currency?: string): string {
  const code = (currency ?? planCurrency()).toLowerCase();
  const whole = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return code === "zar" ? `R${whole}` : `$${whole}`;
}

function paidFeatures(tier: "plus" | "super" | "ultra"): string[] {
  return [
    `$${creditsForPlan(tier)} monthly credits`,
    `$${rolloverCapForPlan(tier)} rollover cap`,
    "400+ Models",
    "Hosted tool usage",
    "High rate limits",
  ];
}

export const PORTAL_PLANS: PortalPlan[] = [
  {
    id: "FREE",
    price: 0,
    priceDisplay: tierPriceDisplay(0),
    image: "/placeholders/images.jpg",
    features: ["Free models only", "Standard rate limits", "$0 monthly credits"],
    cta: "Try Minerva",
  },
  {
    id: "PLUS",
    price: paidPlan("plus").amountCents / 100,
    priceDisplay: tierPriceDisplay(paidPlan("plus").amountCents / 100, paidPlan("plus").currency),
    bonus: "10%",
    image: "/placeholders/img_7895.jpg",
    features: paidFeatures("plus"),
    cta: "Get Minerva",
    highlight: true,
  },
  {
    id: "SUPER",
    price: paidPlan("super").amountCents / 100,
    priceDisplay: tierPriceDisplay(paidPlan("super").amountCents / 100, paidPlan("super").currency),
    bonus: "10%",
    image: "/placeholders/Minerva.jpg",
    features: paidFeatures("super"),
    cta: "Liberate Minerva",
  },
  {
    id: "ULTRA",
    price: paidPlan("ultra").amountCents / 100,
    priceDisplay: tierPriceDisplay(paidPlan("ultra").amountCents / 100, paidPlan("ultra").currency),
    bonus: "10%",
    image: "/placeholders/images.jpg",
    features: paidFeatures("ultra"),
    cta: "Unleash Minerva",
  },
];
