"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseBrowser } from "../lib/supabase-browser";
import { displayNameForSession, type SessionUser } from "../lib/account-display";

interface SessionState {
  user: SessionUser | null;
}

async function readSession(signal: AbortSignal): Promise<SessionState> {
  const res = await fetch("/api/portal/session", { cache: "no-store", signal });
  if (!res.ok) return { user: null };
  const json = (await res.json()) as SessionState;
  return { user: json.user ?? null };
}

/**
 * Auth-aware account slot. Signed out it renders the same links as before;
 * signed in the account name renders as an unclickable welcome plus sign-out.
 * Variants mirror the three existing placements (sidebar button, folded icon,
 * mobile nav link) so no layout changes leak in.
 */
export default function AccountButton({ variant }: { variant: "sidebar" | "folded-signup" | "folded-login" | "nav" | "loginlink" }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    readSession(controller.signal)
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
    return () => controller.abort();
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await getSupabaseBrowser().auth.signOut();
    } catch {
      // Local session already gone or unreachable — reload anyway so every
      // slot re-resolves from the server instead of showing a stale name.
    }
    router.refresh();
    window.location.reload();
  }

  if (!loaded) {
    if (variant === "nav") return <span className="ml-auto text-white/40">…</span>;
    if (variant === "folded-signup") return <span className="mt-4 h-10 w-10" aria-hidden="true" />;
    if (variant === "folded-login") return null;
    if (variant === "loginlink") {
      return <span className="mt-6 block border-t border-white/10 pt-5" aria-hidden="true" />;
    }
    return (
      <span className="mt-6 block rounded-[3px] bg-white/10 px-4 py-3 text-[12px] font-bold tracking-wide text-white/40 uppercase">
        …
      </span>
    );
  }

  const name = displayNameForSession(user);
  if (variant === "loginlink") {
    if (!name) {
      return (
        <Link
          href="/login"
          className="nous-navlink mt-6 border-t border-white/10 pt-5 !text-white"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded border border-white/20 text-[12px]" aria-hidden="true">
            ◉
          </span>
          Member Sign In
        </Link>
      );
    }
    // Signed in: the sidebar welcome box owns identity + sign-out; the
    // login link hides instead of pointing at itself.
    return null;
  }

  if (!name) {
    if (variant === "nav") {
      return (
        <Link href="/login" className="ml-auto text-white">
          Sign in
        </Link>
      );
    }
    if (variant === "folded-signup") {
      return (
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
      );
    }
    if (variant === "folded-login") {
      return (
        <Link
          href="/login"
          aria-label="Member Sign In"
          title="Member Sign In"
          className="flex h-9 w-9 items-center justify-center rounded border border-white/20 text-[12px] text-white transition hover:border-white"
        >
          <span aria-hidden="true">◉</span>
        </Link>
      );
    }
    return (
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
    );
  }

  if (variant === "nav") {
    return (
      <span className="ml-auto flex items-center gap-3">
        <span className="text-white/80">Welcome, {name}</span>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          className="text-white/60 underline disabled:opacity-50"
        >
          Sign out
        </button>
      </span>
    );
  }

  if (variant === "folded-signup") {
    return (
      <span
        aria-label={`Welcome, ${name}`}
        title={`Welcome, ${name}`}
        className="mt-4 flex h-10 w-10 items-center justify-center rounded-[3px] bg-white/10 font-mono text-[14px] text-white"
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  if (variant === "folded-login") {
    return null;
  }

  return (
    <div className="mt-6 rounded-[3px] border border-white/15 px-4 py-3">
      <p className="text-[12px] font-bold tracking-wide text-white uppercase">
        Welcome, {name}
      </p>
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={signingOut}
        className="mt-1 text-[12px] text-white/60 underline disabled:opacity-50"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
