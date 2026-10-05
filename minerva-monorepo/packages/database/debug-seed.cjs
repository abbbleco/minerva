const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

function findUndefined(obj, path = "root") {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) {
      console.log(`UNDEFINED at ${path}.${k}`);
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === "object") findUndefined(item, `${path}.${k}[${i}]`);
      });
    }
  }
}

(async () => {
  try {
    const talents = [
      {
        name: "Anele Mokoena", email: "anele@abbble.co.za", role: "designer", seniority: "senior",
        skills: ["figma", "design-systems"], bio: "x", years_experience: 8, hourly_rate_usd: 65,
        availability: "available",
      },
    ];
    findUndefined(talents, "talents");
    const evalCases = [{ name: "t", brief: "b", expected_prd: null, tags: ["x"], fixture_only: false }];
    findUndefined(evalCases, "evalCases");
    console.log("no undefined in fixtures");
  } catch (e) {
    console.log("ERROR", e.message);
  }
  await sql.end();
})();