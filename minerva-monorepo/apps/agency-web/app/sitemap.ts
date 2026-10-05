import type { MetadataRoute } from "next";

import { listPublishedSlugs } from "@/lib/cms/queries";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za";

const STATIC_ROUTES = [
  "",
  "/about",
  "/contact",
  "/blog",
  "/works",
  "/resources-courses",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    ...STATIC_ROUTES.map((path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
  ];

  try {
    const cmsPages = await listPublishedSlugs();
    for (const page of cmsPages) {
      if (STATIC_ROUTES.includes(`/${page.slug}`)) continue;
      entries.push({
        url: `${BASE}/${page.slug}`,
        lastModified: new Date(page.updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // CMS unreachable at build time — static routes still ship.
  }

  return entries;
}
