"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";

export default function AuthCard({
  mode,
  authError,
  next,
}: {
  mode: "login" | "signup";
  authError?: string;
  /** Where to land after sign-in. Defaults to the console. */
  next?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyProvider, setBusyProvider] = useState<"google" | "github" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(authError ?? null);

  function callbackUrl() {
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/minerva";
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`;
  }

  async function continueWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) throw error;
      setMessage("Check your inbox — we sent you a sign-in link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "github") {
    setBusy(true);
    setBusyProvider(provider);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl(),
          ...(provider === "google"
            ? {
                scopes: "openid email profile",
                queryParams: { access_type: "offline", prompt: "consent" },
              }
            : {
                scopes: "read:user user:email",
              }),
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
      setBusyProvider(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[560px] bg-[#12123c] px-10 py-12 md:px-14">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/placeholders/Minerva.jpg" alt="" className="h-11 w-11 rounded object-cover" draggable={false} />
          <p className="nous-display text-[34px] leading-[0.9]">
            ABBBLE
            <br />
            Portal
          </p>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-white/15" />
          <p className="font-mono text-[12px] tracking-[2px] text-white/60 uppercase">Sign in</p>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <form onSubmit={continueWithEmail} className="mt-6">
          <label htmlFor="nous-email" className="text-[13px] font-medium text-white/80">
            Email
          </label>
          <input
            id="nous-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="nous-input mt-2"
          />
          <button type="submit" disabled={busy} className="nous-btn mt-6 w-full !py-3.5">
            {busy ? "Sending…" : mode === "signup" ? "Continue with email" : "Continue with email"}
          </button>
        </form>

        {message && <p className="mt-4 text-[13px] text-emerald-300">{message}</p>}
        {error && <p className="mt-4 text-[13px] text-rose-300">{error}</p>}

        <div className="mt-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-white/15" />
          <p className="font-mono text-[12px] text-white/60">OR</p>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => oauth("google")} disabled={busy} className="nous-btn-outline w-full">
            <span aria-hidden="true">G</span> {busyProvider === "google" ? "Connecting…" : "Google"}
          </button>
          <button type="button" onClick={() => oauth("github")} disabled={busy} className="nous-btn-outline w-full">
            <span aria-hidden="true">◉</span> {busyProvider === "github" ? "Connecting…" : "GitHub"}
          </button>
        </div>

        <p className="mt-6 text-center text-[13px] text-white/70">
          <Link href="/help" className="underline underline-offset-2">
            Don&apos;t have an email? Log in with Discord or a wallet
          </Link>
        </p>
        <p className="mt-4 text-center text-[13px] text-white/70">
          By logging in I agree to the{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          &{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex items-center justify-center gap-8 font-mono text-[11px] tracking-widest text-white/60 uppercase">
        <Link href="/terms" className="underline underline-offset-2">
          Terms of Service
        </Link>
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        <Link href="/help" className="underline underline-offset-2">
          About
        </Link>
      </div>
    </main>
  );
}
