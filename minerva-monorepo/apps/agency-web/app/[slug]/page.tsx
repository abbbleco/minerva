import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CmsRenderer from "@/app/sections/cms/CmsRenderer";
import {
  getCmsPage,
  listPublishedSlugs,
} from "@/lib/cms/queries";
import { buildCmsMetadata } from "@/lib/cms/page-metadata";

export const revalidate = 300;

export const dynamicParams = true;

/** Pre-render known published slugs at build; new pages render on demand. */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const slugs = await listPublishedSlugs();
    return slugs
      .filter((entry) => entry.group !== "blog_post")
      .map((entry) => ({ slug: entry.slug }));
  } catch {
    return [];
  }
}

async function loadPage(slug: string) {
  const page = await getCmsPage(slug);
  if (!page || page.group === "blog_post") notFound();
  return page;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCmsPage(slug);
  if (!page || page.group === "blog_post") return {};
  return buildCmsMetadata(page);
}

export default async function CmsPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await loadPage(slug);
  return <CmsRenderer page={page} />;
}
