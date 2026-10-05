import type { Metadata } from "next";
import Topbar from "../components/topbar";
import Footer from "../components/footer";

export const metadata: Metadata = { title: "Privacy | ABBBLE Portal" };

export default function PrivacyPage() {
  return (
    <div>
      <Topbar section="Privacy" />
      <section className="max-w-3xl px-6 py-10 md:px-10">
        <h1 className="nous-display text-[44px]">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-[13px] leading-relaxed text-white/65">
          <p>Identity lives in Supabase (email + OAuth). The portal holds the anon key in the browser and never exposes the service_role key.</p>
          <p>Usage metering records model, tokens, and cost per call for billing — the same ledger the router debits. No prompt content is stored for billing.</p>
          <p>Minerva Desktop runs on your machine; the portal only mints its key and shows its router address. The local dashboard (port 9119) stays local unless you expose it.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
