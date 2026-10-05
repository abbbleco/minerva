import type { Section } from "@/lib/cms/sections/schema";
import { renderRichText } from "@/lib/cms/render-rich-text";

import { ResponsiveImg, SectionShell } from "./shared";

type Faq = Extract<Section, { _type: "faq" }>;
type Reviews = Extract<Section, { _type: "reviews" }>;
type Team = Extract<Section, { _type: "team_grid" }>;
type Logos = Extract<Section, { _type: "logo_wall" }>;
type Cases = Extract<Section, { _type: "cases_grid" }>;

export function FaqBlock({ section }: { section: Faq }) {
  return (
    <SectionShell>
      {section.heading ? <h2 className="cms-h2">{section.heading}</h2> : null}
      <div className="cms-faq" style={{ marginTop: 24 }}>
        {section.items.map((item, i) => (
          // Native disclosure — no JS dependency on CMS-only pages.
          <details key={i} className="cms-faq-item">
            <summary className="cms-faq-q">{item.question}</summary>
            <div
              className="cms-faq-a"
              // Sanitized via TipTap schema round-trip.
              dangerouslySetInnerHTML={{ __html: renderRichText(item.answer) }}
            />
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

export function ReviewsBlock({ section }: { section: Reviews }) {
  return (
    <SectionShell>
      {section.heading ? <h2 className="cms-h2">{section.heading}</h2> : null}
      <div className="cms-grid" style={{ marginTop: 32 }}>
        {section.items.map((item, i) => (
          <figure key={i} className="cms-card" style={{ margin: 0 }}>
            <blockquote className="cms-quote">“{item.quote}”</blockquote>
            <figcaption className="cms-person">
              {item.avatar ? (
                <ResponsiveImg image={item.avatar} sizes="44px" style={{ width: 44, height: 44 }} />
              ) : null}
              <span>
                <span className="cms-name tw:block" style={{ display: "block" }}>
                  {item.author}
                </span>
                {item.role ? (
                  <span className="cms-role" style={{ display: "block" }}>
                    {item.role}
                    {item.source ? ` · ${item.source}` : ""}
                  </span>
                ) : null}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}

export function TeamGridBlock({ section }: { section: Team }) {
  return (
    <SectionShell>
      {section.heading ? <h2 className="cms-h2">{section.heading}</h2> : null}
      <div className="cms-grid" style={{ marginTop: 32 }}>
        {section.members.map((member, i) => (
          <div key={i} className="cms-card">
            <ResponsiveImg image={member.photo} sizes="(max-width: 980px) 50vw, 33vw" />
            <div>
              <span className="cms-name" style={{ display: "block" }}>
                {member.name}
              </span>
              <span className="cms-role" style={{ display: "block" }}>
                {member.role}
              </span>
            </div>
            {member.bio ? (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--cms-ink-soft)", margin: 0 }}>
                {member.bio}
              </p>
            ) : null}
            {member.linkedin ? (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="cms-btn cms-btn--ghost"
                style={{ alignSelf: "flex-start", padding: "9px 16px", fontSize: 13 }}
              >
                LinkedIn ↗
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function LogoWallBlock({ section }: { section: Logos }) {
  return (
    <SectionShell>
      {section.heading ? (
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--cms-ink-soft)",
            marginBottom: 20,
          }}
        >
          {section.heading}
        </p>
      ) : null}
      <div className="cms-logo-row">
        {section.logos.map((logo, i) => (
          <ResponsiveImg key={i} image={logo} sizes="140px" />
        ))}
      </div>
    </SectionShell>
  );
}

export function CasesGridBlock({ section }: { section: Cases }) {
  return (
    <SectionShell wide>
      {section.heading ? <h2 className="cms-h2">{section.heading}</h2> : null}
      <div className="cms-grid" style={{ marginTop: 32 }}>
        {section.items.map((item, i) => (
          <a
            key={i}
            href={item.href}
            className="cms-card"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <ResponsiveImg image={item.cover} sizes="(max-width: 980px) 50vw, 33vw" />
            <span className="cms-tags">
              {(item.tags ?? []).map((tag) => (
                <span key={tag} className="cms-tag">
                  {tag}
                </span>
              ))}
            </span>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{item.title}</span>
            <span className="cms-role">{item.client}</span>
          </a>
        ))}
      </div>
    </SectionShell>
  );
}
