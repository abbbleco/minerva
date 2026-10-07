/**
 * Cloudflare Workers entry point for the Minerva Welcome API.
 *
 * Deliberately thinner than the router's worker entry: this service writes no
 * ledger rows and schedules no after-response work, so there is no lifetime to
 * bridge — the Hono app's fetch handler IS the entry. `nodejs_compat` (see
 * wrangler.toml) provides `process.env` (all config is read lazily per
 * request, so vars/secrets land without code changes) and `node:crypto` (the
 * key-hash check in `./policy.js`).
 */

import { app } from "./app.js";

export default {
  fetch: app.fetch,
};
