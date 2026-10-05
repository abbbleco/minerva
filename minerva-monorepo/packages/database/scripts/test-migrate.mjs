import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const sql = postgres(databaseUrl, { max: 1 });

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);
const body = readFileSync(
  join(migrationsDir, "022_agency_tenancy.sql"),
  "utf8",
);

// Split by semicolons and run each statement
const statements = body
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

async function main() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    try {
      await sql.unsafe(stmt + ";");
      console.log(`OK [${i + 1}/${statements.length}] ${stmt.slice(0, 60)}...`);
    } catch (err) {
      console.error(
        `FAIL [${i + 1}/${statements.length}] ${stmt.slice(0, 60)}...`,
      );
      console.error("  Error:", err.message);
      break;
    }
  }
  await sql.end();
}

main();
