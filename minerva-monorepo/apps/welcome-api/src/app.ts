/**
 * Minerva Welcome API — free-tier inference entrypoint.
 *
 * A thin policy gate in front of the Minerva router, not a second inference
 * engine. It authenticates guest credentials, enforces "free models only",
 * then relays to the router WITH THE CALLER'S OWN AUTHORIZATION HEADER intact
 * — so metering, ledger and attribution all land on the caller's agency
 * exactly as if they had called the router directly. This service holds no
 * upstream credentials and writes no ledger rows; it only decides whether a
 * request may pass.
 *
 * Why a separate service instead of calling the router directly: the Python
 * client's welcome-host fallback (`DEFAULT_NOUS_WELCOME_URL`) needs a stable
 * origin whose ONLY promise is "free tier here". The router's promise is
 * broader (full catalog, tier gating, billing states). A dedicated origin
 * keeps the fallback's contract narrow and its failure modes obvious.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { freeModels, isFreeModel, verifyGuestKey } from "./policy.js";

export const app = new Hono();

const DEFAULT_CORS_ORIGINS = ["https://portal.abbble.co.za", "http://localhost:3000", "http://localhost:3001"];

function allowedCorsOrigins(): Set<string> {
  const raw = process.env.MINERVA_CORS_ORIGINS;
  if (raw === undefined || raw.trim() === "") return new Set(DEFAULT_CORS_ORIGINS);
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().replace(/\/+$/, ""))
      .filter(Boolean)
  );
}

function routerBaseUrl(): string {
  const raw =
    process.env.MINERVA_ROUTER_URL ??
    process.env.NEXT_PUBLIC_MINERVA_ROUTER_URL ??
    "https://minrouter.abbble.co.za";
  return raw.trim().replace(/\/+$/, "");
}

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      const allowed = allowedCorsOrigins();
      return allowed.has(origin.replace(/\/+$/, "")) ? origin : null;
    },
    allowHeaders: ["Authorization", "Content-Type", "x-minerva-request-id"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["x-minerva-model", "x-minerva-request-id"],
    maxAge: 600,
    credentials: false,
  })
);

app.get("/health", (c) => {
  const free = freeModels();
  return c.json({
    status: "ok",
    mode: "live",
    free_models: free.size,
    router: routerBaseUrl(),
  });
});

// The free catalog, in OpenAI list shape. Only ids — no pricing, because the
// price here is always zero and advertising a rate card invites drift.
app.get("/v1/models", (c) => {
  const free = [...freeModels()].sort();
  return c.json({
    object: "list",
    data: free.map((id) => ({ id, object: "model", created: 0, owned_by: "minerva" })),
  });
});

app.post("/v1/chat/completions", async (c) => {
  const verdict = await verifyGuestKey(c.req.header("authorization"));
  if (!verdict.ok) {
    return c.json({ error: { code: verdict.code, message: verdict.message } }, verdict.status);
  }

  let body: { model?: unknown };
  try {
    body = (await c.req.json()) as { model?: unknown };
  } catch {
    return c.json({ error: { code: "invalid_request", message: "unreadable JSON body" } }, 400);
  }
  const requested = typeof body.model === "string" ? body.model.trim() : "";

  // Omitted model: the router defaults to its free meta-router, which always
  // resolves inside the free set — so "no model named" is automatically
  // policy-clean and needs no gate decision here.
  if (requested && !isFreeModel(requested)) {
    return c.json(
      {
        error: {
          code: "upgrade_required",
          message: `"${requested}" is not on the free tier. Omit the model for the free router, or use a paid key against the Minerva router directly.`,
          allowed_models: [...freeModels()].sort(),
        },
      },
      402
    );
  }

  // Relay with the caller's credential untouched: the router authenticates,
  // meters and debits exactly as for a direct call. Hop-by-hop headers are
  // dropped; everything else (including x-minerva-request-id for idempotent
  // retries) passes through so the two services never disagree about a request.
  let upstream: Response;
  try {
    const headers = new Headers();
    const authorization = c.req.header("authorization");
    if (authorization) headers.set("authorization", authorization);
    const contentType = c.req.header("content-type");
    if (contentType) headers.set("content-type", contentType);
    const requestId = c.req.header("x-minerva-request-id");
    if (requestId) headers.set("x-minerva-request-id", requestId);

    upstream = await fetch(`${routerBaseUrl()}/v1/chat/completions`, {
      method: "POST",
      headers,
      // Re-serializing the parsed body (rather than piping raw bytes) keeps
      // malformed JSON a 400 here instead of a relayed 502 there.
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    });
  } catch (err) {
    return c.json(
      { error: { code: "upstream_error", message: err instanceof Error ? err.message : "relay failed" } },
      502
    );
  }

  const headers = new Headers(upstream.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  headers.delete("connection");
  return new Response(upstream.body, { status: upstream.status, headers });
});
