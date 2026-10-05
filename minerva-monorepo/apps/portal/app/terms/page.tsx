import type { Metadata } from "next";
import Topbar from "../components/topbar";
import Footer from "../components/footer";

export const metadata: Metadata = { title: "Terms | ABBBLE Portal" };

export default function TermsPage() {
  return (
    <div>
      <Topbar section="Terms" />
      <section className="max-w-3xl px-6 py-10 md:px-10">
        <h1 className="nous-display text-[44px]">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-[13px] leading-relaxed text-white/65">
          <p>ABBBLE Portal provides metered access to models, hosted tools, and agent cloud hosting. Paid tiers grant monthly credits on invoice paid; the router debits per call at catalog price.</p>
          <p>API keys are per-agency secrets. Mint one key per machine, store it in the OS keychain, never in a repo. Revoke a lost key immediately — that machine stops authenticating at once.</p>
          <p>Free tier is monthly quotas and free models only. Subscriptions bill monthly and can be cancelled any time; cancellation returns the workspace to the free tier without touching data.</p>
          <p>Contact hello@abbble.co.za for custom terms.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
