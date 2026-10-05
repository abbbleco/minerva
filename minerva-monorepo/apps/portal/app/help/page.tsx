import type { Metadata } from "next";
import Topbar from "../components/topbar";
import Footer from "../components/footer";

export const metadata: Metadata = { title: "Help | ABBBLE Portal" };

const FAQS: Array<[string, string]> = [
  ["Minerva says 401 invalid_key — what now?", "The key was revoked or pasted wrong. Go to /minerva, mint a fresh desktop key, and paste it into Minerva once. One key per machine."],
  ["Minerva says 402 billing_required — what now?", "Your subscription lapsed. Update billing on the Plans page, then retry. Free-tier keys can still use free models with model omitted."],
  ["Minerva says 402 upgrade_required — what now?", "A free key hit a paid model. Omit model for the free router, or upgrade for the full catalog — the response lists allowed models."],
  ["Minerva says 402 credits_exhausted — what now?", "You are out of credits. Top up or wait for the monthly grant; check usage on /minerva. Free models never trip this."],
  ["Where is the Minerva dashboard?", "Run `minerva dashboard` locally (port 9119), or open the dashboard URL from /minerva. The portal links out to it — it never proxies it."],
  ["Log in with Discord or a wallet?", "Email + Google/GitHub cover most members. For Discord or wallet sign-in, contact support and we will link the identity to your agency."],
];

export default function HelpPage() {
  return (
    <div>
      <Topbar section="Help" />
      <section className="max-w-3xl px-6 py-10 md:px-10">
        <h1 className="nous-display text-[44px]">Help</h1>
        <div className="mt-6 space-y-4">
          {FAQS.map(([q, a]) => (
            <article key={q} className="nous-card-flat p-5">
              <h2 className="text-[14px] font-semibold text-white">{q}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-white/60">{a}</p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
