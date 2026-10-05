import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CmsRenderer from "@/app/sections/cms/CmsRenderer";
import { getCmsPage, listPublishedSlugs } from "@/lib/cms/queries";
import { buildCmsMetadata } from "@/lib/cms/page-metadata";

export const revalidate = 300;

export const dynamicParams = true;

export async function generateStaticParams(): Promise<
  Array<{ slug: string }>
> {
  try {
    const slugs = await listPublishedSlugs();
    return slugs
      .filter((entry) => entry.group === "blog_post")
      .map((entry) => ({ slug: entry.slug }));
  } catch {
    return [];
  }
}

async function loadPost(slug: string) {
  const page = await getCmsPage(slug);
  if (!page || page.group !== "blog_post") notFound();
  return page;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCmsPage(slug);
  if (!page || page.group !== "blog_post") return {};
  return buildCmsMetadata(page);
}

export default async function BlogPostRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);

  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="page-main cms-scope">
      <section className="cms-section">
        <div className="cms-article-head">
          <span className="cms-eyebrow">Blog</span>
          <h1 className="cms-h1" style={{ fontSize: "clamp(32px,5vw,54px)" }}>
            {post.title}
          </h1>
          {publishedLabel ? (
            <div className="cms-article-meta">
              <span>{publishedLabel}</span>
              <span>·</span>
              <span>Abbble Co</span>
            </div>
          ) : null}
        </div>
        <CmsRenderer page={post} />
      </section>
    </div>
  );
}
