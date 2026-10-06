import type { Metadata } from "next";
import Link from "next/link";
import Topbar from "../components/topbar";
import Footer from "../components/footer";
import { PORTAL_PLANS } from "../lib/plans";
import AgencyCard from "./agency-card";
import PlansGrid from "./plans-grid";

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
        <PlansGrid plans={PORTAL_PLANS} />
        <AgencyCard />
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
