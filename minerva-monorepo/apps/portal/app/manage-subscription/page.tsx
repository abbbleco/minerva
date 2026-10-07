import type { Metadata } from "next";
import Link from "next/link";
import Topbar from "../components/topbar";
import Footer from "../components/footer";
import ManageClient from "./manage-client";
import { PORTAL_PLANS } from "../lib/plans";

export const metadata: Metadata = { title: "Manage Subscription | ABBBLE Portal" };

/**
 * Landing page for the desktop's "manage subscription" link.
 *
 * The desktop builds `{portal}/manage-subscription?org_id=<id>&plan=<tier>` and
 * opens it externally, so this route exists to keep that URL a stable contract
 * rather than to reimplement checkout. It names the tier the caller asked about
 * and hands off to the existing signup flow; `org_id` is a tenancy identifier
 * for the caller's own agency, never something to render back as a choice.
 *
 * A server component: the params arrive in the query string, so the target tier
 * is known before first paint and there is no client/signal hydration to
 * resolve.
 */
export default async function ManageSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ org_id?: string; plan?: string }>;
}) {
  const { plan } = await searchParams;
  const wanted = (plan ?? "").trim().toUpperCase();
  const tier = PORTAL_PLANS.find((p) => p.id === wanted) ?? null;

  return (
    <div>
      <Topbar section="Manage Subscription" />
      <section className="px-6 pt-10 md:px-10">
        <h1 className="nous-display text-[44px]">
          {tier ? `Manage your ${tier.id} plan` : "Manage your subscription"}
        </h1>
        <p className="mt-4 max-w-[80ch] text-[15px] leading-relaxed text-white/70">
              {tier
                ? `You are looking at the ${tier.id} tier — ${tier.priceDisplay} per month. Change or cancel it from the agency you are signed in to; the change applies to your next invoice and the current cycle runs to its end.`
            : "Change or cancel your plan from the agency you are signed in to. A change applies to your next invoice and the current cycle runs to its end."}
        </p>

        {tier ? (
          <article className="nous-card-flat mt-8 max-w-[46rem] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-[2px] bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-[#0a0a2b]">
                {tier.id}
              </span>
              {tier.bonus && (
                <span className="rounded-[2px] border border-white/60 px-2 py-0.5 font-mono text-[10px] text-white">
                  {tier.bonus} BONUS
                </span>
              )}
              <span className="nous-display ml-auto text-[40px]">{tier.priceDisplay}</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-[13px] text-white/80">
              {tier.features.map((f) => (
                <li key={f}>— {f}</li>
              ))}
            </ul>
            <ManageClient tierId={tier.id} />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/plans" className="nous-btn-outline !border-white/40 !text-white">
                Compare all tiers
              </Link>
            </div>
          </article>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/plans" className="nous-btn-outline !border-white/40 !text-white">
              See all plans
            </Link>
            <Link href="/minerva" className="nous-btn-outline !border-white/40 !text-white">
              Go to your agency
            </Link>
          </div>
        )}

        <p className="mt-8 max-w-[80ch] text-[13px] leading-relaxed text-white/60">
          Credits are USD-denominated inference at catalog price; paid tiers grant monthly credits on
          invoice paid and the router debits per call. Prices exclude VAT — billed monthly — cancel any
          time.
        </p>
      </section>
      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
}
