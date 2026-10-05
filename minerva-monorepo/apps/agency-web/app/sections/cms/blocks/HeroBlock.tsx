import type { Section } from "@/lib/cms/sections/schema";

import { CtasList, ResponsiveImg, SectionShell } from "./shared";

type HeroSection = Extract<Section, { _type: "hero" }>;

export default function HeroBlock({ section }: { section: HeroSection }) {
  return (
    <SectionShell>
      <div className="cms-hero">
        <div>
          {section.eyebrow ? (
            <span className="cms-eyebrow">{section.eyebrow}</span>
          ) : null}
          <h1 className="cms-h1">{section.heading}</h1>
          {section.subheading ? (
            <p className="cms-sub">{section.subheading}</p>
          ) : null}
          <CtasList ctas={section.ctas ?? []} />
        </div>
        {section.image ? (
          <div className="cms-hero-media">
            <ResponsiveImg
              image={section.image}
              sizes="(max-width: 860px) 100vw, 46vw"
            />
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
