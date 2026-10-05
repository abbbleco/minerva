import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-8 text-[11px] tracking-wide text-white/40 uppercase md:px-10">
      <p>
        The internet&apos;s own AI
        <br />© 2026, ABBBLE CO
      </p>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="flex h-8 w-8 items-center justify-center rounded border border-white/15">◈</span>
        <span className="flex h-8 w-8 items-center justify-center rounded border border-white/15">⬡</span>
        <span className="flex h-8 w-8 items-center justify-center rounded border border-white/15">✎</span>
      </div>
      <p>
        <Link href="/terms" className="underline underline-offset-2 hover:text-white">
          Terms
        </Link>{" "}
        |{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
          Privacy
        </Link>
        <br />
        MIT License · 2026
      </p>
    </footer>
  );
}
