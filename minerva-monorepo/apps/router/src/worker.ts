/**
 * Cloudflare Workers entry point for the Minerva Router.
 *
 * The Hono app in `./app.js` is platform-agnostic; this file only adapts it
 * to Workers: `nodejs_compat` (see wrangler.toml) provides `process.env`
 * from vars/secrets, so the app's lazy per-request env reads work unchanged,
 * and `node:crypto` (embeddings) resolves to the runtime polyfill.
 *
 * Lifetime: `afterWork()` in `./after.js` hands background work (ledger
 * debits) to a platform hook. Workers gives each request its own
 * `ctx.waitUntil`, so this entry publishes one stable global that resolves
 * the *current* request's hook through an AsyncLocalStorage — concurrent
 * requests never steal each other's lifetime, and no per-request global
 * mutation races. Fail-open (no store → floating promise, same as
 * long-lived Node).
 */

import { AsyncLocalStorage } from "node:async_hooks";

import { app } from "./app.js";

type WaitUntil = (promise: Promise<unknown>) => void;

declare global {
  // eslint-disable-next-line no-var
  var __minervaWaitUntil: WaitUntil | undefined;
}

const waitUntilStore = new AsyncLocalStorage<WaitUntil>();

globalThis.__minervaWaitUntil = (promise: Promise<unknown>) => {
  const hook = waitUntilStore.getStore();
  if (hook) {
    try {
      hook(promise);
      return;
    } catch {
      // Request already settled; fall through to floating.
    }
  }
  void promise.catch(() => undefined);
};

export interface MinervaRouterEnv {
  [key: string]: string | undefined;
}

interface WorkerContext {
  waitUntil(promise: Promise<unknown>): void;
}

export default {
  fetch(request: Request, _env: MinervaRouterEnv, ctx: WorkerContext): Promise<Response> | Response {
    return waitUntilStore.run(
      (promise: Promise<unknown>) => ctx.waitUntil(promise),
      () => app.fetch(request),
    );
  },
};
