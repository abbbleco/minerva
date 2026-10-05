/* eslint-disable */
// Seed the CMS (P6 waves 1–2). Run:  node scripts/seed-cms.cjs
// Requires env SUPABASE_DB_URL (session-pooler connection string) and pg resolvable.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const APP = path.resolve(__dirname, "..");

// ── TipTap JSON builders ─────────────────────────────────────────────
const para = (text) => ({
  type: "paragraph",
  content: text ? [{ type: "text", text }] : undefined,
});
const heading = (level, text) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});
const doc = (nodes) => ({ type: "doc", content: nodes });

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&rarr;|&rightarrow;/g, "->")
    .replace(/&larr;/g, "<-");
}

/** Extract headings/paragraphs from a Webflow-derived section TSX. */
function extractDoc(relPath) {
  const lines = fs
    .readFileSync(path.join(APP, relPath), "utf8")
    .split("\n")
    .filter((l) => l.length <= 400); // drop base64 data-URI padding lines
  const body = lines.join("\n");

  const nodes = [];
  const blockRe = /<(h1|h2|h3|h4|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = blockRe.exec(body))) {
    const tag = m[1].toLowerCase();
    let inner = m[2]
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
      .replace(/<[^>]+>/g, "");
    inner = decodeEntities(inner).replace(/\s+/g, " ").trim();
    if (!inner) continue;
    if (tag === "h1" || tag === "h2") nodes.push(heading(2, inner));
    else if (tag === "h3") nodes.push(heading(3, inner));
    else nodes.push(para(inner));
  }
  return doc(nodes.length ? nodes : [para("")]);
}

const POLICIES = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy | Abbble Co",
    description:
      "How Abbble Co collects, uses, and protects your personal data — definitions, data types, usage, retention, transfer, disclosure, and security practices.",
    section: "app/sections/policy/PrivacyPolicy.tsx",
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy | Abbble Co",
    description:
      "Learn how Abbble Co uses cookies and trackers, how you can control them, and your rights regarding third-party trackers.",
    section: "app/sections/policy/CookiePolicy.tsx",
  },
  {
    slug: "editorial-policy",
    title: "Editorial Policy | Abbble Co",
    description:
      "Abbble Co's editorial guidelines — principles, ethics, editorial process, quality standards, corrections, and authorship of our published content.",
    section: "app/sections/policy/EditorialPolicy.tsx",
  },
];

const POSTS = [
  {
    slug: "sample-product-discovery-sprints",
    title: "How Abbble Co Runs Product Discovery Sprints",
    body: [
      heading(2, "Why discovery first"),
      para(
        "Every engagement at Abbble Co starts with discovery because building the wrong thing fast is still waste. A discovery sprint compresses stakeholder interviews, market scanning, and technical feasibility into a single working week."
      ),
      heading(2, "The five-day shape"),
      para(
        "Day one maps the problem space with founders and users. Day two prototypes the riskiest assumption. Days three and four test with real users, and day five converges on a scoped build plan with effort estimates."
      ),
      heading(2, "What you leave with"),
      para(
        "You keep the research recordings, a validated prototype, a prioritised backlog, and a fixed-price build proposal — whether or not you continue with us."
      ),
      heading(2, "Next step"),
      para(
        "This article is seeded as CMS sample content. Edit or unpublish it from /admin once real posts land."
      ),
    ],
  },
  {
    slug: "sample-design-systems-that-survive-handoff",
    title: "Design Systems That Survive Handoff",
    body: [
      heading(2, "Handoff is a design problem"),
      para(
        "Most design debt is born at handoff. When tokens live in Figma styles but not in code, every screen becomes an interpretation exercise."
      ),
      heading(2, "Tokens are the contract"),
      para(
        "We ship colour, spacing, and type tokens alongside components so engineering inherits decisions, not screenshots. A token rename should be a single commit, not a sprint."
      ),
      heading(2, "Governance beats documentation"),
      para(
        "A weekly thirty-minute review where design and engineering accept or reject new patterns keeps the system alive long after launch."
      ),
      heading(2, "Next step"),
      para(
        "This article is seeded as CMS sample content. Replace it with your editorial calendar output when ready."
      ),
    ],
  },
];

const DRAFT_SHELLS = [
  { slug: "home", group: "home", title: "Home", route: "/" },
  { slug: "about", group: "about", title: "About Us | Abbble Co", route: "/about" },
  { slug: "contact", group: "contact", title: "Contact | Abbble Co", route: "/contact" },
  { slug: "works", group: "works", title: "Works | Abbble Co", route: "/works" },
  {
    slug: "resources-courses",
    group: "resources",
    title: "Resources & Courses | Abbble Co",
    route: "/resources-courses",
  },
];

const heroSeed = (title) => [
  {
    _id: crypto.randomUUID(),
    _type: "hero",
    eyebrow: "",
    heading: title,
    ctas: [],
  },
];
const richSeed = () => [
  { _id: crypto.randomUUID(), _type: "rich_text", doc: doc([para("")]) },
];

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL env required");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  let inserted = 0;

  async function upsert(row) {
    const res = await client.query(
      `insert into public.site_pages
         (slug, page_group, title, seo, sections, is_published, published_at)
       values ($1,$2,$3,$4::jsonb,$5::jsonb,$6,
               case when $6 then now() else null end)
       on conflict (slug) do nothing
       returning slug`,
      [
        row.slug,
        row.group,
        row.title,
        JSON.stringify(row.seo ?? {}),
        JSON.stringify(row.sections ?? []),
        row.published === true,
      ]
    );
    inserted += res.rowCount ?? 0;
  }

  for (const p of POLICIES) {
    await upsert({
      slug: p.slug,
      group: "policy",
      title: p.title.replace(" | Abbble Co", ""),
      seo: { title: p.title, description: p.description },
      sections: richSeed().map((s) => ({ ...s, doc: extractDoc(p.section) })),
      published: true,
    });
  }

  for (const post of POSTS) {
    await upsert({
      slug: post.slug,
      group: "blog_post",
      title: post.title,
      seo: {
        title: `${post.title} | Abbble Co`,
        description: post.body.find((n) => n.type === "paragraph")?.content?.[0]?.text ?? "",
      },
      sections: [{ _id: crypto.randomUUID(), _type: "rich_text", doc: doc(post.body) }],
      published: true,
    });
  }

  for (const shell of DRAFT_SHELLS) {
    await upsert({
      slug: shell.slug,
      group: shell.group,
      title: shell.title,
      seo: {},
      sections: shell.group === "policy" || shell.group === "blog_post" ? richSeed() : heroSeed(shell.title),
      published: false,
    });
  }

  console.log(`SEED OK — ${inserted} new row(s), existing rows skipped`);
  await client.end();
}

main().catch((err) => {
  console.error("SEED FAILED:", err.message);
  process.exit(1);
});
