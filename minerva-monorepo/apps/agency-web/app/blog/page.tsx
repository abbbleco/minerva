import type { Metadata } from "next";

import BlogFeed from "../sections/blog/BlogFeed";
import Match from "../sections/blog/Match";
import CmsPostFeed from "@/app/sections/cms/CmsPostFeed";
import { BlogScripts } from "../components/ContentScripts";
import { listPublishedPosts } from "@/lib/cms/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog — Useful Articles on Web & Mobile App Design | Abbble Co",
  description:
    "Practical articles on web and mobile app design: UX design quotes, mobile menu design, SaaS design guides, branding strategies and design trends.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Useful Articles on Web & Mobile App Design | Abbble Co",
    description:
      "Practical articles on web and mobile app design: UX design quotes, mobile menu design, SaaS design guides, branding strategies and design trends.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/blog`,
    siteName: "Abbble Co",
    type: "website",
  },
};

/**
 * Wave-2 cutover: CMS posts take over the index as soon as they exist;
 * the legacy Webflow feed remains the fallback (instant rollback path).
 */
export default async function BlogPage() {
  const posts = await listPublishedPosts(12);

  return (
    <div className="page-main">
      {posts.length > 0 ? (
        <CmsPostFeed posts={posts} />
      ) : (
        <>
          <BlogFeed />
          <Match />
        </>
      )}
      <BlogScripts />
    </div>
  );
}
