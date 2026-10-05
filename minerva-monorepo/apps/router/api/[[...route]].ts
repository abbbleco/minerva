/**
 * Vercel entry point — catch-all serverless function for the Minerva Router.
 *
 * The platform-agnostic Hono app lives in `../src/app.js`; this file only adapts it to
 * Vercel (`hono/vercel`) and registers Vercel's after-response hook so ledger debits handed
 * to `afterWork()` survive past the response instead of being frozen with the function.
 *
 * Deploy: Vercel project with Root Directory `apps/router` (monorepo-aware install from the
 * workspace root lockfile). No build step needed — the function bundles TypeScript sources,
 * including the `@minerva/*` workspace packages, at deploy time. Docker/Node behaviour is
 * unchanged: `src/index.ts` remains the long-lived entry.
 */

import { handle } from 'hono/vercel';
import { waitUntil } from '@vercel/functions';
import { app } from '../src/app.js';

// `afterWork()` in `src/after.ts` picks this up when present and keeps fire-and-forget
// otherwise, so non-Vercel runtimes are unaffected.
(globalThis as { waitUntil?: typeof waitUntil }).waitUntil ??= waitUntil;

/**
 * Streaming inference can exceed the 10s Hobby default. Pro with Fluid compute is the
 * supported target for production traffic; Hobby stays suitable for `/health`, `/v1/models`
 * and stub-mode previews.
 */
export const maxDuration = 60;

export default handle(app);
