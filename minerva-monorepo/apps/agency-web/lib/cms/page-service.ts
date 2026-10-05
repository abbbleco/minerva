import "server-only";

import {
  cmsPageInputSchema,
  sectionsSchema,
  seoSchema,
  type ResponsiveImage,
  type SectionType,
} from "@/lib/cms/sections/schema";
import { findDisallowedSections, type PageGroupId } from "@/lib/cms/page-groups";
import type { SitePageRow } from "@/lib/cms/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import type { ServiceResult } from "@/lib/cms/admin-guard";

export interface PageSummary {
  id: string;
  slug: string;
  page_group: PageGroupId;
  title: string;
  is_published: boolean;
  updated_at: string;
}

const DRAFT_MAX_SECTIONS = 40;
const DRAFT_MAX_BYTES = 512 * 1024;

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

interface PagePayload {
  title: string;
  slug: string;
  seo?: unknown;
  sections?: unknown[];
}

/** Drafts tolerate WIP content; structure + allow-list are still enforced. */
function sanitizeDraftSections(sections: unknown[]): unknown[] {
  const cleaned = sections
    .filter(
      (s): s is Record<string, unknown> =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as Record<string, unknown>)._id === "string" &&
        typeof (s as Record<string, unknown>)._type === "string"
    )
    .slice(0, DRAFT_MAX_SECTIONS);
  return cleaned;
}

function assertGroupAllows(group: PageGroupId, sections: unknown[]): void {
  const types = sections.map(
    (s) => String((s as Record<string, unknown>)._type) as SectionType
  );
  const disallowed = findDisallowedSections(group, types);
  if (disallowed.length > 0) {
    throw new Error(
      `Section type(s) not allowed for this page group: ${disallowed.join(", ")}`
    );
  }
}

function assertSizeOk(sections: unknown[]): void {
  const bytes = JSON.stringify(sections).length;
  if (bytes > DRAFT_MAX_BYTES) {
    throw new Error("Page payload too large (512 KB limit)");
  }
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  let query = getSupabaseAdmin()
    .from("site_pages")
    .select("id")
    .eq("slug", slug)
    .limit(1);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }
  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

async function uniqueifySlug(slug: string, excludeId?: string): Promise<string> {
  if (!(await slugExists(slug, excludeId))) return slug;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${slug}-${n}`;
    if (!(await slugExists(candidate, excludeId))) return candidate;
  }
  throw new Error("Could not derive a unique slug");
}

// ── Reads ────────────────────────────────────────────────────────────

export async function listAllPages(): Promise<ServiceResult<PageSummary[]>> {
  const { data, error } = await getSupabaseAdmin()
    .from("site_pages")
    .select("id, slug, page_group, title, is_published, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as PageSummary[] };
}

export async function getPageById(
  id: string
): Promise<ServiceResult<SitePageRow>> {
  const { data, error } = await getSupabaseAdmin()
    .from("site_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Page not found" };
  return { ok: true, data: data as SitePageRow };
}

// ── Writes ───────────────────────────────────────────────────────────

function seedSectionsForGroup(
  group: PageGroupId
): Array<Record<string, unknown>> {
  if (group === "policy" || group === "blog_post") {
    return [
      {
        _id: crypto.randomUUID(),
        _type: "rich_text",
        doc: { type: "doc", content: [{ type: "paragraph" }] },
      },
    ];
  }
  return [
    {
      _id: crypto.randomUUID(),
      _type: "hero",
      heading: "",
      ctas: [],
    },
  ];
}

export async function createPage(
  input: { title: string; slug: string; group: PageGroupId },
  createdBy: string
): Promise<ServiceResult<{ id: string; slug: string }>> {
  try {
    const title = input.title.trim();
    if (!title) throw new Error("Title is required");
    const slug = normalizeSlug(input.slug || title);
    if (!slug) throw new Error("Slug is required");
    if (!Object.prototype.hasOwnProperty.call(PAGE_GROUP_CHECK, input.group)) {
      throw new Error("Unknown page group");
    }

    const finalSlug = await uniqueifySlug(slug);
    const sections = seedSectionsForGroup(input.group);

    const { data, error } = await getSupabaseAdmin()
      .from("site_pages")
      .insert({
        slug: finalSlug,
        page_group: input.group,
        title,
        seo: {},
        sections,
        is_published: false,
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { id: data.id, slug: finalSlug } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create failed",
    };
  }
}

const PAGE_GROUP_CHECK: Record<PageGroupId, true> = {
  home: true,
  about: true,
  contact: true,
  services: true,
  industries: true,
  solutions: true,
  works: true,
  resources: true,
  blog_post: true,
  policy: true,
  custom: true,
};

async function persistPayload(
  id: string,
  group: PageGroupId,
  payload: PagePayload,
  mode: "draft" | "publish"
): Promise<ServiceResult<{ id: string; slug: string }>> {
  try {
    const title = String(payload.title ?? "").trim();
    if (!title) throw new Error("Title is required");

    const rawSections = Array.isArray(payload.sections)
      ? payload.sections
      : [];
    assertGroupAllows(group, rawSections);

    let sectionsOut: unknown[];
    let seoOut: unknown;

    if (mode === "publish") {
      const parsed = cmsPageInputSchema.safeParse({
        title,
        slug: normalizeSlug(String(payload.slug ?? "")),
        seo: payload.seo ?? {},
        sections: rawSections,
      });
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(
          `Cannot publish — invalid content at "${first?.path.join(".") ?? "?"}": ${first?.message ?? "validation failed"}`
        );
      }
      sectionsOut = parsed.data.sections;
      seoOut = parsed.data.seo;
    } else {
      sectionsOut = sanitizeDraftSections(rawSections);
      seoOut = payload.seo ?? {};
      // Keep SEO structurally sane even in drafts.
      const seoParsed = seoSchema.safeParse(seoOut);
      seoOut = seoParsed.success ? seoParsed.data : { noindex: false };
    }

    assertSizeOk(sectionsOut);

    let fallbackSlug: string | undefined;
    if (!payload.slug) {
      const current = await getPageById(id);
      if (current.ok) fallbackSlug = current.data.slug;
    }
    const slug = normalizeSlug(String(payload.slug ?? "")) || fallbackSlug;

    if (!slug) throw new Error("Slug is required");

    const { error } = await getSupabaseAdmin()
      .from("site_pages")
      .update({
        title,
        slug,
        seo: seoOut,
        sections: sectionsOut,
      })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        throw new Error(`Slug "${slug}" is already taken`);
      }
      throw new Error(error.message);
    }
    return { ok: true, data: { id, slug } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}

export async function saveDraft(
  id: string,
  group: PageGroupId,
  payload: PagePayload
): Promise<ServiceResult<{ id: string; slug: string }>> {
  return persistPayload(id, group, payload, "draft");
}

export async function publishContent(
  id: string,
  group: PageGroupId,
  payload: PagePayload
): Promise<ServiceResult<{ id: string; slug: string }>> {
  const saved = await persistPayload(id, group, payload, "publish");
  if (!saved.ok) return saved;

  const { error } = await getSupabaseAdmin()
    .from("site_pages")
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  return saved;
}

export async function unpublishPage(id: string): Promise<ServiceResult<true>> {
  const { error } = await getSupabaseAdmin()
    .from("site_pages")
    .update({ is_published: false })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: true };
}

export async function deletePage(id: string): Promise<ServiceResult<true>> {
  const { error } = await getSupabaseAdmin()
    .from("site_pages")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: true };
}

// ── Image pipeline (skill Rule 4 — sharp, 3× WebP, never the original) ──

const WIDTHS = [640, 1024, 1920] as const;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export async function uploadResponsiveImage(
  file: File,
  alt: string,
  folder: string
): Promise<ServiceResult<ResponsiveImage>> {
  try {
    if (!alt.trim()) throw new Error("Alt text is required");
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }
    if (file.size > MAX_INPUT_BYTES) {
      throw new Error("Image exceeds the 25 MB limit");
    }

    const sharp = (await import("sharp")).default;
    const input = Buffer.from(await file.arrayBuffer());
    const baseName = crypto.randomUUID();

    const uploads = await Promise.all(
      WIDTHS.map(async (width) => {
        const webp = await sharp(input)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const meta = await sharp(webp).metadata();
        const path = `${folder}/${baseName}-${width}.webp`;
        const { error } = await getSupabaseAdmin()
          .storage.from("media")
          .upload(path, new Uint8Array(webp), {
            contentType: "image/webp",
            cacheControl: "31536000",
          });
        if (error) throw new Error(`Storage upload failed: ${error.message}`);
        const { data } = getSupabaseAdmin()
          .storage.from("media")
          .getPublicUrl(path);
        return {
          width,
          src: data.publicUrl,
          height: meta.height ?? 0,
        };
      })
    );

    const placeholderBuf = await sharp(input)
      .rotate()
      .resize({ width: 24 })
      .webp({ quality: 40 })
      .toBuffer();

    const byWidth = new Map(uploads.map((u) => [u.width, u]));
    const base = byWidth.get(1024) ?? uploads[1] ?? uploads[0];

    return {
      ok: true,
      data: {
        alt: alt.trim(),
        base: { src: base.src, width: base.width, height: base.height },
        responsive: uploads.map(({ src, width }) => ({ src, width })),
        placeholder: `data:image/webp;base64,${placeholderBuf.toString("base64")}`,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

// Re-export for actions layer convenience.
export { sectionsSchema };
