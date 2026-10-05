import Link from "next/link";

import type { CmsPage } from "@/lib/cms/types";

function excerpt(post: CmsPage, max = 150): string {
  for (const section of post.sections) {
    if (section._type !== "rich_text") continue;
    const content = (section.doc as { content?: unknown })?.content;
    if (!Array.isArray(content)) continue;
    for (const node of content) {
      const n = node as { type?: string; content?: Array<{ text?: string }> };
      if (n.type === "paragraph" && Array.isArray(n.content)) {
        const text = n.content
          .map((child) => child.text ?? "")
          .join("")
          .trim();
        if (text) {
          return text.length > max ? `${text.slice(0, max - 1)}…` : text;
        }
      }
    }
  }
  return "";
}

/**
 * Wave-2 blog index: renders when CMS posts exist, letting the legacy
 * Webflow feed retire gradually without a hard switch.
 */
export default function CmsPostFeed({ posts }: { posts: CmsPage[] }) {
  return (
    <section className="cms-section" style={{ paddingTop: 48 }}>
      <div className="cms-container">
        <span className="cms-eyebrow">Blog</span>
        <h1 className="cms-h1">Useful articles</h1>
        <div className="cms-grid">
          {posts.map((post) => {
            const date = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : null;
            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="cms-post-card"
              >
                <span className="cms-tags">
                  {date ? <span className="cms-tag">{date}</span> : null}
                </span>
                <span style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.25 }}>
                  {post.title}
                </span>
                <span
                  style={{ fontSize: 14, lineHeight: 1.6, color: "var(--cms-ink-soft)" }}
                >
                  {excerpt(post)}
                </span>
                <span className="cms-name" style={{ color: "var(--cms-ink)" }}>
                  Read article →
                </span>
              </Link>
            );
          })}
        </div>
        <div className="section-separator" />
      </div>
    </section>
  );
}
