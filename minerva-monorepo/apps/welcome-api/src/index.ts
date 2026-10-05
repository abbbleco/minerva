/**
 * Minerva Welcome API — long-lived Node entry point (`tsx src/index.ts`, Docker image).
 *
 * The Hono app itself lives in `./app.js` so serverless targets (Vercel, via
 * `api/[[...route]].js`) can import it without binding a port. This module is
 * the ONLY place that calls `@hono/node-server`'s `serve()`.
 */
import { serve } from "@hono/node-server";
import { app } from "./app.js";

const PORT = Number(process.env.PORT ?? 8091);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`welcome-api listening on port ${info.port}`);
});
