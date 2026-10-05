import type { ResponsiveImage, Section } from "@/lib/cms/sections/schema";
import { renderRichText } from "@/lib/cms/render-rich-text";

/** Shared helpers for CMS public blocks. */

const imgStyle = { background: "rgba(10,10,10,.06)" } as const;

export function ResponsiveImg({
  image,
  className,
  sizes = "(max-width: 860px) 100vw, 50vw",
  style,
}: {
  image: ResponsiveImage;
  className?: string;
  sizes?: string;
  style?: React.CSSProperties;
}) {
  const srcSet = image.responsive
    .map((variant) => `${variant.src} ${variant.width}w`)
    .join(", ");
  return (
    // Optimized by the sharp pipeline at upload time; plain img markup matches
    // the Webflow house style (no-img-element warning accepted per repo norms).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.base.src}
      srcSet={srcSet}
      sizes={sizes}
      alt={image.alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ ...imgStyle, ...style }}
    />
  );
}

export function CtasList({
  ctas,
}: {
  ctas: Array<{ label: string; href: string; style: "primary" | "ghost" }>;
}) {
  if (ctas.length === 0) return null;
  return (
    <div className="cms-ctas">
      {ctas.map((cta) => (
        <a
          key={`${cta.label}-${cta.href}`}
          href={cta.href}
          className={`cms-btn cms-btn--${cta.style}`}
        >
          {cta.label}
        </a>
      ))}
    </div>
  );
}

export function Prose({ doc }: { doc: unknown }) {
  return (
    <div
      className="cms-prose"
      // Sanitized by generateHTML (TipTap schema round-trip) — Rule 9.
      dangerouslySetInnerHTML={{ __html: renderRichText(doc) }}
    />
  );
}

export function SectionShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section className="cms-section">
      <div className="cms-container">
        {children}
        {/* House inter-section rhythm (Webflow .section-separator, 14rem) */}
        <div className="section-separator" />
      </div>
    </section>
  );
}

export function isSection(
  section: Section | undefined,
  type: Section["_type"]
): section is Extract<Section, { _type: typeof type }> {
  return section?._type === type;
}
