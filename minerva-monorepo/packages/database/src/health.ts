// Database heartbeat (§16): cheap SELECT 1 over the migration connection.
// Uses postgres.js directly (same driver as the migration runner), never the API.

import postgres from "postgres";

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
