import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SALES_TO = (process.env.SALES_TO_EMAIL ?? "sales@abbble.co.za").trim();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const TEAM_SIZES = new Set(["Just me", "2–10", "11–50", "51–200", "200+"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function ipHash(ip: string): string {
  const salt = process.env.MINERVA_GUEST_MINT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "minerva-guest";
  return createHash("sha256").update(`${salt}:contact:${ip}`).digest("hex");
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/contact-sales — Agency tier inquiry from the plans page.
 *
 * Unauthenticated by design (it is how a stranger first reaches sales), so
 * every abuse control that does not need an account is applied: strict field
 * validation with small caps, a honeypot the client renders invisibly, and a
 * per-IP throttle (5/hour) backed by a hash-only table.
 *
 * Delivery is Mailtrap's sending API (`POST https://send.api.mailtrap.io/api/send`,
 * no SMTP connection to hold open on serverless). The `From` identity must be
 * a Mailtrap-verified sender or Mailtrap rejects the send — that is a
 * dashboard step, not code: `MAILTRAP_FROM_EMAIL` names it. The submitter's
 * address goes in `Reply-To` (header) and in the body, so sales replies to
 * the human, never to the no-reply sender.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("invalid JSON body");
  }

  // Honeypot first, before any validation error could teach a bot the shape:
  // a filled trapdoor is accepted-and-discarded with a success response, so
  // automated submitters cannot distinguish it from a delivered message.
  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const teamSize = typeof body.teamSize === "string" ? body.teamSize : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 80) return bad("name is required (max 80 characters)");
  if (!EMAIL_RE.test(email) || email.length > 254) return bad("a valid work email is required");
  if (!company || company.length > 120) return bad("company is required (max 120 characters)");
  if (!TEAM_SIZES.has(teamSize)) return bad("team size is required");
  if (message.length > 2000) return bad("message is too long (max 2000 characters)");

  const token = process.env.MAILTRAP_API_TOKEN?.trim();
  const fromEmail = process.env.MAILTRAP_FROM_EMAIL?.trim();
  if (!token || !fromEmail) {
    // Misconfigured deploy, not a caller error — but report it as a plain
    // 503 without naming which variable is missing.
    return NextResponse.json({ error: "contact form is not configured right now — please email sales directly" }, { status: 503 });
  }
  const fromName = process.env.MAILTRAP_FROM_NAME?.trim() || "ABBBLE Portal";

  try {
    const admin = serviceClient();
    const hash = ipHash(clientIp(request));
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count, error: cErr } = await admin
      .from("portal_contact_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", hash)
      .gte("created_at", since);
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    if ((count ?? 0) >= MAX_PER_WINDOW) {
      return NextResponse.json(
        { error: "too many messages — please try again later" },
        { status: 429, headers: { "retry-after": String(WINDOW_MS / 1000) } }
      );
    }

    const subject = `[Portal] Agency inquiry — ${company} (${teamSize})`;
    const text = [
      `New Agency tier inquiry from the portal plans page.`,
      ``,
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Company: ${company}`,
      `Team:    ${teamSize}`,
      message ? `` : null,
      message ? `Notes:` : null,
      message ? message : null,
      ``,
      `Reply-To: ${email}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    const sending = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: [{ email: SALES_TO }],
        subject,
        text,
        headers: { "Reply-To": email },
        category: "agency-inquiry",
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!sending.ok) {
      const detail = await sending.text().catch(() => "");
      console.error("[contact-sales] mailtrap rejected the send", sending.status, detail.slice(0, 300));
      return NextResponse.json({ error: "could not deliver your message — please email sales directly" }, { status: 502 });
    }

    await admin.from("portal_contact_requests").insert({ ip_hash: hash });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
