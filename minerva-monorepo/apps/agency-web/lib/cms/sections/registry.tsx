import type { ComponentType } from "react";

import type { Section } from "@/lib/cms/sections/schema";

import HeroBlock from "@/app/sections/cms/blocks/HeroBlock";
import {
  CasesGridBlock,
  FaqBlock,
  LogoWallBlock,
  ReviewsBlock,
  TeamGridBlock,
} from "@/app/sections/cms/blocks/ListBlocks";
import {
  CtaBlock,
  RichTextBlock,
  VideoEmbedBlock,
} from "@/app/sections/cms/blocks/ContentBlocks";

/**
 * Mapper pattern (skill Rule 7): JSONB `_type` → React component.
 * Unknown types render nothing instead of crashing production routes.
 */
type AnyBlock = ComponentType<{ section: Section }>;

function typed<P extends Section>(
  Block: ComponentType<{ section: P }>
): AnyBlock {
  return Block as unknown as AnyBlock;
}

export const SECTION_REGISTRY: Record<Section["_type"], AnyBlock> = {
  hero: typed(HeroBlock),
  rich_text: typed(RichTextBlock),
  faq: typed(FaqBlock),
  reviews: typed(ReviewsBlock),
  team_grid: typed(TeamGridBlock),
  logo_wall: typed(LogoWallBlock),
  cases_grid: typed(CasesGridBlock),
  cta: typed(CtaBlock),
  video_embed: typed(VideoEmbedBlock),
};
