import type { Metadata } from "next";
import Link from "next/link";
import Topbar from "../components/topbar";

export const metadata: Metadata = { title: "Download Minerva | ABBBLE Portal" };

export default function DownloadPage() {
  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_420px]">
      <div>
        <Topbar section="Overview" />
        <section className="px-6 pt-12 md:px-10">
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
          <h2 className="nous-display mt-16 text-[34px] md:text-[44px]">Why ABBBLE Portal?</h2>
          <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-white/60">
            Install Minerva Desktop, sign in once with your Portal account, and every model call bills
            through your agency. Prefer terminal?{" "}
            <Link href="/minerva" className="underline">
              Connect via the router
            </Link>{" "}
            with one command.
          </p>
        </section>
      </div>

      {/* ── Slide-over panel (sidepanel_download_minerva.png) ── */}
      <aside className="relative overflow-hidden border-l border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/placeholders/img_7895.jpg"
          alt=""
          aria-hidden="true"
          className="nous-duo absolute inset-0 h-full w-full object-cover opacity-40"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[#0a0a2b]/60" aria-hidden="true" />
        <div className="relative flex h-full flex-col px-8 py-6">
          <p className="font-mono text-[11px] tracking-[2px] text-white/70 uppercase">
            <Link
              href="/"
              aria-label="Fold panel back to overview"
              title="Fold back"
              className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-white/60 transition hover:border-white hover:text-white"
            >
              →
            </Link>{" "}
            <span className="text-white/30">//</span> Download
          </p>
          <h2 className="nous-display mt-10 text-[64px] leading-[0.95]">
            Install
            <br />
            Minerva
          </h2>
          <p className="mt-6 max-w-[32ch] text-[14px] leading-relaxed text-white/80">
            An autonomous agent that lives on your server, remembers what it learns, and gets more
            capable the longer it runs.
          </p>
          <div className="mt-8">
            <Link
              href="/minerva"
              className="inline-flex items-center rounded-[3px] bg-white px-6 py-3.5 text-[12px] font-bold tracking-wide text-[#1f22ff] uppercase"
            >
              Download Minerva
            </Link>
          </div>
          <div className="mt-auto space-y-2 pt-10 font-mono text-[11px] text-white/60">
            <p>macOS · Windows · Linux</p>
            <p>
              Then: <Link href="/minerva" className="underline">mint a desktop key</Link> and paste it
              into Minerva once.
            </p>
            <p>
              Dashboard: <span className="text-white">minerva dashboard</span> → port 9119
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
