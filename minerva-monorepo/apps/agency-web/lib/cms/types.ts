import type { PageGroupId } from "@/lib/cms/page-groups";
import type { CmsSeo, Section } from "@/lib/cms/sections/schema";

export type { CmsSeo, ResponsiveImage, RichTextDoc, Section, SectionInput, SectionType } from "@/lib/cms/sections/schema";

/** Raw PostgREST row shape (snake_case columns from public.site_pages). */
export interface SitePageRow {
  id: string;
  slug: string;
  page_group: PageGroupId;
  title: string;
  seo: Partial<CmsSeo>;
  /** Unvalidated at the DB boundary — parse through sectionsSchema before use. */
  sections: unknown[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Validated domain shape consumed by renderers and the admin editor. */
export interface CmsPage {
  id: string;
  slug: string;
  group: PageGroupId;
  title: string;
  seo: CmsSeo;
  sections: Section[];
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
}
