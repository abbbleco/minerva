"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface SessionInfo {
  user: { id: string; email?: string } | null;
  agency: { id: string; name: string; slug: string; plan: string; status: string } | null;
  billing: { state: string; plan: string; balance: number; used: number } | null;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="nous-btn-outline !py-1.5 !text-[11px]"
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export default function MinervaConnect({ routerBase, dashboard }: { routerBase: string; dashboard: string }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [keyName, setKeyName] = useState("minerva-desktop");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portal/session", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as SessionInfo;
        if (!cancelled) setSession(json);
      } catch {
        // Logged-out view stays.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const configSnippet = useMemo(
    () =>
      [
        `base_url: ${routerBase}/v1`,
        `api_key: ${token ?? "<paste-your-qkt_sec_-key-here>"}`,
        `# omit model for the free router, or pick an id from ${routerBase}/v1/models`,
        `# model: minerva/<upstream-with-slashes-as-dashes>`,
      ].join("\n"),
    [routerBase, token]
  );

  const curlTest = useMemo(
    () => [`curl -s ${routerBase}/v1/models \\`, `  -H "Authorization: Bearer ${token ?? "<your-key>"}" | head -c 400`].join("\n"),
    [routerBase, token]
  );

  async function mintKey(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() || "hermes-desktop", purpose: "server" }),
      });
      const json = (await res.json()) as { api_key?: string; error?: string };
      if (!res.ok || !json.api_key) {
        setError(json.error ?? "key creation failed");
        return;
      }
      setToken(json.api_key);
      setCredits(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function checkCredits() {
    if (!token) return;
    setCredits("checking…");
    try {
      const res = await fetch(`${routerBase}/v1/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const code = (json as { code?: string } | null)?.code ?? `http ${res.status}`;
        setCredits(`router refused: ${code} — see “When Minerva says no” below`);
        return;
      }
      const c = json as { balance?: number; used?: number; plan?: string };
      setCredits(`balance $${Number(c.balance ?? 0).toFixed(2)} · used $${Number(c.used ?? 0).toFixed(2)} · plan ${c.plan ?? "?"}`);
    } catch (err) {
      setCredits(`unreachable: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const billingState = session?.billing?.state ?? null;

  return (
    <div className="px-6 py-10 md:px-10">
      <h1 className="nous-display text-[44px] md:text-[56px]">Connect Minerva</h1>
      <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-white/65">
        Minerva runs on your machine and bills through your agency. Mint a desktop key below, paste
        it into Minerva once, and every call is authenticated as you and gated on your subscription.
      </p>

      {!session?.user && (
        <p className="nous-card-flat mt-5 max-w-[68ch] p-4 text-[13px] text-white/70">
          You are signed out — the router address and setup below still apply, but key minting needs
          an account. <Link href="/signup" className="underline">Create one</Link> or{" "}
          <Link href="/login" className="underline">sign in</Link>.
        </p>
      )}
      {session?.agency && (
        <p className="mt-5 font-mono text-[11px] tracking-widest text-white/50 uppercase">
          {session.agency.name} · {session.agency.slug} · plan {session.billing?.plan ?? session.agency.plan} ·{" "}
          {session.billing ? `$${session.billing.balance.toFixed(2)} credits left` : session.agency.status}
        </p>
      )}
      {billingState && billingState !== "active" && (
        <p className="nous-card-flat mt-4 max-w-[68ch] border-yellow-400/30 p-4 text-[13px] text-yellow-200">
          Subscription is <span className="font-semibold">{billingState}</span>. Minerva still connects,
          but paid models return <code className="font-mono text-[12px]">402 billing_required</code>{" "}
          until you <Link href="/plans" className="underline">update billing</Link>.
        </p>
      )}

      {/* 1 · Router */}
      <section className="nous-card-flat mt-6 max-w-[820px] space-y-2 p-5">
        <h2 className="text-[14px] font-semibold text-white">1 · Router address</h2>
        <p className="text-[13px] text-white/60">
          Minerva talks to this OpenAI-compatible endpoint. It never holds upstream credentials — the
          router does.
        </p>
        <div className="flex items-center justify-between gap-3">
          <code className="break-all font-mono text-[13px] text-white">{routerBase}/v1</code>
          <CopyButton text={`${routerBase}/v1`} label="Copy router base URL" />
        </div>
      </section>

      {/* 2 · Key */}
      <section className="nous-card-flat mt-4 max-w-[820px] space-y-3 p-5">
        <h2 className="text-[14px] font-semibold text-white">2 · Mint a desktop key</h2>
        {token ? (
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-white">Store it now — shown once</p>
            <div className="flex items-center justify-between gap-3">
              <code className="block break-all rounded bg-black/50 px-2 py-1.5 font-mono text-[12px] text-white">
                {token}
              </code>
              <CopyButton text={token} label="Copy API key" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={checkCredits} className="nous-btn-outline !py-1.5 !text-[11px]">
                Check credits
              </button>
              {credits && <span className="font-mono text-[11px] text-white/60">{credits}</span>}
              <button
                type="button"
                onClick={() => setToken(null)}
                className="text-[12px] text-white/60 underline underline-offset-2 hover:text-white"
              >
                Done — I stored it
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={mintKey} className="flex flex-wrap items-end gap-2 text-[12px]">
            <label className="flex flex-col gap-1 text-white/60">
              Key name
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                maxLength={80}
                placeholder="hermes-desktop"
                className="nous-input !w-56 !border !border-white/15"
              />
            </label>
            <button type="submit" disabled={busy} className="nous-btn !py-2.5 disabled:opacity-50">
              {busy ? "Minting…" : "Mint desktop key"}
            </button>
            {error && <span className="text-rose-300">{error}</span>}
          </form>
        )}
        <p className="text-[12px] text-white/40">
          One key per machine. Revoke a lost key and Minerva on that machine stops authenticating
          immediately. Server keys only — Minerva calls the router directly with a Bearer token.
        </p>
      </section>

      {/* 3 · Minerva config */}
      <section className="nous-card-flat mt-4 max-w-[820px] space-y-3 p-5">
        <h2 className="text-[14px] font-semibold text-white">3 · Paste into Minerva</h2>
        <div className="flex items-start justify-between gap-3">
          <pre className="flex-1 overflow-x-auto rounded bg-black/50 px-3 py-2 font-mono text-[12px] whitespace-pre-wrap break-all text-white/80">
            {configSnippet}
          </pre>
          <CopyButton text={configSnippet} label="Copy Minerva config snippet" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <pre className="flex-1 overflow-x-auto rounded bg-black/50 px-3 py-2 font-mono text-[12px] whitespace-pre-wrap break-all text-white/80">
            {curlTest}
          </pre>
          <CopyButton text={curlTest} label="Copy connection test" />
        </div>
        <p className="text-[12px] text-white/40">
          Minerva provider config: <code className="font-mono">base_url</code> above + your{" "}
          <code className="font-mono">qkt_sec_*</code> key. Omit{" "}
          <code className="font-mono">model</code> for the free router, or pick an id from{" "}
          <code className="font-mono">/v1/models</code> with your key.
        </p>
      </section>

      {/* 4 · Dashboard */}
      <section className="nous-card-flat mt-4 max-w-[820px] space-y-2 p-5">
        <h2 className="text-[14px] font-semibold text-white">4 · Open the Minerva dashboard</h2>
        <p className="text-[13px] leading-relaxed text-white/60">
          The dashboard is the local Minerva web UI (<code className="font-mono">minerva dashboard</code>,
          port 9119): sessions, memory, cron, gateway, and the embedded chat. The portal links out to
          it — it never proxies it, so your session token stays local.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="break-all font-mono text-[13px] text-white">{dashboard}</code>
          <CopyButton text={dashboard} label="Copy dashboard URL" />
          <a href={dashboard} target="_blank" rel="noreferrer" className="nous-btn !py-2.5">
            Open dashboard
          </a>
        </div>
        <p className="font-mono text-[11px] text-white/40">
          Start it: `minerva dashboard` · Stop: `minerva dashboard --stop` · Status: `minerva dashboard --status`
        </p>
      </section>

      {/* 5 · Errors */}
      <section className="nous-card-flat mt-4 max-w-[820px] space-y-2 p-5">
        <h2 className="text-[14px] font-semibold text-white">5 · When Minerva says no</h2>
        <ul className="space-y-1.5 text-[13px] text-white/70">
          <li><code className="font-mono text-[12px] text-white">401 invalid_key</code> — key revoked or pasted wrong. Mint a fresh one above.</li>
          <li><code className="font-mono text-[12px] text-white">402 billing_required</code> — subscription lapsed. <Link href="/plans" className="underline">Update billing</Link>.</li>
          <li><code className="font-mono text-[12px] text-white">402 upgrade_required</code> — free plan hit a paid model. Omit <code className="font-mono text-[12px]">model</code> or upgrade; the response lists allowed models.</li>
          <li><code className="font-mono text-[12px] text-white">402 credits_exhausted</code> — out of credits. Top up or wait for the monthly grant.</li>
          <li><code className="font-mono text-[12px] text-white">429 rate_limited</code> — upstream busy. Back off and retry, don&apos;t treat as outage.</li>
          <li><code className="font-mono text-[12px] text-white">502 upstream_error</code> — upstream failed. Retry later.</li>
        </ul>
      </section>
    </div>
  );
}
