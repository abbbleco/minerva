/**
 * Per-agency request velocity limiting (sliding window, in-memory).
 *
 * The gates in `./gates.js` answer "may this tenant spend" (billing, tier,
 * credits, monthly quota). This answers the remaining question: "how fast".
 * Without it one tenant's burst saturates the shared upstream OpenRouter key
 * for everyone, and a runaway loop burns credits at full speed until the
 * monthly quota trips. Limits are per agency (budgets are per agency), with
 * separate free/paid ceilings from env.
 *
 * Fail-open like everything on the hot path: a broken store allows the
 * request (a false 429 is a simultaneous outage for that tenant; a missed
 * limit is absorbed by the upstream key's own headroom). Denials are 429
 * with `retry-after`, matching the portal's throttle shape — never 402
 * (this is pacing, not billing).
 *
 * Scope note: the store is per isolate. Under concurrency the enforcement is
 * approximate (each isolate sees a slice) — sufficient for abuse protection
 * at this scale. If per-key exactness ever matters, graduate the store to a
 * Durable Object; the `VelocityStore` interface is the seam (injectable for
 * tests, same as the clock).
 */

export interface VelocityStore {
  hits(key: string, nowMs: number, windowMs: number): number;
  add(key: string, nowMs: number): void;
}

export interface VelocityLimits {
  windowMs: number;
  freePerWindow: number;
  paidPerWindow: number;
}

export interface VelocityVerdict {
  allowed: boolean;
  retryAfterSeconds: number;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

/** Limits from env, with tier-shaped defaults (see header). */
export function velocityLimits(): VelocityLimits {
  return {
    windowMs: 60_000,
    freePerWindow: envInt("MINERVA_RPM_FREE", 20),
    paidPerWindow: envInt("MINERVA_RPM_PAID", 100),
  };
}

export class MemoryVelocityStore implements VelocityStore {
  private readonly buckets = new Map<string, number[]>();
  private lastSweep = 0;

  hits(key: string, nowMs: number, windowMs: number): number {
    this.prune(key, nowMs, windowMs);
    return this.buckets.get(key)?.length ?? 0;
  }

  add(key: string, nowMs: number): void {
    const bucket = this.buckets.get(key);
    if (bucket) bucket.push(nowMs);
    else this.buckets.set(key, [nowMs]);
  }

  private prune(key: string, nowMs: number, windowMs: number): void {
    const bucket = this.buckets.get(key);
    if (!bucket) return;
    const cutoff = nowMs - windowMs;
    while (bucket.length > 0 && (bucket[0] as number) <= cutoff) bucket.shift();
    if (bucket.length === 0) this.buckets.delete(key);
    // Opportunistic global sweep (amortized): drop idle tenants so a large
    // agency count cannot grow this map without bound.
    if (nowMs - this.lastSweep > windowMs) {
      this.lastSweep = nowMs;
      for (const [other, stamps] of this.buckets) {
        while (stamps.length > 0 && (stamps[0] as number) <= nowMs - windowMs) stamps.shift();
        if (stamps.length === 0) this.buckets.delete(other);
      }
    }
  }
}

const sharedStore = new MemoryVelocityStore();

/**
 * Check one request. Counts only admitted requests — call AFTER the billing
 * gates pass, so denied requests never consume velocity budget.
 */
export function checkVelocity(
  agencyId: string,
  isPaid: boolean,
  store: VelocityStore = sharedStore,
  limits: VelocityLimits = velocityLimits(),
  nowMs: number = Date.now(),
): VelocityVerdict {
  if (!agencyId) return { allowed: true, retryAfterSeconds: 0 };
  try {
    const ceiling = isPaid ? limits.paidPerWindow : limits.freePerWindow;
    const key = `rpm:${agencyId}`;
    const hits = store.hits(key, nowMs, limits.windowMs);
    if (hits >= ceiling) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(limits.windowMs / 1000)) };
    }
    store.add(key, nowMs);
    return { allowed: true, retryAfterSeconds: 0 };
  } catch {
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
