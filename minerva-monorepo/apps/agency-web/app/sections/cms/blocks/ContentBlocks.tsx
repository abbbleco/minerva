import type { Section } from "@/lib/cms/sections/schema";

import { Prose, ResponsiveImg, SectionShell } from "./shared";

type RichTextSection = Extract<Section, { _type: "rich_text" }>;
type CtaSection = Extract<Section, { _type: "cta" }>;
type VideoSection = Extract<Section, { _type: "video_embed" }>;

function embedSrc(url: string): string {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/
  );
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

export function RichTextBlock({ section }: { section: RichTextSection }) {
  return (
    <SectionShell>
      <Prose doc={section.doc} />
    </SectionShell>
  );
}

export function CtaBlock({ section }: { section: CtaSection }) {
  return (
    <SectionShell>
      <div className="cms-band">
        <div>
          <h2 className="cms-h2">{section.heading}</h2>
          {section.body ? <p className="cms-sub">{section.body}</p> : null}
        </div>
        <a href={section.buttonHref} className="cms-btn cms-btn--accent">
          {section.buttonLabel}
        </a>
      </div>
    </SectionShell>
  );
}

export function VideoEmbedBlock({ section }: { section: VideoSection }) {
  return (
    <SectionShell wide>
      <div className="cms-video">
        <iframe
          src={embedSrc(section.url)}
          title="Embedded video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {section.poster ? (
        <p style={{ marginTop: 12 }}>
          <ResponsiveImg
            image={section.poster}
            sizes="100vw"
            style={{ borderRadius: "var(--cms-radius)" }}
          />
        </p>
      ) : null}
    </SectionShell>
  );
}
