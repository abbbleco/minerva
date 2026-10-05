// @minerva/database migration runner
// Usage: pnpm --filter @minerva/database db:generate
// Requires DATABASE_URL (Supabase connection string, session or transaction pooler).
// Applies migrations/*.sql in filename order; tracks applied files in _minerva_migrations.
// Pre-rebrand databases carry the tracker as _qontxt_migrations — adopted (renamed) on
// first run so history survives the rebrand instead of replaying every migration.

import postgres from "postgres";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local at the workspace root " +
      "(e.g. postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres)"
  );
  process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
// max: 1, NOT 2. A migration file is a multi-statement string handed to `sql.unsafe()`, and
// postgres.js refuses that on a pooled connection: "UNSAFE_TRANSACTION: Only use sql.begin,
// sql.reserved or max: 1". With max: 2 the first multi-statement migration fails partway —
// leaving the schema half-migrated while the file is NOT recorded as applied, so the next run
// re-executes it. One connection also makes each migration implicitly transactional.
const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  await sql`ALTER TABLE IF EXISTS _qontxt_migrations RENAME TO _minerva_migrations`;
  await sql`CREATE TABLE IF NOT EXISTS _minerva_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    (await sql`SELECT name FROM _minerva_migrations`).map((r) => r.name)
  );

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const body = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`applying ${file} ...`);
    await sql.unsafe(body);
    await sql`INSERT INTO _minerva_migrations (name) VALUES (${file})`;
    ran += 1;
  }

  console.log(ran === 0 ? "no pending migrations" : `applied ${ran} migration(s)`);
  await sql.end();
}

main().catch(async (err) => {
  console.error("migration failed:", err.message ?? err);
  await sql.end().catch(() => {});
  process.exit(1);
});
