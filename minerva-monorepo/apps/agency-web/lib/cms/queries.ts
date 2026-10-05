import "server-only";

import {
  getPageGroup,
  type PageGroupId,
} from "@/lib/cms/page-groups";
import {
  sectionsSchema,
  seoSchema,
  type Section,
} from "@/lib/cms/sections/schema";
import type { CmsPage, SitePageRow } from "@/lib/cms/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Public-read queries (skill Rule 2): Server Components fetch via the
 * admin client — fast, RLS-bypassing, never exposed as GET APIs.
 *
 * Every query fails soft: if Supabase is unreachable OR the service env is
 * absent (e.g. CI prerender), callers get null/[] and bound routes fall back
 * to their legacy JSX. A DB outage can never 500 the marketing site.
 */

function mapRow(row: SitePageRow): CmsPage | null {
  const sections = sectionsSchema.safeParse(row.sections ?? []);
  const seo = seoSchema.safeParse(row.seo ?? {});
  if (!sections.success || !seo.success) return null;

  return {
    id: row.id,
    slug: row.slug,
    group: getPageGroup(row.page_group).id,
    title: row.title,
    seo: seo.data,
    sections: sections.data,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("site_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as SitePageRow);
  } catch {
    return null; // unconfigured env / network failure → legacy fallback
  }
}

export async function listPublishedPosts(limit = 20): Promise<CmsPage[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("site_pages")
      .select("*")
      .eq("page_group", "blog_post" satisfies PageGroupId)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? [])
      .map((row) => mapRow(row as SitePageRow))
      .filter((page): page is CmsPage => page !== null);
  } catch {
    return [];
  }
}

/** Draft preview: same validation, no published filter. Admin-only callers. */
export async function getCmsPagePreview(slug: string): Promise<CmsPage | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("site_pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as SitePageRow);
  } catch {
    return null;
  }
}

export interface PublishedSlug {
  slug: string;
  group: PageGroupId;
  updatedAt: string;
}

/** Feeds generateStaticParams + sitemap at build time. */
export async function listPublishedSlugs(): Promise<PublishedSlug[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("site_pages")
      .select("slug, page_group, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => {
      const r = row as { slug: string; page_group: string; updated_at: string };
      return {
        slug: r.slug,
        group: getPageGroup(r.page_group).id,
        updatedAt: r.updated_at,
      };
    });
  } catch {
    return [];
  }
}

export type { Section };
