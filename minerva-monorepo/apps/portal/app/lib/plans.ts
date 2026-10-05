// Portal display tiers (ABBBLE pricing.png). Prices, credits and rollover caps are
// DERIVED from `@minerva/billing` — the merged source of truth — so display can never
// drift from what checkout grants and the router gates. Only presentation (images,
// CTAs, bonus badge) lives here. NOTE: FREE shows $0 credits per the design; free keys
// are restricted to cost-$0 models, so the package's flat free grant never debits.

import { creditsForPlan, paidPlan, rolloverCapForPlan } from "@minerva/billing";

export interface PortalPlan {
  id: "FREE" | "PLUS" | "SUPER" | "ULTRA";
  price: number;
  bonus?: string;
  image: string;
  features: string[];
  cta: string;
  highlight?: boolean;
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
    image: "/placeholders/images.jpg",
    features: ["Free models only", "Standard rate limits", "$0 monthly credits"],
    cta: "Try Minerva",
  },
  {
    id: "PLUS",
    price: paidPlan("plus").amountCents / 100,
    bonus: "10%",
    image: "/placeholders/img_7895.jpg",
    features: paidFeatures("plus"),
    cta: "Get Minerva",
    highlight: true,
  },
  {
    id: "SUPER",
    price: paidPlan("super").amountCents / 100,
    bonus: "10%",
    image: "/placeholders/Minerva.jpg",
    features: paidFeatures("super"),
    cta: "Liberate Minerva",
  },
  {
    id: "ULTRA",
    price: paidPlan("ultra").amountCents / 100,
    bonus: "10%",
    image: "/placeholders/images.jpg",
    features: paidFeatures("ultra"),
    cta: "Unleash Minerva",
  },
];
