// @minerva/database seed — 10 talents + 5 project histories + 3 eval cases
// Usage: pnpm --filter @minerva/database db:seed
// NOTE: talent embeddings are left NULL here; run the embedding job (ai-core)
// after seeding so the match_talent RPC has vectors to search.

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 2 });

const talents = [
  // --- designers ---
  {
    name: "Anele Mokoena", email: "anele@abbble.co.za", role: "designer", seniority: "senior",
    skills: ["figma", "design-systems", "prototyping", "branding", "user-research"],
    bio: "Senior product designer focused on design systems and brand-led product UI.",
    years_experience: 8, hourly_rate_usd: 65, availability: "available",
  },
  {
    name: "Thandi Nkosi", email: "thandi@abbble.co.za", role: "designer", seniority: "mid",
    skills: ["figma", "ui-design", "wireframing", "accessibility"],
    bio: "Product designer with a track record in fintech and e-commerce flows.",
    years_experience: 4, hourly_rate_usd: 45, availability: "available",
  },
  {
    name: "Lerato Dube", email: "lerato@abbble.co.za", role: "designer", seniority: "junior",
    skills: ["figma", "prototyping", "motion-design"],
    bio: "Junior designer strong on rapid prototyping and motion polish.",
    years_experience: 2, hourly_rate_usd: 28, availability: "available",
  },
  // --- developers ---
  {
    name: "Sipho Mahlangu", email: "sipho@abbble.co.za", role: "developer", seniority: "lead",
    skills: ["typescript", "nextjs", "react", "postgresql", "docker", "ai-integrations"],
    bio: "Lead full-stack engineer; shipped AI-assisted products on Next.js and Postgres.",
    years_experience: 11, hourly_rate_usd: 85, availability: "available",
  },
  {
    name: "Naledi Khumalo", email: "naledi@abbble.co.za", role: "developer", seniority: "senior",
    skills: ["typescript", "react", "nodejs", "graphql", "testing"],
    bio: "Senior frontend engineer obsessed with typed React and test coverage.",
    years_experience: 7, hourly_rate_usd: 60, availability: "available",
  },
  {
    name: "Tshepo Molefe", email: "tshepo@abbble.co.za", role: "developer", seniority: "senior",
    skills: ["python", "django", "postgresql", "ml-ops", "vertex-ai"],
    bio: "Backend/ML engineer; production experience with Vertex AI pipelines.",
    years_experience: 6, hourly_rate_usd: 62, availability: "busy",
  },
  {
    name: "Zanele Mthembu", email: "zanele@abbble.co.za", role: "developer", seniority: "mid",
    skills: ["typescript", "react-native", "mobile", "firebase"],
    bio: "Mobile engineer shipping React Native apps end to end.",
    years_experience: 5, hourly_rate_usd: 42, availability: "available",
  },
  {
    name: "Kagiso Smith", email: "kagiso@abbble.co.za", role: "developer", seniority: "junior",
    skills: ["javascript", "html", "css", "figma-to-code"],
    bio: "Junior web engineer with a design-to-code focus.",
    years_experience: 1, hourly_rate_usd: 22, availability: "available",
  },
  // --- PMs ---
  {
    name: "Rethabile Maseko", email: "rethabile@abbble.co.za", role: "pm", seniority: "lead",
    skills: ["product-strategy", "roadmapping", "prd-authoring", "stakeholder-management", "agile"],
    bio: "Lead product manager who has taken 30+ products from brief to launch.",
    years_experience: 10, hourly_rate_usd: 70, availability: "available",
  },
  {
    name: "Bonolo Mothibi", email: "bonolo@abbble.co.za", role: "pm", seniority: "senior",
    skills: ["user-research", "analytics", "agile", "client-communication"],
    bio: "Senior PM strong on research synthesis and client-facing scoping.",
    years_experience: 6, hourly_rate_usd: 55, availability: "available",
  },
  // --- QA ---
  {
    name: "Mpho Khumalo", email: "mpho@abbble.co.za", role: "qa", seniority: "mid",
    skills: ["test-automation", "playwright", "api-testing", "cucumber"],
    bio: "QA engineer who turns acceptance criteria into automated suites.",
    years_experience: 5, hourly_rate_usd: 38, availability: "available",
  },
];

const histories = [
  { talent_email: "anele@abbble.co.za", project_title: "Fintech onboarding redesign", description: "Design system + onboarding flow for a payments app; reduced drop-off by 34%.", stack: ["figma", "design-systems"], outcomes: { metric: "drop-off -34%" }, completed_at: "2025-11-14" },
  { talent_email: "sipho@abbble.co.za", project_title: "AI support copilot", description: "RAG-based support assistant with Gemini on Vertex AI; 41% of tickets auto-resolved.", stack: ["nextjs", "vertex-ai", "postgresql"], outcomes: { metric: "41% auto-resolved" }, completed_at: "2026-02-20" },
  { talent_email: "naledi@abbble.co.za", project_title: "SaaS analytics dashboard", description: "Real-time dashboard in Next.js with typed GraphQL and 90% test coverage.", stack: ["react", "graphql", "typescript"], outcomes: { metric: "90% coverage" }, completed_at: "2025-09-02" },
  { talent_email: "rethabile@abbble.co.za", project_title: "Property portal (SA market)", description: "Brief-to-launch delivery of a property listing portal, scoped in 3 weeks.", stack: ["prd", "agile"], outcomes: { metric: "on-time launch" }, completed_at: "2025-06-30" },
  { talent_email: "mpho@abbble.co.za", project_title: "E-commerce checkout regression", description: "Playwright suite covering 120+ checkout scenarios across 3 flows.", stack: ["playwright", "api-testing"], outcomes: { metric: "120+ scenarios" }, completed_at: "2026-01-12" },
];

async function main() {
  const { count: talentRows } = await sql`
    INSERT INTO talents ${sql(talents)} ON CONFLICT (email) DO NOTHING`;

  const byEmail = new Map(
    (await sql`SELECT id, email FROM talents`).map((t) => [t.email, t.id])
  );

  const historyRows = histories
    .map((h) => ({ ...h, talent_id: byEmail.get(h.talent_email) }))
    .filter((h) => h.talent_id);

  const { count: historyCount } = await sql`
    INSERT INTO project_history ${sql(historyRows, "talent_id", "project_title", "description", "stack", "outcomes", "completed_at")} ON CONFLICT DO NOTHING`;

  const evalCases = [
    {
      name: "golden_ecommerce_brief",
      brief: "We run a mid-sized online fashion retailer in Johannesburg. We need a new storefront that feels premium but loads fast on mobile data. Support cart abandonment recovery with WhatsApp notifications, allow pay-by-instalment, and integrate stock from our existing ERP. The team is small — keep the backend simple.",
      expected_prd: null, tags: ["ecommerce", "mobile", "golden"], fixture_only: false,
    },
    {
      name: "golden_healthcare_brief",
      brief: "A network of private clinics wants a patient booking system. Patients must book, reschedule and get reminders via SMS. Clinicians need a daily schedule view and waitlist management. Compliance: keep patient data in South Africa and log all access.",
      expected_prd: null, tags: ["healthcare", "compliance", "golden"], fixture_only: false,
    },
    {
      name: "fixture_demo_brief",
      brief: "A start-up wants an internal tool to track content briefs, assign writers and get AI feedback on drafts. They have 5 people and want it live in 8 weeks.",
      expected_prd: null, tags: ["internal-tool", "demo"], fixture_only: true,
    },
  ];

const { count: evalCount } = await sql`
    INSERT INTO eval_cases ${sql(evalCases)} ON CONFLICT DO NOTHING`;

  // Phase 4 (§19.3/§19.9): stream-classifier eval cases. fixture_only so the
  // golden suite (mean IPS) is never polluted; `brief` carries the inbound
  // message text, `expected:<kind>` tags carry the ground truth taxonomy label.
  const classifierCases = [
    {
      name: "classifier_whatsapp_scope_update",
      brief: "Hey! For the BriefByte launch site we also want a partner section listing our resellers and a press kit page.",
      expected_prd: null, tags: ["stream-classifier", "expected:scope_update"], fixture_only: true,
    },
    {
      name: "classifier_slack_research",
      brief: "Ran three usability interviews on the checkout flow today — people could not find the promo-code field, everyone loved the one-page checkout.",
      expected_prd: null, tags: ["stream-classifier", "expected:research"], fixture_only: true,
    },
    {
      name: "classifier_github_shipped",
      brief: "Production deploy finished: Homepage v2 is live.",
      expected_prd: null, tags: ["stream-classifier", "expected:shipped_work"], fixture_only: true,
    },
    {
      name: "classifier_whatsapp_noise",
      brief: "Thanks, that sounds great!",
      expected_prd: null, tags: ["stream-classifier", "expected:automated_noise"], fixture_only: true,
    },
    {
      name: "classifier_slack_design_feedback",
      brief: "The checkout button still looks off — can we make it green with rounded corners?",
      expected_prd: null, tags: ["stream-classifier", "expected:design_feedback"], fixture_only: true,
    },
    {
      name: "classifier_whatsapp_escalation",
      brief: "This is urgent — our website is down in production and we cannot launch today. Please help right now.",
      expected_prd: null, tags: ["stream-classifier", "expected:escalation"], fixture_only: true,
    },
    // M6 audit follow-up: channels 2-4 join the harness (fixture texts mirror
    // packages/ai-core/src/bridge/streams/fixtures.ts so demo and eval agree).
    {
      name: "classifier_meeting_research",
      brief: "In the weekly sync the client shared user feedback: everyone loves the one-page checkout, but two people could not find the promo-code field, and the team asked whether we could surface it in the cart.",
      expected_prd: null, tags: ["stream-classifier", "expected:research"], fixture_only: true,
    },
    {
      name: "classifier_meeting_scope_update",
      brief: "Decision from the call: we are dropping the referral widget and moving the partner onboarding to first priority before launch.",
      expected_prd: null, tags: ["stream-classifier", "expected:scope_update"], fixture_only: true,
    },
    {
      name: "classifier_figma_design_feedback",
      brief: "The new pricing card on the dashboard feels heavy — can we tighten the spacing and swap the accent colour to brand green?",
      expected_prd: null, tags: ["stream-classifier", "expected:design_feedback"], fixture_only: true,
    },
    {
      name: "classifier_docs_scope_update",
      brief: "Attached the updated functional spec: the portal must add a supplier approval workflow before the public launch.",
      expected_prd: null, tags: ["stream-classifier", "expected:scope_update"], fixture_only: true,
    },
    {
      name: "classifier_docs_research",
      brief: "Brand guidelines doc uploaded — approved colour palette, typography scale and the new logo lock-up for the designer handoff.",
      expected_prd: null, tags: ["stream-classifier", "expected:research"], fixture_only: true,
    },
  ];
  const { count: classifierCount } = await sql`
    INSERT INTO eval_cases ${sql(classifierCases)} ON CONFLICT DO NOTHING`;

  // Phase 5 (§20.3/§20.6): scope-intelligence eval cases (M8). fixture_only;
  // the `brief` column carries a JSON payload — detection cases:
  //   {messageText, stories[], outOfScope[], expectOut}
  // shadow-PM cases: PrdAuditSource + {expectedGaps[]}.
  // Texts mirror packages/ai-core/src/scope/scope.test.ts so demo and eval agree.
  const scopeStories = [
    "As a buyer I can check out securely and receive a confirmation email",
    "As a store admin I can manage product listings and inventory",
    "As an operator I can review analytics dashboards showing orders and revenue",
  ];
  const scopeOutOfScope = ["partners portal", "candidate application portal", "mobile app", "press kit download"];
  const scopeIntelligenceCases = [
    {
      name: "scope_detect_partners_portal",
      brief: JSON.stringify({ messageText: "we also want a partners portal for our clients", stories: scopeStories, outOfScope: scopeOutOfScope, expectOut: true }),
      expected_prd: null, tags: ["scope-intelligence", "scope-detect"], fixture_only: true,
    },
    {
      name: "scope_detect_candidate_portal",
      brief: JSON.stringify({ messageText: "add a candidate application portal for hiring", stories: scopeStories, outOfScope: scopeOutOfScope, expectOut: true }),
      expected_prd: null, tags: ["scope-intelligence", "scope-detect"], fixture_only: true,
    },
    {
      name: "scope_detect_mobile_app",
      brief: JSON.stringify({ messageText: "please add a mobile app version too", stories: scopeStories, outOfScope: scopeOutOfScope, expectOut: true }),
      expected_prd: null, tags: ["scope-intelligence", "scope-detect"], fixture_only: true,
    },
    {
      name: "scope_detect_press_kit",
      brief: JSON.stringify({ messageText: "we need a press kit download section for journalists", stories: scopeStories, outOfScope: scopeOutOfScope, expectOut: true }),
      expected_prd: null, tags: ["scope-intelligence", "scope-detect"], fixture_only: true,
    },
    {
      name: "scope_detect_checkout_covered",
      brief: JSON.stringify({ messageText: "we want buyers to check out securely with confirmation emails", stories: scopeStories, outOfScope: scopeOutOfScope, expectOut: false }),
      expected_prd: null, tags: ["scope-intelligence", "scope-detect"], fixture_only: true,
    },
    {
      name: "scope_detect_inventory_covered",
      brief: JSON.stringify({ messageText: "let's add more product listings and inventory management", stories: scopeStories, outOfScope: scopeOutOfScope, expectOut: false }),
      expected_prd: null, tags: ["scope-intelligence", "scope-detect"], fixture_only: true,
    },
    {
      name: "scope_detect_analytics_covered",
      brief: JSON.stringify({ messageText: "can we see analytics dashboards for orders and revenue", stories: scopeStories, outOfScope: scopeOutOfScope, expectOut: false }),
      expected_prd: null, tags: ["scope-intelligence", "scope-detect"], fixture_only: true,
    },
    {
      name: "shadow_pm_seeded_gaps",
      brief: JSON.stringify({
        summary: "A store platform with authentication for admins, role-based permissions and validation errors shown as toasts",
        scope: ["buyer checkout", "admin product management", "analytics dashboards"],
        deliverables: ["checkout flow", "admin dashboard", "reporting"],
        risks: [], assumptions: [],
        expectedGaps: ["edge_cases", "performance", "ux"],
      }),
      expected_prd: null, tags: ["scope-intelligence", "shadow-pm"], fixture_only: true,
    },
    {
      name: "shadow_pm_full_coverage",
      brief: JSON.stringify({
        summary: "Secure admin roles with retries on failure, empty-state UX, caching for sub-second latency and edge case handling for duplicates",
        scope: ["checkout"], deliverables: ["flow"], risks: [], assumptions: [],
        expectedGaps: [],
      }),
      expected_prd: null, tags: ["scope-intelligence", "shadow-pm"], fixture_only: true,
    },
    {
      name: "shadow_pm_no_coverage",
      brief: JSON.stringify({ summary: "", scope: [], deliverables: [], risks: [], assumptions: [], expectedGaps: ["error_handling", "edge_cases", "security", "performance", "ux"] }),
      expected_prd: null, tags: ["scope-intelligence", "shadow-pm"], fixture_only: true,
    },
  ];
  const { count: scopeCount } = await sql`
    INSERT INTO eval_cases ${sql(scopeIntelligenceCases)} ON CONFLICT DO NOTHING`;

  // Phase 5 (§20.4/§20.10): M9 eval cases. fixture_only.
  // -- guardrails: `brief` carries JSON {files: [{path, content}], expectViolations: [ruleId...]}
  //    mirroring packages/ai-core/src/bridge/guardrails/guardrails.test.ts so demo + eval agree.
  // -- onboarding: `brief` carries JSON {prdTitle, clientName, deliverables, expectSections []}.
  const guardrailCode = (content) => [{ path: "src/change.ts", content }];
  const guardrailsCases = [
    {
      name: "guardrail_blocked_jquery",
      brief: JSON.stringify({ files: guardrailCode(`import $ from "jquery";\n$(".cta").fadeIn();`), expectViolations: ["blocked_library.dependency"] }),
      expected_prd: null, tags: ["guardrails", "validate-code-change"], fixture_only: true,
    },
    {
      name: "guardrail_design_token_misuse",
      brief: JSON.stringify({ files: guardrailCode(`const accent = "#ff5733";\n<div style={{ color: accent }} />`), expectViolations: ["design_token.color_literal", "style.inline_style"] }),
      expected_prd: null, tags: ["guardrails", "validate-code-change"], fixture_only: true,
    },
    {
      name: "guardrail_sql_interpolation",
      brief: JSON.stringify({ files: guardrailCode(`db.query("SELECT * FROM users WHERE email = " + email);`), expectViolations: ["security.sql_injection"] }),
      expected_prd: null, tags: ["guardrails", "validate-code-change"], fixture_only: true,
    },
    {
      name: "guardrail_xss_innerhtml",
      brief: JSON.stringify({ files: guardrailCode(`el.innerHTML = userInput;`), expectViolations: ["security.xss_sink"] }),
      expected_prd: null, tags: ["guardrails", "validate-code-change"], fixture_only: true,
    },
    {
      name: "guardrail_clean_parameterized",
      brief: JSON.stringify({
        files: [{ path: "src/change.ts", content: `db.query("SELECT * FROM users WHERE id = $1", [id]);\n// comment: jquery is fine here\nconst brand = "#0e9f6e";` }],
        expectViolations: [],
      }),
      expected_prd: null, tags: ["guardrails", "validate-code-change"], fixture_only: true,
    },
    {
      name: "onboarding_launch_kit_sections",
      brief: JSON.stringify({
        prdTitle: "Storefront refresh with order tracking",
        clientName: "Acme Retail",
        deliverables: ["Storefront v2", "Order tracking dashboard", "Loyalty program"],
        expectSections: ["portal", "guide", "roadmap", "tools", "welcome_video", "survey"],
      }),
      expected_prd: null, tags: ["guardrails", "launch-kit"], fixture_only: true,
    },
  ];
  const { count: m9Count } = await sql`
    INSERT INTO eval_cases ${sql(guardrailsCases)} ON CONFLICT DO NOTHING`;

  // Phase 5 (§20.7/§20.8): M10 eval cases. fixture_only.
  // -- retention: `brief` carries JSON {ledger: [{text, daysAgo}], expect: {cssMin, cssMax, churnLevels[]}}
  //    and runs the SAME pure chain the /api/v5/client/score route uses; the eval
  //    asserts CSS lands in the honest band, churn level matches the seeded
  //    halo, and NO message body leaks into the breakdown (privacy rule).
  // -- dna: `brief` carries a DnaSource + a declarative, JSON-safe `edit`
  //    additions block to simulate a PRD edit; regeneration must keep every
  //    claim source_ref'd (provenance §5.2).
  const retentionCases = [
    {
      name: "retention_seeded_month_healthy",
      brief: JSON.stringify({
        ledger: [
          { text: "the storefront refresh is coming together nicely, great progress", daysAgo: 24 },
          { text: "loving the order tracking demo, very impressed", daysAgo: 20 },
          { text: "fantastic sprint, everything on time", daysAgo: 14 },
          { text: "excellent polish on the loyalty flow", daysAgo: 8 },
          { text: "amazing work this week, really happy", daysAgo: 5 },
          { text: "great call, glad we are aligned", daysAgo: 3 },
          { text: "really pleased with the roadmap clarity", daysAgo: 1 },
        ],
        expect: { cssMin: 60, cssMax: 100, churnLevels: ["low"] },
      }),
      expected_prd: null, tags: ["retention", "retention-score"], fixture_only: true,
    },
    {
      name: "retention_seeded_month_at_risk",
      brief: JSON.stringify({
        ledger: [
          { text: "this is terrible, the storefront keeps crashing", daysAgo: 22 },
          { text: "worst week, nothing shipped on time", daysAgo: 16 },
          { text: "frustrating bugs in the tracking flow", daysAgo: 10 },
          { text: "hate the delays, feedback keeps being ignored", daysAgo: 6 },
          { text: "awful experience this sprint", daysAgo: 2 },
          { text: "unhappy with the escalation silence", daysAgo: 1 },
        ],
        expect: { cssMin: 0, cssMax: 45, churnLevels: ["high"] },
      }),
      expected_prd: null, tags: ["retention", "retention-score"], fixture_only: true,
    },
    {
      name: "dna_source_ref_after_edit",
      brief: JSON.stringify({
        source: {
          project: { name: "Storefront refresh", tagline: "faster storefront with order tracking", source_ref: "prds:p1" },
          events: [
            { date: "2026-05-01", label: "Brief received", source_ref: "briefs:b1" },
            { date: "2026-06-15", label: "Scope approved", source_ref: "briefs:b1" },
          ],
          decisions: [
            { decision: "No warehouse app in v1", dri: "PM", rationale: "kept out of scope", alternative: "split project", source_ref: "correction_deltas:p1" },
          ],
          gotchas: [{ text: "Stripe HMAC signatures are mandatory", source_ref: "prds:p1:risks" }],
          architecture: [{ text: "In scope: storefront + order tracking", source_ref: "prds:p1:scope" }],
          personas: [{ name: "Shopper", summary: "wants live tracking", needs: ["order stages"], source_ref: "artifacts:a1" }],
        },
        edit: {
          // declarative, JSON-safe: the harness appends these provenanced claims
          additions: {
            architecture: [{ text: "In scope: storefront + order tracking + loyalty", source_ref: "prds:p1:scope" }],
            decisions: [{ decision: "Loyalty added to v1", dri: "PM", rationale: "scope-up on client ask", source_ref: "correction_deltas:p1" }],
          },
          expectContains: ["Loyalty added to v1"],
        },
      }),
      expected_prd: null, tags: ["retention", "dna"], fixture_only: true,
    },
  ];
  const { count: m10Count } = await sql`
    INSERT INTO eval_cases ${sql(retentionCases)} ON CONFLICT DO NOTHING`;

  // Phase 5 (§20.5/§20.9): M11 eval cases. fixture_only.
  // -- demo: `brief` carries {projectName, sprintNo, stories[], goals[],
  //    expect:{maxSec, budgetSec}} and runs the SAME pure chain as the
  //    /api/v3/demo/generate route (buildDemoScript → planDemoAssets →
  //    assembleDemoTimeline → planVoiceover → planRenderJob). The M11 gate:
  //    a ~60-s demo script whose render job stays inside the < 5 min budget
  //    (§20.5 performance budget, §9).
  // -- qa: `brief` carries {stories[], diff, expectBugInFile} and runs the SAME
  //    chain as /api/v7/tests/generate (parseUnifiedDiff → mapDiffToAc →
  //    generateTests → estimateCoverage → buildTestPr). The M11 gate: the
  //    generated suite reaches ≥ 85% coverage on the original PR AND a unit test
  //    references the seeded-bug file (coverage report catches the seeded bug);
  //    the test-PR never auto-merges (QA-lead approval).
  const demoCases = [
    {
      name: "demo_60s_sprint_freshfold",
      brief: JSON.stringify({
        projectName: "FreshFold",
        sprintNo: 3,
        stories: [
          { feature: "Scheduled weekly delivery slots", role: "Shopper", benefit: "Never re-book a delivery window" },
          { feature: "Per-item substitution preferences", role: "Shopper", benefit: "Less out-of-stock frustration" },
          { feature: "Order tracking and delivery notifications", role: "Shopper", benefit: "Live status at a glance" },
        ],
        goals: [
          { goal: "Increase weekly order volume", kpi: "+20% orders/quarter" },
          { goal: "Cut substitution support tickets", kpi: "< 2% of orders" },
        ],
        expect: { maxSec: 60, budgetSec: 300 },
      }),
      expected_prd: null, tags: ["demo-video"], fixture_only: true,
    },
  ];
  const { count: m11DemoCount } = await sql`
    INSERT INTO eval_cases ${sql(demoCases)} ON CONFLICT DO NOTHING`;

  // The dialog fixture deliberately ships a guaranteed catch: `calculateTotal`
  // divides by length with an empty-array guard missing, and applySubstitution
  // ignores 'exact only'. The generated unit test must reference both bugs.
  const qaCases = [
    {
      name: "qa_seeded_bug_test_pr",
      brief: JSON.stringify({
        stories: [
          {
            id: "s1",
            feature: "Scheduled weekly delivery slots",
            acceptance_criteria: ["Given a shopper with a saved address, When they choose a recurring weekly slot, Then the slot is reserved", "When the shopper edits an upcoming slot, prior week slots are unaffected"],
            priority: "P0",
            source_ref: "user_stories:s1",
          },
          {
            id: "s2",
            feature: "Per-item substitution preferences",
            acceptance_criteria: ["Given an item out of stock, When the shopper sets exact only, Then the item is skipped and refunded automatically"],
            priority: "P0",
            source_ref: "user_stories:s2",
          },
        ],
        diff: [
          "diff --git a/src/order.ts b/src/order.ts",
          "index abc..def 100644",
          "--- a/src/order.ts",
          "+++ b/src/order.ts",
          "@@ -1,5 +1,7 @@",
          " export function calculateTotal(items) {",
          "-  return items.reduce((sum, i) => sum + i.price, 0);",
          "+  const total = items.reduce((sum, i) => sum + i.price, 0);",
          "+  return total / items.length;",
          " }",
          "+",
          "+export function applySubstitution(order, prefs) {",
          "+  // seeded bug: ignores 'exact only' and always suggests 'similar'",
          "+  return order.map((i) => ({ ...i, substitution: 'similar' }));",
          "+}",
          "diff --git a/src/order.test.ts b/src/order.test.ts",
          "new file mode 100644",
          "+import { calculateTotal } from './order';",
          "+it('divides by zero when empty', () => { expect(calculateTotal([])).toBeNaN(); });",
        ].join("\n"),
        expectBugInFile: "src/order.ts",
      }),
      expected_prd: null, tags: ["qa-agent"], fixture_only: true,
    },
  ];
  const { count: m11QaCount } = await sql`
    INSERT INTO eval_cases ${sql(qaCases)} ON CONFLICT DO NOTHING`;

  console.log(
    `seeded: ${talentRows} talents, ${historyCount} history rows, ${evalCount} eval cases, ${classifierCount} classifier cases, ${scopeCount} scope-intelligence cases, ${m9Count} M9 cases, ${m10Count} M10 cases, ${m11DemoCount} M11 demo cases, ${m11QaCount} M11 qa cases`
  );
  console.log(
    "NOTE: talent embeddings are NULL — run the ai-core embedding job before using match_talent."
  );
  await sql.end();
}

main().catch(async (err) => {
  console.error("seed failed:", err.message ?? err);
  await sql.end().catch(() => {});
  process.exit(1);
});

