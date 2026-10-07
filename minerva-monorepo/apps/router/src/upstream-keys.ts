/**
 * Upstream OpenRouter key pool: rotate across keys, fail over on 429s.
 *
 * One key caps the whole router at that key's upstream rate limit. The pool
 * spreads load round-robin and, when a key answers 429 (or dies), parks it
 * for a cooldown and retries the SAME request on the next key — each key at
 * most once per request. Callers never see which key served them, and key
 * material never reaches logs or errors: diagnostics name key indices.
 *
 * Cooldowns by failure class (conservative: a cooled key still serves when
 * every key is cooled — a slow answer beats a refused one):
 * - 429 rate-limited: 60s.
 * - 401/403 rejected key: 10min (likely dead, not busy).
 * - 402 broke key: 5min (rejected unserved — safe to try the next).
 * - 502/503/504 + transport errors: 30s (probably transient).
 * - 400/404/others: terminal, returned as-is (retrying cannot help).
 *
 * Config: `OPENROUTER_API_KEYS` (comma-separated) wins; the singular
 * `OPENROUTER_API_KEY` is the one-key pool (fully backward compatible).
 * Env is read lazily per call — same convention as the rest of this service.
 */

export type FailoverClass = "retry" | "terminal";

const COOLDOWN_MS: Record<string, number> = {
  "429": 60_000,
  "401": 600_000,
  "403": 600_000,
  "402": 300_000,
  "502": 30_000,
  "503": 30_000,
  "504": 30_000,
  transport: 30_000,
};

const FAILOVER_STATUSES = new Set([401, 402, 403, 429, 502, 503, 504]);

/** Failover class for an upstream HTTP status. Unknown 4xx/5xx fail closed. */
export function failoverClass(status: number): FailoverClass {
  return FAILOVER_STATUSES.has(status) ? "retry" : "terminal";
}

/** Cooldown for a failed attempt: HTTP status, or "transport" for network errors. */
export function cooldownMsFor(status: number | "transport"): number | null {
  if (status === "transport") return COOLDOWN_MS["transport"] as number;
  const ms = COOLDOWN_MS[String(status)];
  return typeof ms === "number" ? ms : null;
}

/** All configured upstream keys, in rotation order. Never logs their values. */
export function upstreamKeys(): string[] {
  const plural = (process.env.OPENROUTER_API_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
  if (plural.length > 0) return plural;
  const single = (process.env.OPENROUTER_API_KEY ?? "").trim();
  return single ? [single] : [];
}

/** Log-safe key label: index only, never material. */
export function keyLabel(index: number, total: number): string {
  return `key#${index + 1}/${total}`;
}

export class UpstreamKeyPool {
  private cursor = 0;
  private readonly cooledUntil = new Map<number, number>();

  /** Next usable key index, skipping cooled keys; falls back to the
   *  least-recently-cooled when all are parked. Pure function of (cursor,
   *  cooldowns, now) — inject nowMs in tests for determinism. */
  pick(size: number, nowMs: number = Date.now()): number {
    if (size <= 0) return -1;
    for (let step = 0; step < size; step++) {
      const index = (this.cursor + step) % size;
      if ((this.cooledUntil.get(index) ?? 0) <= nowMs) {
        this.cursor = (index + 1) % size;
        return index;
      }
    }
    let earliest = 0;
    let earliestAt = Infinity;
    for (let index = 0; index < size; index++) {
      const at = this.cooledUntil.get(index) ?? 0;
      if (at < earliestAt) {
        earliestAt = at;
        earliest = index;
      }
    }
    this.cursor = (earliest + 1) % size;
    return earliest;
  }

  /** Record an attempt outcome. Success clears any cooldown. */
  report(index: number, cooldownMs: number | null, nowMs: number = Date.now()): void {
    if (cooldownMs === null || cooldownMs <= 0) {
      this.cooledUntil.delete(index);
      return;
    }
    this.cooledUntil.set(index, nowMs + cooldownMs);
  }

  /** Clear all cooldowns. Tests only — production never calls this. */
  reset(): void {
    this.cooledUntil.clear();
  }
}

const sharedPool = new UpstreamKeyPool();

export function sharedKeyPool(): UpstreamKeyPool {
  return sharedPool;
}
