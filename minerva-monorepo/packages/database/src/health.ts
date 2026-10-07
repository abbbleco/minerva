// Database heartbeat (§16): cheap SELECT 1 over the migration connection.
// Uses postgres.js directly (same driver as the migration runner), never the API.
//
// The driver import is LAZY on purpose: this module rides the
// `@minerva/database` barrel, so any bundler following static imports
// (Vercel ncc, wrangler/esbuild for the router's Workers target) would
// otherwise drag the raw-TCP driver into runtimes that have no sockets.
// Nothing here runs without an explicit call, and callers are all scripts
// (migrate/verify), never request paths.

export interface HealthProbe {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<HealthProbe> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { ok: false, latencyMs: 0, error: "DATABASE_URL not set" };
  }
  const started = Date.now();
  // Lazy: keeps the TCP driver out of static bundle graphs (see header).
  const { default: postgres } = await import("postgres");
  let sql: ReturnType<typeof postgres> | undefined;
  try {
    sql = postgres(databaseUrl, { max: 1, connect_timeout: 8 });
    await sql`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await sql?.end({ timeout: 2 }).catch(() => {});
  }
}
