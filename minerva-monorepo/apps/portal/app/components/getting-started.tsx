import Link from "next/link";

/**
 * Getting Started — three product-screenshot mocks with outline CTAs.
 * Pure CSS/Tiny-type mocks (no screenshot assets): API = portal sidebar + invoice,
 * TUI = terminal with ASCII header, GUI = desktop app window. Photographic
 * placeholders back the section artwork and the desktop avatar.
 */

const COLS = [
  { k: "API", title: "ABBBLE Account", img: "/placeholders/images.jpg", cta: "Power your Minerva", href: "/signup" },
  { k: "TUI", title: "Terminal Velocity", img: "/placeholders/img_7895.jpg", cta: "Install via terminal", href: "/minerva" },
  { k: "GUI", title: "Minerva Desktop", img: "/placeholders/Minerva.jpg", cta: "Download app", href: "/download" },
];

export default function GettingStarted() {
  return (
    <section className="relative mt-12 overflow-hidden px-6 py-12 md:px-10">
      {/* Faint background artwork */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/placeholders/Minerva.jpg"
        alt=""
        aria-hidden="true"
        className="nous-duo pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15"
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-0 bg-[#0a0a2b]/70" aria-hidden="true" />
      <div className="relative">
        <h2 className="nous-display text-[38px] md:text-[48px]">Getting Started</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-mono text-[11px] tracking-[2px] text-white/40 uppercase">{c.k}</p>
              <h3 className="nous-display mt-1 text-[30px] text-white">{c.title}</h3>
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[2px] border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={`${c.title} preview`}
                  className="nous-duo h-full w-full object-cover"
                  draggable={false}
                />
                <span className="pointer-events-none absolute inset-0 bg-[#1f22ff]/15" aria-hidden="true" />
              </div>
              <Link href={c.href} className="nous-btn-outline mt-4 w-full">
                {c.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
