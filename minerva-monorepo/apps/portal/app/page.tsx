import type { Metadata } from "next";
import Link from "next/link";
import Topbar from "./components/topbar";
import Footer from "./components/footer";
import DesktopRail from "./components/desktop-rail";
import GettingStarted from "./components/getting-started";
import ModelsTable from "./components/models-table";
import { PORTAL_PLANS } from "./lib/plans";

export const metadata: Metadata = { title: "Overview | ABBBLE Portal" };

function Duo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`nous-duo h-full w-full object-cover ${className}`} draggable={false} />;
}

export default function OverviewPage() {
  return (
    <div className="xl:pr-12">
      <DesktopRail />
      <Topbar section="Overview" />

      {/* ── Hero ── */}
      <section className="px-6 pt-12 pb-10 md:px-10">
        <h1 className="nous-display max-w-[12ch] text-[52px] md:text-[76px]">
          Everything to Power Minerva Agent
        </h1>
        <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-white/70">
          Minerva remembers you, works while you sleep, and lives in the apps you already use.
          ABBBLE Portal is the one account that fuels all of it: the models, the tools, the cloud.
          Sign in once and never think about it again.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link href="/signup" className="nous-btn">
            Create Account
          </Link>
          <Link href="/download" className="nous-btn-ghost">
            Download Minerva
          </Link>
        </div>
      </section>

      {/* ── Why ABBBLE Portal? ── */}
      <section className="px-6 md:px-10">
        <h2 className="nous-display text-[34px] md:text-[44px]">Why ABBBLE Portal?</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] text-white/40">01</p>
            <h3 className="mt-1 text-[15px] font-semibold">One Account, Everywhere</h3>
            <p className="mt-2 max-w-[44ch] text-[13px] leading-relaxed text-white/60">
              A single sign-in connects Minerva to the model catalog, the Tool Gateway, and cloud
              hosting. Setup takes one command in terminal or one click in Minerva Desktop.
            </p>
            <div className="nous-card mt-4 aspect-[16/9]">
              <Duo src="/placeholders/images.jpg" alt="Statue face" />
            </div>
          </div>
          <div className="md:pt-14">
            <div className="nous-card aspect-[16/7]">
              <Duo src="/placeholders/img_7895.jpg" alt="Hands around light" />
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-white/60">
              <span className="font-semibold text-white">Access Hundreds of Models.</span>
              <br />
              The catalog spans hundreds of models from every frontier lab, with free options and
              Portal-only discounts. You can switch models with one command.
            </p>
          </div>
          <div>
            <p className="text-[13px] leading-relaxed text-white/60">
              <span className="font-semibold text-white">All Tools Included.</span>
              <br />
              Hosted tools come bundled with your subscription and work the moment you sign in.
              Each bills to the same credits as your models.
            </p>
            <div className="nous-card mt-4 aspect-[16/9]">
              <Duo src="/placeholders/Minerva.jpg" alt="Wall of screens" />
            </div>
          </div>
          <div className="md:pt-14">
            <div className="nous-card aspect-[16/9]">
              <Duo src="/placeholders/images.jpg" alt="Figure in light" />
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-white/60">
              <span className="font-semibold text-white">Agent Cloud Hosting.</span>
              <br />
              Deploy in one click and Portal hosts your agent in the cloud, running around the
              clock. Server costs bill straight to your credit balance.
            </p>
          </div>
        </div>
      </section>

      <GettingStarted />

      {/* ── What's Included? ── */}
      <section className="px-6 py-12 md:px-10">
        <h2 className="nous-display text-[34px] md:text-[44px]">What&apos;s Included?</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
          <div>
            <p className="font-mono text-[11px] text-white/40">01</p>
            <h3 className="mt-1 text-[15px] font-semibold">Models</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">
              The catalog lists hundreds of models from every frontier lab so you can find the
              perfect fit for your work. Match the model to the task, from free options to frontier
              flagships.
            </p>
          </div>
          <ModelsTable />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_240px]">
          <div className="nous-card aspect-[16/7]">
            <Duo src="/placeholders/Minerva.jpg" alt="Tools collage" />
          </div>
          <div>
            <p className="font-mono text-[11px] text-white/40">02</p>
            <h3 className="mt-1 text-[15px] font-semibold">Tools</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">
              The Tool Gateway covers web search, scraping, image generation, browser navigation,
              and speech, each priced per use. Each tool is ready the moment you sign in and bills
              to the same credit balance as your models.
            </p>
          </div>
        </div>
      </section>

      {/* ── Subscription ── */}
      <section className="px-6 pb-12 md:px-10">
        <h2 className="nous-display text-[34px] md:text-[44px]">Subscription</h2>
        <p className="mt-3 max-w-[70ch] text-[13px] leading-relaxed text-white/60">
          Every paid tier includes monthly credits, hundreds of models, hosted tool usage, and high
          rate limits.
        </p>
        <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-white/60">
          Use your ChatGPT plan. Connect an eligible ChatGPT account for supported inference. No
          paid ABBBLE subscription is required. Tools and Minerva Cloud hosting are charged separately.{" "}
          <Link href="/help" className="underline">
            Learn More
          </Link>
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PORTAL_PLANS.map((p) => (
            <article
              key={p.id}
              className={p.highlight ? "rounded-[4px] bg-[#1f22ff] p-5" : "nous-card-flat p-5"}
            >
              <div className="flex items-center justify-between">
                <span className="nous-chip !border-white/30 !text-white uppercase">{p.id}</span>
                {p.bonus && (
                  <span className="rounded-[2px] border border-white/50 px-2 py-0.5 font-mono text-[10px] text-white">
                    {p.bonus} Bonus
                  </span>
                )}
              </div>
              <p className="nous-display mt-3 text-[44px]">${p.price}</p>
              <p className="text-[11px] tracking-widest text-white/60 uppercase">Per month</p>
              <div className="mt-3 h-[110px] overflow-hidden rounded-[2px]">
                <Duo src={p.image} alt={`${p.id} tier art`} />
              </div>
              <ul className="mt-4 space-y-1.5 text-[12px] text-white/75">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Link
                href="/plans"
                className={p.highlight ? "nous-btn-outline mt-5 w-full !border-white/60 !text-white" : "nous-btn-outline mt-5 w-full"}
              >
                {p.cta}
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="font-mono text-[11px] tracking-widest text-white/50 uppercase">
            Top up · $10 · $25 · $50 · $100 · $200
          </p>
          <Link href="/plans" className="nous-btn !py-2.5">
            Pay with Card
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
