"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PortalPlan } from "../lib/plans";
import {
  planActionForTier,
  type SubscriptionSnapshot,
} from "../lib/account-display";

async function readSubscription(signal: AbortSignal): Promise<SubscriptionSnapshot | null> {
  try {
    const res = await fetch("/api/billing/subscription", { cache: "no-store", signal });
    if (!res.ok) return { logged_in: false, current: null };
    const json = (await res.json()) as {
      logged_in?: boolean;
      current?: { tier_id: string; name: string; monthly_credits: number } | null;
    };
    if (!json.logged_in || !json.current) return { logged_in: false, current: null };
    return { logged_in: true, current: json.current };
  } catch {
    return null;
  }
}

/**
 * Tier cards with subscription-aware CTAs. Signed out the grid looks exactly
 * as before; signed in the current tier locks to "Current plan", other tiers
 * route to subscription management, and a banner names the active package.
 */
export default function PlansGrid({ plans }: { plans: PortalPlan[] }) {
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    readSubscription(controller.signal).then((state) => setSubscription(state));
    return () => controller.abort();
  }, []);

  const current =
    subscription && subscription.logged_in ? subscription.current : null;

  return (
    <>
      {current && (
        <p
          role="status"
          className="mb-4 rounded-[4px] border border-white/15 bg-white/5 px-4 py-3 text-[13px] text-white/85"
        >
          You&apos;re on <strong>{current.name}</strong> · ${current.monthly_credits} monthly
          credits. Other tiers apply on your next billing change.
        </p>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const action = planActionForTier(p, subscription ?? null);
          const isCurrent = action.kind === "current";
          return (
            <article
              key={p.id}
              className={
                isCurrent
                  ? "rounded-[4px] border-2 border-white p-5"
                  : p.highlight
                    ? "rounded-[4px] bg-[#1f22ff] p-5"
                    : "nous-card-flat p-5"
              }
            >
              <div className="flex items-center justify-between">
                <span className="rounded-[2px] bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-[#0a0a2b]">
                  {p.id}
                </span>
                {p.bonus && (
                  <span className="rounded-[2px] border border-white/60 px-2 py-0.5 font-mono text-[10px] text-white">
                    {p.bonus} BONUS
                  </span>
                )}
              </div>
              <p className="nous-display mt-3 text-[56px]">${p.price}</p>
              <p className="text-[11px] tracking-widest text-white/60 uppercase">Per month</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt={`${p.id} tier art`}
                className="nous-duo mt-3 h-[150px] w-full rounded-[2px] object-cover"
                draggable={false}
              />
              <ul className="mt-4 space-y-1.5 text-[13px] text-white/80">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <button
                  type="button"
                  disabled
                  aria-current="true"
                  className="nous-btn-outline mt-6 w-full cursor-default !border-white/40 !text-white opacity-70"
                >
                  {action.text}
                </button>
              ) : (
                <Link
                  href={action.href ?? "/signup"}
                  className="nous-btn-outline mt-6 w-full !border-white/40 !text-white"
                >
                  {action.text}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
