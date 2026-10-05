// M12 RLS re-verify gate (§11 M12 / §13): confirms migration 010 landed and its
// two fixes are live:
//   1. `profiles` self-update split (read/update) + role-change guard trigger —
//      closes the self-escalation hole.
//   2. `validation_passports` operator policy uses is_operator() (admins locked
//      out before) — no more role = 'operator' exact match.
// Usage: DATABASE_URL in env → `node scripts/verify-rls.mjs`. Exit 0 = green.
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const sql = postgres(databaseUrl, { max: 1 });

const checks = [];

async function apply(name, fn) {
  try {
    const ok = await fn();
    checks.push({ name, ok });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  } catch (err) {
    checks.push({ name, ok: false });
    console.log(`FAIL  ${name} (${err.message ?? err})`);
  }
}

const hasPolicy = (table, policy) =>
  sql`SELECT 1 FROM pg_policies WHERE tablename = ${table} AND policyname = ${policy} LIMIT 1`.then((r) => r.length > 0);

await apply("migration 010 applied", async () => {
  const rows = await sql`SELECT name FROM _minerva_migrations WHERE name = '010_rls_review_fixes.sql'`;
  return rows.length > 0;
});

await apply("profiles_self_read policy exists", () => hasPolicy("profiles", "profiles_self_read"));
await apply("profiles_self_update policy exists", () => hasPolicy("profiles", "profiles_self_update"));
await apply("legacy self-escalation profiles_self removed", async () => {
  const rows = await sql`SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_self' LIMIT 1`;
  return rows.length === 0;
});
await apply("profiles_role_guard trigger exists", async () => {
  const rows = await sql`
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table = 'profiles' AND trigger_name = 'profiles_role_guard' LIMIT 1`;
  return rows.length > 0;
});
await apply("passports_operator_all uses is_operator()", async () => {
  const rows = await sql`
    SELECT qual, with_check FROM pg_policies
    WHERE tablename = 'validation_passports' AND policyname = 'passports_operator_all' LIMIT 1`;
  if (rows.length === 0) return false;
  const q = rows[0].qual ?? "";
  const wc = rows[0].with_check ?? "";
  return q.includes("is_operator()") && wc.includes("is_operator()");
});

const failed = checks.filter((c) => !c.ok).length;
const applied = await sql`SELECT count(*)::int AS n FROM _minerva_migrations`;
console.log(`migrations applied: ${applied[0].n}`);
if (failed) {
  console.error(`RLS GATE FAILED: ${failed} check(s) red`);
  process.exit(1);
}
console.log("RLS GATE GREEN");
await sql.end();