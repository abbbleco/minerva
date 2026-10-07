"use client";

import { useCallback, useEffect, useState } from "react";

interface Status {
  configured: boolean;
  role: string;
  current: {
    plan: string;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
  } | null;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Checkout hub for the preselected tier: subscribes (Paystack hosted
 * checkout), or cancels the current subscription. Same-origin cookies carry
 * the session, like the Team page. A new purchase starts a fresh monthly
 * cycle immediately and replaces the old plan — no proration.
 */
export default function ManageClient({ tierId }: { tierId: string }) {
  const tier = tierId.trim().toLowerCase();
  const [status, setStatus] = useState<Status | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/paystack/subscription", { cache: "no-store" });
      if (!res.ok) {
        setStatus(null);
        return;
      }
      setStatus((await res.json()) as Status);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/paystack/subscription", { cache: "no-store" });
        if (!cancelled) setStatus(res.ok ? ((await res.json()) as Status) : null);
      } catch {
        if (!cancelled) setStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/paystack/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: tier }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        authorization_url?: string;
      } | null;
      if (!res.ok || !body?.authorization_url) throw new Error(body?.error ?? "checkout failed");
      window.location.href = body.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "checkout failed");
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/paystack/subscription/cancel", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "cancel failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "cancel failed");
    } finally {
      setBusy(false);
    }
  }

  if (status === undefined) {
    return <p className="mt-6 text-[13px] text-white/60">Loading subscription…</p>;
  }

  const current = status?.current ?? null;
  const isCurrentPaid = current !== null && current.plan === tier && current.status === "active";
  const cancelsAt = current !== null && current.status === "canceled" ? fmtDate(current.current_period_end) : null;

  return (
    <div className="mt-6">
      {error && <p className="mb-4 text-[13px] text-rose-300">{error}</p>}
      {status === null ? (
        <p className="text-[13px] text-white/70">
          <a href={`/login?next=${encodeURIComponent(`/manage-subscription?plan=${tierId}`)}`} className="underline underline-offset-2">
            Sign in
          </a>{" "}
          to subscribe — checkout opens Paystack&apos;s hosted page.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {isCurrentPaid ? (
            <>
              <button type="button" onClick={() => void cancel()} disabled={busy} className="nous-btn-outline !border-white/40 !text-white">
                {busy ? "Working…" : "Cancel plan"}
              </button>
              <span className="text-[12px] text-white/60">Access runs to the paid period end.</span>
            </>
          ) : (
            <>
              <button type="button" onClick={() => void subscribe()} disabled={busy} className="nous-btn">
                {busy ? "Opening checkout…" : `Subscribe — new monthly cycle starts now`}
              </button>
              <span className="text-[12px] text-white/60">No proration: a new purchase replaces the current plan.</span>
            </>
          )}
          {cancelsAt && (
            <span className="text-[12px] text-amber-200/90">Cancels {cancelsAt} — resubscribing above resumes billing.</span>
          )}
        </div>
      )}
    </div>
  );
}
