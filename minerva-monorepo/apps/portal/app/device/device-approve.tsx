"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function DeviceForm() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agency, setAgency] = useState<string | null>(null);

  async function approve(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/device/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_code: code }),
      });
      const json = (await res.json()) as { ok?: boolean; agency?: { name?: string }; error?: string };
      if (!res.ok || !json.ok) {
        if (res.status === 401) {
          setError("signed_out");
        } else {
          setError(json.error ?? "approval failed");
        }
        return;
      }
      setAgency(json.agency?.name ?? "your agency");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[520px] bg-[#12123c] px-10 py-12">
        <p className="nous-display text-[40px] leading-[0.95]">
          Connect
          <br />
          Device
        </p>
        {agency ? (
          <div className="mt-8 space-y-3">
            <p className="text-[14px] text-emerald-300">
              Approved — your device is signing in as {agency}.
            </p>
            <p className="text-[13px] text-white/60">
              Return to your device; it picks up its key automatically. You can close this tab.
            </p>
            <Link href="/minerva" className="nous-btn-outline mt-2 w-full">
              Open Minerva connect
            </Link>
          </div>
        ) : (
          <form onSubmit={approve} className="mt-8">
            <p className="text-[13px] leading-relaxed text-white/65">
              Enter the code shown on your device to link it to your agency. A fresh
              per-device key is minted — never paste keys by hand.
            </p>
            <label htmlFor="device-code" className="mt-5 block text-[13px] font-medium text-white/80">
              Device code
            </label>
            <input
              id="device-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD-1234"
              autoComplete="off"
              spellCheck={false}
              className="nous-input mt-2 !text-center font-mono !text-lg tracking-[0.2em]"
            />
            <button type="submit" disabled={busy || code.trim().length < 4} className="nous-btn mt-6 w-full !py-3.5">
              {busy ? "Approving…" : "Approve device"}
            </button>
            {error === "signed_out" ? (
              <p className="mt-4 text-[13px] text-white/70">
                You are signed out.{" "}
                <Link href={`/login?next=${encodeURIComponent(`/device?code=${code.trim()}`)}`} className="underline">
                  Sign in
                </Link>{" "}
                or{" "}
                <Link href={`/signup?next=${encodeURIComponent(`/device?code=${code.trim()}`)}`} className="underline">
                  create an account
                </Link>
                , then approve.
              </p>
            ) : (
              error && <p className="mt-4 text-[13px] text-rose-300">{error}</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

export default function DeviceApprove() {
  return (
    <Suspense>
      <DeviceForm />
    </Suspense>
  );
}
