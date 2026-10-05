"use client";

import Link from "next/link";
import { useState } from "react";

const EXPLORE = [
  { href: "/", label: "Overview", icon: "▦" },
  { href: "/models", label: "Models", icon: "♣" },
  { href: "/plans", label: "Plans", icon: "$" },
];

const RESOURCES = [
  { href: "/minerva", label: "Minerva Cloud", icon: "⚙" },
  { href: "/download", label: "Minerva Agent", icon: "⬡" },
  { href: "/api-docs", label: "API Docs", icon: "▤" },
  { href: "/help", label: "Help", icon: "?" },
  { href: "/terms", label: "Terms", icon: "⛉" },
  { href: "/privacy", label: "Privacy", icon: "♡" },
];

export default function Sidebar() {
  const [folded, setFolded] = useState(false);

  if (folded) {
    return (
      <aside className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col items-center border-r border-white/10 py-4 md:flex">
        <button
          type="button"
          onClick={() => setFolded(false)}
          aria-label="Expand sidebar"
          title="Expand"
          className="font-mono text-[13px] text-white/50 transition hover:text-white"
        >
          →|
        </button>
        <Link href="/" aria-label="ABBBLE Portal home" className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/placeholders/Minerva.jpg"
            alt=""
            className="h-10 w-10 rounded-md object-cover"
            draggable={false}
          />
        </Link>
        <Link
          href="/signup"
          aria-label="Create ABBBLE Account"
          title="Create ABBBLE Account"
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-[3px] bg-white text-[#0a0a2b]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M2.5 13.5c.8-2.8 2.9-4.2 5.5-4.2s4.7 1.4 5.5 4.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>
        <span className="my-4 h-px w-8 bg-white/10" aria-hidden="true" />
        <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Primary">
          {[...EXPLORE, ...RESOURCES].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-label={n.label}
              title={n.label}
              className="flex h-9 w-9 items-center justify-center rounded-[3px] text-[14px] text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <span aria-hidden="true">{n.icon}</span>
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          aria-label="Member Sign In"
          title="Member Sign In"
          className="flex h-9 w-9 items-center justify-center rounded border border-white/20 text-[12px] text-white transition hover:border-white"
        >
          <span aria-hidden="true">◉</span>
        </Link>
      </aside>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-white/10 px-5 py-6 md:flex">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setFolded(true)}
          aria-label="Fold sidebar"
          title="Fold"
          className="font-mono text-[13px] text-white/50 transition hover:text-white"
        >
          ←|
        </button>
      </div>
      <Link href="/" className="mt-2 flex items-center gap-3" aria-label="ABBBLE Portal home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/placeholders/Minerva.jpg"
          alt=""
          className="h-14 w-14 rounded-md object-cover"
          draggable={false}
        />
        <span className="nous-display text-[34px] leading-[0.9]">
          ABBBLE
          <br />
          Portal
        </span>
      </Link>

      <Link
        href="/signup"
        className="mt-6 flex items-center justify-between rounded-[3px] bg-white px-4 py-3 text-[12px] font-bold tracking-wide text-[#0a0a2b] uppercase"
      >
        Create ABBBLE Account
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M2.5 13.5c.8-2.8 2.9-4.2 5.5-4.2s4.7 1.4 5.5 4.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </Link>

      <p className="nous-eyebrow mt-8 mb-2 px-1">Explore</p>
      <nav className="space-y-0.5" aria-label="Explore">
        {EXPLORE.map((n) => (
          <Link key={n.href} href={n.href} className="nous-navlink">
            <span className="w-4 text-center" aria-hidden="true">
              {n.icon}
            </span>
            {n.label}
          </Link>
        ))}
      </nav>

      <p className="nous-eyebrow mt-8 mb-2 px-1">Resources</p>
      <nav className="flex-1 space-y-0.5" aria-label="Resources">
        {RESOURCES.map((n) => (
          <Link key={n.href} href={n.href} className="nous-navlink">
            <span className="w-4 text-center" aria-hidden="true">
              {n.icon}
            </span>
            {n.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/login"
        className="nous-navlink mt-6 border-t border-white/10 pt-5 !text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded border border-white/20 text-[12px]" aria-hidden="true">
          ◉
        </span>
        Member Sign In
      </Link>
    </aside>
  );
}
