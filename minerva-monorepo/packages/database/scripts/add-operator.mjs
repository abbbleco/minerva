// @minerva/database add-operator — provision an operator (or client) login.
// Creates the Supabase auth user + the profiles row in one step.
// Usage: pnpm --filter @minerva/database add-operator -- --email admin@minerva.co.za --role operator
//        (omit --email to use the default; --password optional, random if omitted)

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (see .env.local).");
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const email = flag("email") ?? "admin@minerva.co.za";
const role = flag("role") ?? "operator";
const fullName = flag("name") ?? (role === "operator" ? "Minerva Operator" : "Minerva Client");
const password = flag("password") ?? randomBytes(9).toString("base64url");

if (role !== "operator" && role !== "client" && role !== "admin") {
  console.error("--role must be operator | client | admin");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: created, error } = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) {
  console.error("createUser failed:", error.message);
  process.exit(1);
}

const { error: profileError } = await sb.from("profiles").upsert(
  { id: created.user.id, full_name: fullName, role },
  { onConflict: "id" }
);
if (profileError) {
  console.error("profile upsert failed:", profileError.message);
  process.exit(1);
}

console.log(`operator provisioned: ${email}`);
console.log(`password: ${password}`);
console.log(`role: ${role} (login at /login on minerva-app)`);