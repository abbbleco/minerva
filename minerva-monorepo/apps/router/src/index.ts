/**
 * Minerva Router — long-lived Node entry point (`tsx src/index.ts`, Docker image).
 *
 * The Hono app itself lives in `./app.js` so serverless targets (Vercel, via
 * `api/[[...route]].js`) can import it without binding a port. This module is the ONLY place
 * that calls `@hono/node-server`'s `serve()`.
 *
 * `./app.js` is the canonical import for the app; the `app` re-export below exists so existing
 * imports (`tests/*.test.ts`) keep working.
 */

import { pathToFileURL } from 'node:url';
import { app } from './app.js';

const PORT = Number(process.env.PORT ?? 8090);
const STUB = process.env.MINERVA_ROUTER_STUB === '1';

export { app };
export { chatCostUsd, embeddingCostUsd } from './pricing.js';
export { resolveTenant } from './tenant.js';
export { debitInference, readCreditSummary } from './ledger.js';

/** Boot. Kept out of module scope so tests can import `app` without binding a port. */
export function start(): void {
  void import('@hono/node-server').then(({ serve }) => {
    serve({ fetch: app.fetch, port: PORT });
    console.log(`minrouter listening on :${PORT} (mode=${STUB ? 'stub' : 'live'})`);
  });
}

// Entry point when run directly (`tsx src/index.ts`). Compare via pathToFileURL: on Windows
// `import.meta.url` is `file:///C:/...` while `process.argv[1]` is `C:\...`, so a naive string
// compare never matches and the server silently never boots.
const invoked = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (invoked && import.meta.url === invoked) {
  start();
}
