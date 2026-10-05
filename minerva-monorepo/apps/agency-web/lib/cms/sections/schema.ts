import { z } from "zod";

/**
 * CMS section schemas — single source of truth for runtime validation AND
 * static types (z.infer). Governed by supabase-cms-skill:
 *   Rule 3  JSONB sections array, no per-section tables
 *   Rule 9  rich text is TipTap JSON — raw HTML strings are forbidden
 */

/** http(s) URL or site-relative path — blocks javascript:/data: hrefs. */
const hrefSchema = z
  .string()
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\/\S+$/.test(value),
    "Must be a site-relative path or an http(s) URL"
  );

/** Embed URL restricted to known video hosts. */
const embedUrlSchema = z
  .string()
  .refine(
    (value) =>
      /^https:\/\/(www\.)?(youtube\.com\/|youtu\.be\/|player\.vimeo\.com\/|vimeo\.com\/)/.test(
        value
      ),
    "Only YouTube or Vimeo embed URLs are allowed"
  );

/** TipTap JSON document (never raw HTML — skill Rule 9). */
export const richTextDocSchema = z.custom<Record<string, unknown>>(
  (value) => typeof value === "object" && value !== null && "type" in value,
  { message: "Expected a TipTap JSON document" }
);
export type RichTextDoc = Record<string, unknown>;

export const responsiveImageSchema = z.object({
  alt: z.string().min(1),
  base: z.object({
    src: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  responsive: z
    .array(
      z.object({
        src: z.string().min(1),
        width: z.number().int().positive(),
      })
    )
    .length(3),
  placeholder: z.string().optional(),
});
export type ResponsiveImage = z.output<typeof responsiveImageSchema>;

export const heroSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("hero"),
  eyebrow: z.string().optional(),
  heading: z.string().min(1),
  subheading: z.string().optional(),
  image: responsiveImageSchema.optional(),
  ctas: z
    .array(
      z.object({
        label: z.string().min(1),
        href: hrefSchema,
        style: z.enum(["primary", "ghost"]),
      })
    )
    .max(2)
    .default([]),
});

export const richTextSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("rich_text"),
  doc: richTextDocSchema,
});

export const faqSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("faq"),
  heading: z.string().min(1),
  items: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: richTextDocSchema,
      })
    )
    .min(1),
});

export const reviewsSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("reviews"),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        quote: z.string().min(1),
        author: z.string().min(1),
        role: z.string().optional(),
        avatar: responsiveImageSchema.optional(),
        source: z.string().optional(),
      })
    )
    .min(1),
});

export const teamGridSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("team_grid"),
  heading: z.string().optional(),
  members: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        photo: responsiveImageSchema,
        bio: z.string().optional(),
        linkedin: hrefSchema.optional(),
      })
    )
    .min(1),
});

export const logoWallSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("logo_wall"),
  heading: z.string().optional(),
  logos: z.array(responsiveImageSchema).min(1),
});

export const casesGridSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("cases_grid"),
  heading: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string().min(1),
      client: z.string().min(1),
      href: hrefSchema,
      cover: responsiveImageSchema,
      tags: z.array(z.string()).default([]),
    })
  ),
});

export const ctaSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("cta"),
  heading: z.string().min(1),
  body: z.string().optional(),
  buttonLabel: z.string().min(1),
  buttonHref: hrefSchema,
});

export const videoEmbedSchema = z.object({
  _id: z.string().min(1),
  _type: z.literal("video_embed"),
  url: embedUrlSchema,
  poster: responsiveImageSchema.optional(),
});

export const sectionSchema = z.discriminatedUnion("_type", [
  heroSchema,
  richTextSchema,
  faqSchema,
  reviewsSchema,
  teamGridSchema,
  logoWallSchema,
  casesGridSchema,
  ctaSchema,
  videoEmbedSchema,
]);

/** Validated section (output shape — defaults applied). */
export type Section = z.output<typeof sectionSchema>;
/** Form/editor input shape (defaults optional). */
export type SectionInput = z.input<typeof sectionSchema>;
export type SectionType = Section["_type"];

/** Compile-time guard keeping the literal list in sync with the union. */
export const SECTION_TYPES = [
  "hero",
  "rich_text",
  "faq",
  "reviews",
  "team_grid",
  "logo_wall",
  "cases_grid",
  "cta",
  "video_embed",
] as const satisfies readonly SectionType[];

/** Hard cap keeps the JSONB column sane; images are by-reference URLs only. */
export const sectionsSchema = z.array(sectionSchema).max(40);

export const seoSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(320).optional(),
  ogImage: responsiveImageSchema.optional(),
  noindex: z.boolean().default(false),
});
export type CmsSeo = z.output<typeof seoSchema>;

export const pageSlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be a lowercase kebab-slug");

export const cmsPageInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: pageSlugSchema,
  seo: seoSchema.default({ noindex: false }),
  sections: sectionsSchema.default([]),
});
export type CmsPageInput = z.input<typeof cmsPageInputSchema>;
