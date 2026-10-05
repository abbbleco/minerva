import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'agency%' OR table_name = 'clients' OR table_name = 'briefs'
      ORDER BY table_name
    `;
    console.log("Tables:", tables.map(t => t.table_name));
    
    const migrations = await sql`SELECT name FROM _minerva_migrations ORDER BY name`;
    console.log("Migrations:", migrations.map(m => m.name));
  } catch (err) {
    console.error(err.message);
  } finally {
    await sql.end();
  }
}

main();
