import type { Metadata } from "next";

import type { CmsPage } from "@/lib/cms/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za";

/** SEO fields come straight from the row's `seo` JSONB (plan §10). */
export function buildCmsMetadata(page: CmsPage): Metadata {
  const url = `${SITE}/${page.slug}`;
  const images = page.seo.ogImage
    ? [{ url: page.seo.ogImage.base.src, width: page.seo.ogImage.base.width }]
    : undefined;

  return {
    title: page.seo.title ?? `${page.title} | Abbble Co`,
    description: page.seo.description ?? undefined,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: page.seo.title ?? page.title,
      description: page.seo.description,
      url,
      siteName: "Abbble Co",
      images,
    },
    robots: page.seo.noindex ? { index: false, follow: false } : undefined,
  };
}
