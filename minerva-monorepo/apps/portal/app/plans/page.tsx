import type { Metadata } from "next";
import Link from "next/link";
import Topbar from "../components/topbar";
import Footer from "../components/footer";
import { PORTAL_PLANS } from "../lib/plans";

export const metadata: Metadata = { title: "Plans | ABBBLE Portal" };

export default function PlansPage() {
  return (
    <div>
      <Topbar section="Manage Subscription" />
      <section className="px-6 pt-10 md:px-10">
        <p className="max-w-[80ch] text-[17px] font-semibold leading-relaxed">
          All paid tiers include monthly credits for use in Minerva Agent, access to 200+ cutting-edge
          models and built-in tool use.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PORTAL_PLANS.map((p) => (
            <article
              key={p.id}
              className={p.highlight ? "rounded-[4px] bg-[#1f22ff] p-5" : "nous-card-flat p-5"}
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
              <Link
                href="/signup"
                className="nous-btn-outline mt-6 w-full !border-white/40 !text-white"
              >
                Subscribe
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-[80ch] text-[13px] leading-relaxed text-white/60">
          Credits are USD-denominated inference at catalog price; paid tiers grant monthly credits on
          invoice paid and the router debits per call. Prices exclude VAT · billed monthly ·
          cancel any time. Prefer the operator view?{" "}
          <Link href="/minerva" className="underline">
            Connect Minerva
          </Link>
          .
        </p>
      </section>
      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
}
