"use client";

import Link from "next/link";
import { useState } from "react";

import AccountButton from "./account-button";

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
        <AccountButton variant="folded-signup" />
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
        <AccountButton variant="folded-login" />
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

      <AccountButton variant="sidebar" />

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

      <AccountButton variant="loginlink" />
    </aside>
  );
}
