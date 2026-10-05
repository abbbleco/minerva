import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const rows = await sql`SELECT
  (SELECT count(*)::int FROM talents) AS talents,
  (SELECT count(*)::int FROM project_history) AS history,
  (SELECT count(*)::int FROM eval_cases) AS evals,
  (SELECT count(*)::int FROM _minerva_migrations) AS migrations,
  (SELECT count(*)::int FROM profiles) AS profiles,
  (SELECT count(*)::int FROM briefs) AS briefs`;
console.log(JSON.stringify(rows[0]));
await sql.end();