"use client";

import { useState } from "react";

const TEAM_SIZES = ["Just me", "2–10", "11–50", "51–200", "200+"];

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

/**
 * The Agency tier card: full-width beneath the self-serve grid. Agency is a
 * sales-led tier (custom volume, invoicing, onboarding), so there is no
 * Subscribe button here — there is a conversation instead. The form posts to
 * /api/contact-sales, which emails the sales desk; the mailto fallback covers
 * anyone whose browser blocks the post or who prefers their own client.
 */
export default function AgencyCard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState(TEAM_SIZES[1]!);
  const [message, setMessage] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "sending" || status.kind === "sent") return;
    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          teamSize,
          message,
          // Honeypot: real users never see it; bots fill it. The server
          // silently accepts-and-discards those submissions.
          companyWebsite,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Something went wrong sending your message.");
      }
      setStatus({ kind: "sent" });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  const input = "nous-input mt-2";

  return (
    <article className="nous-card-flat mt-8 p-6 md:p-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-[2px] bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-[#0a0a2b]">
              AGENCY
            </span>
            <span className="rounded-[2px] border border-white/60 px-2 py-0.5 font-mono text-[10px] text-white">
              CUSTOM
            </span>
          </div>
          <p className="nous-display mt-4 text-[44px] leading-none md:text-[56px]">Custom</p>
          <p className="text-[11px] tracking-widest text-white/60 uppercase">Volume pricing</p>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-white/80">
            For teams running Minerva across an organisation: volume credits priced to your usage,
            invoicing instead of cards, and onboarding with someone who has done it before.
          </p>
          <ul className="mt-5 space-y-1.5 text-[13px] text-white/80">
            {[
              "Everything in the paid tiers, at your volume",
              "Invoice billing with purchase orders",
              "Higher rate limits and rollover caps",
              "Onboarding and shared success channel",
            ].map((f) => (
              <li key={f}>— {f}</li>
            ))}
          </ul>
          <p className="mt-6 text-[13px] text-white/60">
            Prefer email?{" "}
            <a href="mailto:sales@abbble.co.za" className="underline underline-offset-2 text-white">
              sales@abbble.co.za
            </a>
          </p>
        </div>

        <div>
          {status.kind === "sent" ? (
            <div className="nous-card-flat p-6" role="status">
              <p className="nous-display text-[24px]">Message sent</p>
              <p className="mt-2 text-[14px] text-white/70">
                Thanks{ name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""} — sales will reply to{" "}
                {email.trim() || "your inbox"} within two business days.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="agency-name" className="text-[13px] font-medium text-white/80">
                    Name
                  </label>
                  <input
                    id="agency-name"
                    type="text"
                    required
                    maxLength={80}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className={input}
                  />
                </div>
                <div>
                  <label htmlFor="agency-email" className="text-[13px] font-medium text-white/80">
                    Work email
                  </label>
                  <input
                    id="agency-email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ada@company.co.za"
                    className={input}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="agency-company" className="text-[13px] font-medium text-white/80">
                    Company
                  </label>
                  <input
                    id="agency-company"
                    type="text"
                    required
                    maxLength={120}
                    autoComplete="organization"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company (Pty) Ltd"
                    className={input}
                  />
                </div>
                <div>
                  <label htmlFor="agency-team" className="text-[13px] font-medium text-white/80">
                    Team size
                  </label>
                  <select
                    id="agency-team"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className={input}
                  >
                    {TEAM_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="agency-message" className="text-[13px] font-medium text-white/80">
                  What are you running? <span className="text-white/50">(optional)</span>
                </label>
                <textarea
                  id="agency-message"
                  rows={4}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Seats, models, roughly how much inference a month…"
                  className={`${input} resize-y`}
                />
              </div>
              {/* Honeypot — visually hidden, never tabbable. Bots fill it; humans can't. */}
              <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0" tabIndex={-1}>
                <label>
                  Company website
                  <input
                    type="text"
                    name="companyWebsite"
                    autoComplete="off"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </label>
              </div>
              {status.kind === "error" && (
                <p className="text-[13px] text-rose-300" role="alert">
                  {status.message}
                </p>
              )}
              <button type="submit" disabled={status.kind === "sending"} className="nous-btn mt-1 w-full !py-3.5">
                {status.kind === "sending" ? "Sending…" : "Contact sales"}
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
