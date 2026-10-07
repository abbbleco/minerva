/**
 * After-response work (ledger debits, upstream-drain settlement).
 *
 * On long-lived Node the event loop keeps a floating promise alive, so fire-and-forget is
 * safe. On Vercel the runtime may freeze at the response, dropping the debit — so when a
 * `waitUntil` hook is registered (see `api/[[...route]].ts`, which wires Vercel's), the work
 * is handed to the platform instead.
 *
 * Never throws and never rejects: metering must not break inference.
 */

type WaitUntil = (promise: Promise<unknown>) => void;

function platformWaitUntil(): WaitUntil | null {
  // Workers entry wires the request-scoped hook here (AsyncLocalStorage, so
  // concurrent requests never steal each other's lifetime). Vercel wires the
  // legacy `waitUntil` name once at module scope; both are read at call time.
  const scoped = (globalThis as { __minervaWaitUntil?: unknown }).__minervaWaitUntil;
  if (typeof scoped === 'function') return scoped as WaitUntil;
  const candidate = (globalThis as { waitUntil?: unknown }).waitUntil;
  return typeof candidate === 'function' ? (candidate as WaitUntil) : null;
}

export function afterWork(promise: Promise<unknown>, label: string): void {
  const tracked = promise.catch((err: unknown) => {
    console.error(`[router] background ${label} failed:`, err instanceof Error ? err.message : err);
  });
  const waitUntil = platformWaitUntil();
  if (waitUntil) {
    try {
      waitUntil(tracked);
      return;
    } catch {
      // Platform hook refused it (e.g. called outside a request); fall through.
    }
  }
  void tracked;
}
