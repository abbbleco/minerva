"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Member {
  id: string;
  email: string | null;
  userId: string | null;
  role: string;
  status: string;
  createdAt: string | null;
  monthlySpendCapUsd: number | null;
  monthSpendUsd: number | null;
}

function money(value: number): string {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

function spendLine(m: Member): string | null {
  if (m.monthlySpendCapUsd === null) {
    return m.monthSpendUsd === null ? null : `${money(m.monthSpendUsd)} this month · pool only`;
  }
  const spent = m.monthSpendUsd ?? 0;
  return `${money(spent)} of ${money(m.monthlySpendCapUsd)} this month`;
}

interface Roster {
  agency: { id: string; slug: string | null; name: string };
  role: string;
  members: Member[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "no-agency" }
  | { kind: "ready"; roster: Roster }
  | { kind: "error"; message: string };

const ROLE_BLURB: Record<string, string> = {
  owner: "Full control, including owners.",
  manager: "Invite and manage members.",
  operator: "Keys and devices, no headcount.",
  viewer: "Read-only.",
};

const MANAGE_ROLES = ["owner", "manager"];

function label(member: Member): string {
  if (member.email) return member.email;
  if (member.userId) return `user ${member.userId.slice(0, 8)}…`;
  return "unknown seat";
}

export default function TeamClient() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("operator");
  const [allowance, setAllowance] = useState("");
  const [caps, setCaps] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pure fetch: returns the next state instead of setting it, so the mount
  // effect can follow the house async-IIFE + cancel-guard pattern.
  const fetchState = useCallback(async (): Promise<LoadState> => {
    let res: Response;
    try {
      res = await fetch("/api/portal/members", { cache: "no-store" });
    } catch {
      return { kind: "error", message: "could not reach the portal — try again" };
    }
    if (res.status === 401) return { kind: "signed-out" };
    if (res.status === 404) return { kind: "no-agency" };
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return { kind: "error", message: body?.error ?? "could not load the team" };
    }
    return { kind: "ready", roster: (await res.json()) as Roster };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await fetchState();
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchState]);

  const load = useCallback(async () => {
    setError(null);
    setState(await fetchState());
  }, [fetchState]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/portal/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          ...(allowance.trim() === "" ? {} : { monthly_spend_cap_usd: Number(allowance) }),
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        emailed?: boolean;
        resent?: boolean;
      } | null;
      if (!res.ok) throw new Error(body?.error ?? "invite failed");
      setEmail("");
      setAllowance("");
      if (body && body.emailed === false) {
        setNotice("Invite saved, but the email failed to send — share the signup link directly.");
      } else if (body?.resent) {
        setNotice("That invite was already pending — resent.");
      } else {
        setNotice("Invite sent.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "invite failed");
    } finally {
      setBusy(false);
    }
  }

  async function mutate(id: string, init: RequestInit, fail: string) {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(`/api/portal/members/${encodeURIComponent(id)}`, init);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? fail);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : fail);
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === "loading") {
    return <p className="text-[13px] text-white/60">Loading the team…</p>;
  }
  if (state.kind === "signed-out") {
    return (
      <p className="text-[13px] text-white/70">
        <Link href="/login" className="underline underline-offset-2">Sign in</Link> to manage your team.
      </p>
    );
  }
  if (state.kind === "no-agency") {
    return (
      <p className="text-[13px] text-white/70">
        No agency yet — connect Minerva first, then invite your team.{" "}
        <Link href="/minerva" className="underline underline-offset-2">Open Minerva Cloud</Link>
      </p>
    );
  }
  if (state.kind === "error") {
    return (
      <div>
        <p className="text-[13px] text-rose-300">{state.message}</p>
        <button type="button" onClick={() => void load()} className="nous-btn-outline mt-4">
          Try again
        </button>
      </div>
    );
  }

  const { roster } = state;
  const canManage = MANAGE_ROLES.includes(roster.role);

  return (
    <div>
      {notice && <p className="mb-4 text-[13px] text-emerald-300">{notice}</p>}
      {error && <p className="mb-4 text-[13px] text-rose-300">{error}</p>}

      <ul className="divide-y divide-white/10 rounded-[3px] border border-white/10">
        {roster.members.map((m) => {
          // Self-mutations are rejected server-side with guidance; rows stay uniform.
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate text-[14px] text-white">{label(m)}</p>
                <p className="mt-0.5 font-mono text-[11px] tracking-wide text-white/50 uppercase">
                  {m.role} · {m.status}
                </p>
                {spendLine(m) && (
                  <p className="mt-0.5 text-[12px] text-white/60">{spendLine(m)}</p>
                )}
              </div>
              {canManage && (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const raw = (caps[m.id] ?? "").trim();
                    void mutate(
                      m.id,
                      {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          monthly_spend_cap_usd: raw === "" ? null : Number(raw),
                        }),
                      },
                      "could not save allowance"
                    );
                  }}
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={caps[m.id] ?? (m.monthlySpendCapUsd === null ? "" : String(m.monthlySpendCapUsd))}
                    onChange={(e) => setCaps((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    placeholder="Cap $"
                    aria-label={`Monthly spend cap in dollars for ${label(m)} (empty = pool only)`}
                    disabled={busy}
                    className="w-24 rounded-[3px] border border-white/20 bg-transparent px-2 py-1.5 text-[12px] text-white placeholder:text-white/30 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="text-[12px] text-white/60 underline disabled:opacity-50"
                  >
                    Save
                  </button>
                </form>
              )}
              {canManage && m.status === "active" && (
                <select
                  aria-label={`Role for ${label(m)}`}
                  defaultValue={m.role}
                  disabled={busy}
                  onChange={(e) =>
                    void mutate(
                      m.id,
                      {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ role: e.target.value }),
                      },
                      "could not change role"
                    )
                  }
                  className="rounded-[3px] border border-white/20 bg-transparent px-2 py-1.5 text-[12px] text-white disabled:opacity-50"
                >
                  {["owner", "manager", "operator", "viewer"].map((r) => (
                    <option key={r} value={r} className="text-black">
                      {r}
                    </option>
                  ))}
                </select>
              )}
              {canManage && m.status === "active" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void mutate(
                      m.id,
                      {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ status: "suspended" }),
                      },
                      "could not suspend member"
                    )
                  }
                  className="text-[12px] text-white/60 underline disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
              {canManage && m.status === "suspended" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void mutate(
                      m.id,
                      {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ status: "active" }),
                      },
                      "could not reactivate member"
                    )
                  }
                  className="text-[12px] text-white/60 underline disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void mutate(m.id, { method: "DELETE" }, "could not remove member")
                  }
                  className="text-[12px] text-rose-300/80 underline disabled:opacity-50"
                >
                  {m.status === "invited" ? "Cancel invite" : "Remove"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {canManage ? (
        <form onSubmit={invite} className="mt-8 max-w-[560px]">
          <p className="nous-eyebrow mb-2">Invite a seat</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.co.za"
              aria-label="Email to invite"
              className="nous-input flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Role for the invite"
              className="rounded-[3px] border border-white/20 bg-transparent px-3 py-2.5 text-[13px] text-white"
            >
              {["manager", "operator", "viewer"].map((r) => (
                <option key={r} value={r} className="text-black">
                  {r}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              placeholder="Cap $ (optional)"
              aria-label="Monthly spend cap in dollars for the invite (empty = pool only)"
              className="w-40 rounded-[3px] border border-white/20 bg-transparent px-3 py-2.5 text-[13px] text-white placeholder:text-white/30"
            />
            <button type="submit" disabled={busy} className="nous-btn">
              {busy ? "Sending…" : "Send invite"}
            </button>
          </div>
          <p className="mt-2 text-[12px] text-white/50">
            {ROLE_BLURB[role] ?? ""} They sign up with that email and land in {roster.agency.name}.
            {roster.role !== "owner" && " Only owners can invite owners — ask one to add a co-owner."}{" "}
            A cap sets the seat&apos;s monthly spend allowance against the agency balance; empty means pool only.
          </p>
        </form>
      ) : (
        <p className="mt-8 text-[13px] text-white/60">
          Only managers and owners can invite or manage seats. Your role: {roster.role}.
        </p>
      )}
    </div>
  );
}
