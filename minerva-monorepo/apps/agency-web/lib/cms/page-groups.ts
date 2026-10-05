import { SECTION_TYPES, type SectionType } from "@/lib/cms/sections/schema";

/**
 * Page Group Registry — the backbone of page-specific editing (plan §6.2).
 * Binds every real agency-web route to an editable group and constrains which
 * section types each group may contain. The admin "+ Add section" picker reads
 * `allowedSections`; Server Actions re-assert it server-side.
 */

export type PageGroupId =
  | "home"
  | "about"
  | "contact"
  | "services"
  | "industries"
  | "solutions"
  | "works"
  | "resources"
  | "blog_post"
  | "policy"
  | "custom";

/** Real Webflow runtime script bundles in app/components. */
export type ScriptsBundleId =
  | "HomeScripts"
  | "AboutScripts"
  | "ContactScripts"
  | "ServicesScripts"
  | "IndustriesScripts"
  | "SolutionsScripts"
  | "WorksScripts"
  | "ResourcesScripts"
  | "BlogScripts"
  | "PolicyScripts"
  | "CoreScripts";

export interface PageGroupDef {
  id: PageGroupId;
  label: string;
  /** Fixed slug when the group owns a bound route; null = free slugs only. */
  boundSlug: string | null;
  /** Existing app-router route bound to this group; null until cutover. */
  boundRoute: string | null;
  /** Webflow runtime scripts bundle appended after the page's sections. */
  scriptsComponent: ScriptsBundleId;
  allowedSections: readonly SectionType[];
}

export const PAGE_GROUPS: Record<PageGroupId, PageGroupDef> = {
  home: {
    id: "home",
    label: "Home",
    boundSlug: "home",
    boundRoute: "/",
    scriptsComponent: "HomeScripts",
    allowedSections: ["hero", "video_embed", "logo_wall", "cases_grid", "cta"],
  },
  about: {
    id: "about",
    label: "About",
    boundSlug: "about",
    boundRoute: "/about",
    scriptsComponent: "AboutScripts",
    allowedSections: [
      "hero",
      "team_grid",
      "reviews",
      "logo_wall",
      "rich_text",
      "faq",
      "cta",
    ],
  },
  contact: {
    id: "contact",
    label: "Contact",
    boundSlug: "contact",
    boundRoute: "/contact",
    scriptsComponent: "ContactScripts",
    allowedSections: ["hero", "reviews", "team_grid", "rich_text", "cta"],
  },
  services: {
    id: "services",
    label: "Services",
    boundSlug: "services",
    boundRoute: null,
    scriptsComponent: "ServicesScripts",
    allowedSections: [
      "hero",
      "rich_text",
      "cases_grid",
      "reviews",
      "faq",
      "logo_wall",
      "cta",
    ],
  },
  industries: {
    id: "industries",
    label: "Industries",
    boundSlug: null,
    boundRoute: null,
    scriptsComponent: "IndustriesScripts",
    allowedSections: ["hero", "rich_text", "cases_grid", "faq", "reviews", "cta"],
  },
  solutions: {
    id: "solutions",
    label: "Solutions",
    boundSlug: null,
    boundRoute: null,
    scriptsComponent: "SolutionsScripts",
    allowedSections: ["hero", "rich_text", "cases_grid", "reviews", "faq", "cta"],
  },
  works: {
    id: "works",
    label: "Works",
    boundSlug: "works",
    boundRoute: "/works",
    scriptsComponent: "WorksScripts",
    allowedSections: ["hero", "cases_grid", "video_embed", "cta"],
  },
  resources: {
    id: "resources",
    label: "Resources",
    boundSlug: "resources-courses",
    boundRoute: "/resources-courses",
    scriptsComponent: "ResourcesScripts",
    allowedSections: ["hero", "rich_text", "cta"],
  },
  blog_post: {
    id: "blog_post",
    label: "Blog posts",
    boundSlug: null,
    boundRoute: null,
    scriptsComponent: "BlogScripts",
    // Post bodies are TipTap-first; more types join as the blog layout matures.
    allowedSections: ["rich_text"],
  },
  policy: {
    id: "policy",
    label: "Policy pages",
    boundSlug: null,
    boundRoute: null,
    scriptsComponent: "PolicyScripts",
    allowedSections: ["rich_text"],
  },
  custom: {
    id: "custom",
    label: "Custom pages",
    boundSlug: null,
    boundRoute: null,
    scriptsComponent: "CoreScripts",
    allowedSections: SECTION_TYPES,
  },
};

export const PAGE_GROUP_IDS = Object.keys(PAGE_GROUPS) as PageGroupId[];

export function isPageGroupId(value: string): value is PageGroupId {
  return Object.prototype.hasOwnProperty.call(PAGE_GROUPS, value);
}

/** Resolves any stored group value, falling back to the permissive bucket. */
export function getPageGroup(id: string): PageGroupDef {
  return isPageGroupId(id) ? PAGE_GROUPS[id] : PAGE_GROUPS.custom;
}

/** Returns the section types in `types` that `groupId` forbids (empty = ok). */
export function findDisallowedSections(
  groupId: PageGroupId,
  types: Iterable<string>
): SectionType[] {
  const allowed = new Set<string>(getPageGroup(groupId).allowedSections);
  const disallowed: SectionType[] = [];
  for (const type of types) {
    if (!allowed.has(type)) {
      disallowed.push(type as SectionType);
    }
  }
  return disallowed;
}
