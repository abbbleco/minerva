import type { Metadata } from "next";
import Topbar from "../components/topbar";
import Footer from "../components/footer";

export const metadata: Metadata = { title: "API Docs | ABBBLE Portal" };

export default function ApiDocsPage() {
  return (
    <div>
      <Topbar section="API Docs" />
      <section className="max-w-3xl px-6 py-10 md:px-10">
        <h1 className="nous-display text-[44px]">API Docs</h1>
        <p className="mt-4 text-[14px] leading-relaxed text-white/70">
          Minerva talks to the Minerva router — an OpenAI-compatible credits gateway. Authenticate
          every call with a per-agency <code className="font-mono text-[12px] text-white">qkt_sec_*</code>{" "}
          Bearer key minted under <a href="/minerva" className="underline">Minerva</a>.
        </p>
        <div className="nous-card-flat mt-6 space-y-3 p-5 font-mono text-[12px]">
          <p><span className="text-emerald-300">GET</span> /v1/models — tier-filtered catalog</p>
          <p><span className="text-emerald-300">POST</span> /v1/chat/completions — OpenAI shape, omit model for the free router</p>
          <p><span className="text-emerald-300">POST</span> /v1/embeddings — untiered single model</p>
          <p><span className="text-emerald-300">GET</span> /v1/credits — balance, used, plan</p>
          <p><span className="text-emerald-300">GET</span> /health — 200 ok / 503 degraded</p>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-white/60">
          Model IDs are <code className="font-mono text-[12px]">minerva/&lt;upstream-with-/-as---&gt;</code>.
          Send <code className="font-mono text-[12px]">x-minerva-request-id</code> to make retries
          idempotent. Errors map to portal action: 401 mint a fresh key, 402 billing/upgrade/credits,
          429 back off and retry, 502 retry later.
        </p>
      </section>
      <Footer />
    </div>
  );
}
