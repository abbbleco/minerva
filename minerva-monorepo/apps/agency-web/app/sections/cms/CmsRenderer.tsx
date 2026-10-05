import "@/css/cms-blocks.css";

import { getPageGroup, PAGE_GROUPS } from "@/lib/cms/page-groups";
import { SECTION_REGISTRY } from "@/lib/cms/sections/registry";
import type { CmsPage } from "@/lib/cms/types";

import ScriptsBundle from "./ScriptsBundle";

/**
 * Public renderer (skill Rule 7): loops the JSONB sections array and maps
 * each `_type` to its block component, then attaches the group's Webflow
 * runtime scripts so Lottie/data-* behavior keeps working.
 */
export default function CmsRenderer({ page }: { page: CmsPage }) {
  const group = PAGE_GROUPS[page.group] ?? getPageGroup(page.group);

  return (
    <div className="page-main cms-scope">
      {page.sections.map((section) => {
        const Block = SECTION_REGISTRY[section._type];
        if (!Block) return null;
        return <Block key={section._id} section={section} />;
      })}
      <ScriptsBundle id={group.scriptsComponent} />
    </div>
  );
}
