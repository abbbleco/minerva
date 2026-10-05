// M-SAAS-P0 agency tenancy RLS verify gate (AGENCY_IMP_PLAN.md §3.2, §12).
// Confirms migration 022 landed and its tenancy/RLS plumbing is live:
//   1. Agency tables + tenancy columns on clients/briefs.
//   2. Helper functions (is_agency_member, is_agency_owner, is_agency_editor).
//   3. RLS enabled + policies on every agency-scoped table.
//   4. briefs.agency_id sync trigger (briefs_agency_default).
//   5. Indexes, config registry seeds, and RPC functions.
// Usage: DATABASE_URL in env → `node scripts/verify-agency-rls.mjs`. Exit 0 = green.
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

const hasTable = (table) =>
  sql`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ${table} LIMIT 1`.then((r) => r.length > 0);

const hasColumn = (table, column) =>
  sql`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column} LIMIT 1`.then((r) => r.length > 0);

const hasFunction = (fn) =>
  sql`SELECT 1 FROM pg_proc WHERE proname = ${fn} LIMIT 1`.then((r) => r.length > 0);

const hasTrigger = (table, trigger) =>
  sql`SELECT 1 FROM information_schema.triggers WHERE event_object_table = ${table} AND trigger_name = ${trigger} LIMIT 1`.then((r) => r.length > 0);

const hasPolicy = (table, policy) =>
  sql`SELECT 1 FROM pg_policies WHERE tablename = ${table} AND policyname = ${policy} LIMIT 1`.then((r) => r.length > 0);

const hasIndex = (index) =>
  sql`SELECT 1 FROM pg_indexes WHERE indexname = ${index} LIMIT 1`.then((r) => r.length > 0);

const hasConfigKey = (key) =>
  sql`SELECT 1 FROM config_registry WHERE key = ${key} LIMIT 1`.then((r) => r.length > 0);

const hasMigration = (name) =>
  sql`SELECT 1 FROM _minerva_migrations WHERE name = ${name} LIMIT 1`.then((r) => r.length > 0);

// --- Migration 022 applied ---
await apply("migration 022_agency_tenancy.sql applied", async () => {
  const rows = await sql`SELECT name FROM _minerva_migrations WHERE name = '022_agency_tenancy.sql'`;
  return rows.length > 0;
});

// --- Agency tables exist ---
await apply("agencies table exists", () => hasTable("agencies"));
await apply("agency_memberships table exists", () => hasTable("agency_memberships"));
await apply("agency_api_keys table exists", () => hasTable("agency_api_keys"));
await apply("agency_webhooks table exists", () => hasTable("agency_webhooks"));
await apply("webhook_deliveries table exists", () => hasTable("webhook_deliveries"));
await apply("agency_usage table exists", () => hasTable("agency_usage"));

// --- Tenancy columns on existing tables ---
await apply("clients.agency_id column exists", () => hasColumn("clients", "agency_id"));
await apply("briefs.agency_id column exists", () => hasColumn("briefs", "agency_id"));
await apply("briefs.metadata column exists", () => hasColumn("briefs", "metadata"));

// --- Abbble Co seed agency exists ---
await apply("abbble-co seed agency exists", async () => {
  const rows = await sql`SELECT 1 FROM agencies WHERE slug = 'abbble-co' LIMIT 1`;
  return rows.length > 0;
});

// --- Helper functions ---
await apply("is_agency_member() function exists", () => hasFunction("is_agency_member"));
await apply("is_agency_owner() function exists", () => hasFunction("is_agency_owner"));
await apply("is_agency_editor() function exists", () => hasFunction("is_agency_editor"));

// --- RLS enabled on agency tables ---
await apply("agencies RLS enabled", async () => {
  const rows = await sql`SELECT relrowsecurity FROM pg_class WHERE relname = 'agencies'`;
  return rows.length > 0 && rows[0].relrowsecurity;
});
await apply("agency_memberships RLS enabled", async () => {
  const rows = await sql`SELECT relrowsecurity FROM pg_class WHERE relname = 'agency_memberships'`;
  return rows.length > 0 && rows[0].relrowsecurity;
});
await apply("agency_api_keys RLS enabled", async () => {
  const rows = await sql`SELECT relrowsecurity FROM pg_class WHERE relname = 'agency_api_keys'`;
  return rows.length > 0 && rows[0].relrowsecurity;
});
await apply("agency_webhooks RLS enabled", async () => {
  const rows = await sql`SELECT relrowsecurity FROM pg_class WHERE relname = 'agency_webhooks'`;
  return rows.length > 0 && rows[0].relrowsecurity;
});
await apply("webhook_deliveries RLS enabled", async () => {
  const rows = await sql`SELECT relrowsecurity FROM pg_class WHERE relname = 'webhook_deliveries'`;
  return rows.length > 0 && rows[0].relrowsecurity;
});
await apply("agency_usage RLS enabled", async () => {
  const rows = await sql`SELECT relrowsecurity FROM pg_class WHERE relname = 'agency_usage'`;
  return rows.length > 0 && rows[0].relrowsecurity;
});

// --- RLS policies ---
await apply("agencies_members policy exists", () => hasPolicy("agencies", "agencies_members"));
await apply("agencies_operators policy exists", () => hasPolicy("agencies", "agencies_operators"));
await apply("memberships_read policy exists", () => hasPolicy("agency_memberships", "memberships_read"));
await apply("memberships_edit policy exists", () => hasPolicy("agency_memberships", "memberships_edit"));
await apply("api_keys_edit policy exists", () => hasPolicy("agency_api_keys", "api_keys_edit"));
await apply("webhooks_edit policy exists", () => hasPolicy("agency_webhooks", "webhooks_edit"));
await apply("deliveries_read policy exists", () => hasPolicy("webhook_deliveries", "deliveries_read"));
await apply("usage_read policy exists", () => hasPolicy("agency_usage", "usage_read"));
await apply("clients_agency policy exists", () => hasPolicy("clients", "clients_agency"));
await apply("briefs_agency policy exists", () => hasPolicy("briefs", "briefs_agency"));

// --- Sync trigger on briefs ---
await apply("briefs_agency_default trigger exists", () => hasTrigger("briefs", "briefs_agency_default"));

// --- Indexes ---
await apply("idx_clients_agency index exists", () => hasIndex("idx_clients_agency"));
await apply("idx_briefs_agency_status index exists", () => hasIndex("idx_briefs_agency_status"));
await apply("idx_api_keys_hash index exists", () => hasIndex("idx_api_keys_hash"));
await apply("idx_usage_agency_period index exists", () => hasIndex("idx_usage_agency_period"));
await apply("idx_webhook_deliveries_retry index exists", () => hasIndex("idx_webhook_deliveries_retry"));

// --- Config registry seeds ---
await apply("platform.signup_policy config exists", () => hasConfigKey("platform.signup_policy"));
await apply("platform.agency_default_plan config exists", () => hasConfigKey("platform.agency_default_plan"));
await apply("platform.trial_days config exists", () => hasConfigKey("platform.trial_days"));
await apply("billing.plans.hobby config exists", () => hasConfigKey("billing.plans.hobby"));
await apply("billing.plans.pro config exists", () => hasConfigKey("billing.plans.pro"));
await apply("billing.plans.enterprise config exists", () => hasConfigKey("billing.plans.enterprise"));
await apply("billing.overage_gate config exists", () => hasConfigKey("billing.overage_gate"));
await apply("billing.unit_price_per_1k_tokens config exists", () => hasConfigKey("billing.unit_price_per_1k_tokens"));

// --- RPC functions ---
await apply("agency_rate_take() function exists", () => hasFunction("agency_rate_take"));
await apply("agency_usage_bump() function exists", () => hasFunction("agency_usage_bump"));

// --- Membership invite dedupe index ---
await apply("idx_membership_invite_email index exists", () => hasIndex("idx_membership_invite_email"));

const failed = checks.filter((c) => !c.ok).length;
const applied = await sql`SELECT count(*)::int AS n FROM _minerva_migrations`;
console.log(`migrations applied: ${applied[0].n}`);
if (failed) {
  console.error(`AGENCY RLS GATE FAILED: ${failed} check(s) red`);
  process.exit(1);
}
console.log("AGENCY RLS GATE GREEN");
await sql.end();
