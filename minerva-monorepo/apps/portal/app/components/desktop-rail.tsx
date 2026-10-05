import Link from "next/link";

/**
 * Collapsed "Minerva Desktop App" side rail from overview.png: a narrow fixed strip on
 * the viewport's right edge (artwork + vertical label). Teaser for the expanded
 * Install Minerva panel at /download (sidepanel_download_minerva.png).
 */
export default function DesktopRail() {
  return (
    <Link
      href="/download"
      aria-label="Download Minerva Desktop"
      className="group fixed top-0 right-0 z-40 hidden h-screen w-12 flex-col items-center overflow-hidden border-l border-white/10 bg-[#0a0a2b] xl:flex"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/placeholders/img_7895.jpg"
        alt=""
        aria-hidden="true"
        className="nous-duo absolute inset-0 h-full w-full object-cover opacity-30 transition group-hover:opacity-50"
        draggable={false}
      />
      <span className="absolute inset-0 bg-[#0a0a2b]/55 transition group-hover:bg-[#0a0a2b]/35" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="relative mt-6 flex h-7 w-7 items-center justify-center rounded-full border border-white/25 font-mono text-[12px] text-white/60 transition group-hover:border-white group-hover:text-white"
      >
        →
      </span>
      <span
        aria-hidden="true"
        className="nous-vertical relative mt-4 font-mono text-[10px] font-bold tracking-[3px] text-white/50 uppercase transition group-hover:text-white"
      >
        A Minerva Desktop App
      </span>
    </Link>
  );
}
